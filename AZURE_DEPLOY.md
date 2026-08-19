# Deploy do backend no Azure

Este documento descreve a infraestrutura criada no Azure para hospedar o backend do Academia App, o que cada peça faz, onde está configurada no repositório, e como fazer um novo deploy quando o código do backend mudar.

## Visão geral

```
Celular (app mobile)
      │  HTTPS
      ▼
Azure App Service (Web App for Containers)
"academia-app-backend"  →  academia-app-backend.azurewebsites.net
      │  puxa a imagem
      ▼
Azure Container Registry (ACR)
"academiaappacr.azurecr.io"
      │  conexão psycopg2 (SSL)
      ▼
Azure Database for PostgreSQL — Flexible Server
"academia-app-db"
```

O backend roda como um container Docker (FastAPI + Uvicorn) dentro de um Azure App Service. A imagem do container fica armazenada no Azure Container Registry. Os dados ficam em um PostgreSQL gerenciado pelo Azure. Tudo dentro da subscription **Azure for Students** de Fernando.

## Recursos criados

Todos dentro do resource group **`academia-app-rg`**.

| Recurso | Nome | Região | O que é / pra que serve |
|---|---|---|---|
| Resource Group | `academia-app-rg` | Brazil South | Agrupa todos os recursos abaixo, facilita gerenciar/deletar tudo junto |
| Container Registry | `academiaappacr` (`academiaappacr.azurecr.io`) | East US | Guarda a imagem Docker do backend. SKU Basic. Autenticação por usuário/senha (admin habilitado) |
| PostgreSQL Flexible Server | `academia-app-db` | Central US | Banco de dados de produção. SKU `Standard_B1ms` (Burstable), 32GB, PostgreSQL 15. Substitui o SQLite usado em desenvolvimento local |
| App Service Plan | `academia-app-plan` | Central US | O "servidor" (VM compartilhada) que hospeda o Web App. Linux, SKU B1 (Basic) |
| Web App | `academia-app-backend` | Central US | O serviço que efetivamente roda o container do backend. URL pública: `https://academia-app-backend.azurewebsites.net` |

**Por que as regiões estão misturadas (Brazil South / East US / Central US):** a política da subscription de estudante bloqueia a criação de vários tipos de recurso em Brazil South e em algumas outras regiões ("This policy maintains a set of best available regions..."). Foi necessário testar regiões alternativas até encontrar uma liberada para cada recurso. O resource group em si ficou em Brazil South (permitido), mas ACR só foi aceito em East US, e o banco/App Service só em Central US. Isso introduz uma latência extra entre o App Service (Central US) e o ACR (East US) ao puxar a imagem, e entre o usuário no Brasil e os servidores nos EUA — aceitável para um projeto de TCC, mas não seria a escolha ideal em produção real.

## Containerização

- **`backend/Dockerfile`**: define a imagem do backend. Usa `python:3.11-slim`, instala `libgl1` e `libglib2.0-0` (dependências nativas do OpenCV/MediaPipe, que senão falham em runtime), instala os pacotes de `backend/requirements.txt`, copia o código de `backend/` e a pasta `model/` (os arquivos `.pkl` do detector de exercícios) para dentro da imagem, e sobe com `uvicorn main:app --host 0.0.0.0 --port 8000`.
- **`.dockerignore`** (na raiz do projeto): evita mandar `venv/`, `mobile/`, `.git/`, bancos SQLite locais etc. para dentro do contexto de build — mantém a imagem menor e o build mais rápido.

**Importante:** o *build context* do Docker é a **raiz do projeto** (`academia_app/`), não `backend/`. Isso é necessário porque os modelos `.pkl` usados pelo detector ficam em `model/`, um nível acima de `backend/`, e o Dockerfile precisa acessar os dois. Por isso o comando de build sempre precisa ser rodado da raiz do repo:

```bash
cd academia_app
docker build -f backend/Dockerfile -t academia-app-backend:latest .
```

## Variáveis de ambiente (App Settings do Web App)

Configuradas em `academia-app-backend` (Configuration → Application settings no portal, ou `az webapp config appsettings`):

| Variável | Para que serve |
|---|---|
| `WEBSITES_PORT` | Diz ao Azure em qual porta o container escuta (8000) — sem isso o Azure não sabe rotear as requisições pro container |
| `DATABASE_URL` | String de conexão do PostgreSQL (`postgresql://academiaadmin:***@academia-app-db.postgres.database.azure.com:5432/academiadb?sslmode=require`) |
| `SECRET_KEY` | Chave usada para assinar os JWTs de autenticação (gerada com `openssl rand -hex 32`, diferente da chave usada em desenvolvimento local) |
| `ALGORITHM` | Algoritmo do JWT (`HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Validade do token de login (`10080` = 7 dias) |
| `DOCKER_REGISTRY_SERVER_URL/USERNAME/PASSWORD` | Credenciais que o Web App usa pra puxar a imagem do ACR (preenchidas automaticamente ao configurar o container) |

Essas variáveis fazem o mesmo papel do arquivo `backend/.env` usado em desenvolvimento local — só que vivem na configuração do Azure em vez de um arquivo, já que o `.env` não vai dentro da imagem (está no `.dockerignore`/`.gitignore`).

## Banco de dados

- Servidor: `academia-app-db.postgres.database.azure.com`, usuário `academiaadmin`, banco `academiadb`.
- **Regras de firewall** (controlam quem pode conectar no Postgres):
  - `AllowAllAzureServicesAndResourcesWithinAzureIps...`: regra especial do Azure que libera conexões vindas de dentro da rede do Azure (é assim que o Web App consegue falar com o banco).
  - `AllowMyIP`: libera o IP público de casa do Fernando (`187.106.12.220`), usado só para rodar migrations do Alembic diretamente da máquina de desenvolvimento. **Esse IP muda se a rede/operadora mudar** — se parar de conseguir conectar pra rodar migration, é provável que seja isso; refazer com `az postgres flexible-server firewall-rule create`.
- **Migrations (Alembic):** o banco do Azure foi sincronizado com o histórico do Alembic via `alembic stamp head` (banco já tinha as tabelas criadas por `Base.metadata.create_all()`, então só marcamos a revision atual sem reexecutar nada) e depois `alembic upgrade head` normalmente a partir daí. Para rodar uma nova migration contra o Azure:

```bash
cd backend
export DATABASE_URL="postgresql://academiaadmin:<senha>@academia-app-db.postgres.database.azure.com:5432/academiadb?sslmode=require"
venv/bin/alembic upgrade head
```

## Deploy de uma mudança no backend

Sempre que o código em `backend/` mudar, os passos são:

```bash
cd academia_app   # raiz do projeto, não backend/

# 1. Build da imagem
docker build -f backend/Dockerfile -t academia-app-backend:latest .

# 2. Tag apontando pro ACR (OBRIGATÓRIO antes de todo push — ver nota abaixo)
docker tag academia-app-backend:latest academiaappacr.azurecr.io/academia-app-backend:latest

# 3. Push pro registry
docker push academiaappacr.azurecr.io/academia-app-backend:latest

# 4. Forçar o Azure a puxar a imagem nova
az webapp config container set \
  --resource-group academia-app-rg \
  --name academia-app-backend \
  --container-image-name academiaappacr.azurecr.io/academia-app-backend:latest

# 5. Reiniciar
az webapp restart --resource-group academia-app-rg --name academia-app-backend
```

**Duas pegadinhas descobertas na prática, importantes de não esquecer:**

1. **Passo 2 (`docker tag`) não é opcional.** Se você rebuildar a imagem local (`docker build ...`) mas esquecer de refazer o `tag` antes do `push`, o Docker reenvia a referência antiga pro ACR — ou seja, o Azure continua rodando código velho mesmo depois do push "funcionar" sem erro. Isso já causou um deploy silenciosamente desatualizado durante o desenvolvimento.
2. **Passo 4 (`az webapp config container set`) também não é opcional.** Rodar só `az webapp restart` reinicia o container mas **não força um novo pull da imagem `:latest`** — o Azure reaproveita a imagem que já tinha em cache local. Sem o passo 4, o restart sozinho não aplica as mudanças, mesmo com a imagem certa já publicada no ACR.

Depois do restart, é bom conferir se subiu certo:

```bash
curl -s https://academia-app-backend.azurewebsites.net/
curl -s https://academia-app-backend.azurewebsites.net/docs -o /dev/null -w "%{http_code}\n"
```

Se algo der 500, os logs do container dão o traceback real:

```bash
az webapp log config --resource-group academia-app-rg --name academia-app-backend --docker-container-logging filesystem
az webapp log tail --resource-group academia-app-rg --name academia-app-backend
```

## Mobile (app React Native / Expo)

`mobile/eas.json`, perfil `preview`, aponta as variáveis de ambiente do app pro backend do Azure:

```json
"env": {
  "EXPO_PUBLIC_API_URL": "https://academia-app-backend.azurewebsites.net",
  "EXPO_PUBLIC_WS_URL": "wss://academia-app-backend.azurewebsites.net"
}
```

Isso é lido em `mobile/src/config.js` via `process.env.EXPO_PUBLIC_API_URL`/`WS_URL`. Builds geradas com `eas build --profile preview` já saem configuradas pra falar com o Azure, funcionando em qualquer rede (Wi-Fi, dados móveis) — diferente da configuração inicial do projeto, que usava o IP local da rede doméstica e só funcionava na mesma Wi-Fi do computador de desenvolvimento.

## Credenciais

Guardadas em `~/Área de trabalho/academia-app-credenciais-azure.txt` (permissão `600`, não versionado no git): senha do Postgres, `SECRET_KEY`, dados do ACR e URLs. **Não commitar esse arquivo nem subir pra lugar nenhum público.**

A senha do ACR chegou a aparecer em texto puro numa sessão de terminal em algum momento do desenvolvimento — como boa prática, vale rotacionar com `az acr credential renew --name academiaappacr --password-name password` se ainda não foi feito.

## Limitações conhecidas / pontos de atenção

- **Recursos espalhados entre regiões** (ver seção "Recursos criados") por causa das restrições da subscription de estudante — não é a topologia ideal, mas foi o que a subscription permitiu.
- **Custo:** todos os recursos usados (ACR Basic, PostgreSQL Burstable B1ms, App Service Plan B1) são pagos, consumindo o crédito da assinatura Azure for Students (não são tier gratuito/F1). Vale acompanhar o consumo em Cost Management no portal do Azure pra não zerar o crédito antes do previsto.
- **Verificação de e-mail por código foi avaliada e revertida:** chegou a ser implementada (Gmail SMTP → bloqueado por restrições de conta nova do Google → Resend.com → bloqueado por exigir domínio próprio verificado para enviar a destinatários arbitrários) e depois desfeita por completo, para não colocar em risco a apresentação do TCC. Não há vestígios dela no código atual.
- **Upload de vídeo do detector** depende da qualidade de rede do celular (o app manda o vídeo gravado pro backend processar) — em rede mais lenta, a análise demora mais, mas funciona independente da rede.
