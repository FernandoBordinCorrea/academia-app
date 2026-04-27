# Academia App

App de gerenciamento de treinos com detector de exercícios via câmera usando IA.

## Funcionalidades

- Cadastro e autenticação de usuários
- Gerenciamento de exercícios e treinos
- Sessões de treino com timer e cálculo de calorias
- Calendário com histórico de treinos
- Detector de Elevação Frontal (Front Raise) em tempo real via câmera

## Pré-requisitos

- Python 3.10+
- Node.js 18+
- Expo Go instalado no celular ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
- Celular e computador na **mesma rede Wi-Fi**

---

## 1. Backend

```bash
cd backend

# Criar e ativar o ambiente virtual (apenas na primeira vez)
python3 -m venv venv
source venv/bin/activate        # Linux/macOS
# venv\Scripts\activate         # Windows

# Instalar dependências (apenas na primeira vez)
pip install -r requirements.txt

# Criar o arquivo de variáveis de ambiente (apenas na primeira vez)
cp .env.example .env            # edite se quiser trocar a SECRET_KEY

# Rodar o servidor
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

O backend estará disponível em `http://<seu-ip>:8000`.  
A documentação interativa da API fica em `http://<seu-ip>:8000/docs`.

---

## 2. Mobile

### Configurar o IP

Edite o arquivo `mobile/src/config.js` e coloque o IP local da sua máquina:

```js
const API_URL = 'http://<seu-ip>:8000';
const WS_URL  = 'ws://<seu-ip>:8000';
```

Para descobrir seu IP:
- **Linux/macOS**: `hostname -I`
- **Windows**: `ipconfig`

### Rodar o app

```bash
cd mobile

# Instalar dependências (apenas na primeira vez)
npm install

# Iniciar o Expo
npx expo start
```

Escaneie o QR code com o Expo Go (Android) ou com a câmera do iPhone (iOS).

---

## Estrutura do projeto

```
academia_app/
├── backend/        API REST + WebSocket (FastAPI)
│   ├── routes/     Endpoints: users, exercises, workouts, sessions, detector
│   ├── models/     Modelos do banco de dados (SQLAlchemy)
│   ├── schemas/    Schemas de validação (Pydantic)
│   └── auth/       Autenticação JWT
├── mobile/         App React Native (Expo)
│   └── src/
│       ├── screens/    Telas do app
│       ├── navigation/ Rotas de navegação
│       ├── context/    AuthContext, ModalContext
│       └── services/   Cliente HTTP (Axios)
└── model/          Modelo ML de detecção de exercício (scikit-learn + MediaPipe)
```

## Variáveis de ambiente (backend)

Crie o arquivo `backend/.env` com o seguinte conteúdo:

```env
SECRET_KEY=troque_por_uma_chave_secreta_forte
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
DATABASE_URL=sqlite:///./academia.db
```
