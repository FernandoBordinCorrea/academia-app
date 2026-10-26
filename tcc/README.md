# TCC — Um Aplicativo Móvel para Gerenciamento de Treinos com Detecção da Qualidade de Execução de Exercícios via Visão Computacional

Trabalho de Conclusão de Curso em Engenharia da Computação, PUC Campinas.

- **Aluno:** Fernando Bordin Correa
- **Orientador(a):** Antonio Paulo Salgado Forster

## Resumo

Este trabalho descreve o desenvolvimento do Academia App (pasta raiz deste
repositório): um aplicativo móvel de gerenciamento de treinos que também
detecta, a partir de vídeo do celular, se uma repetição de um exercício foi
executada corretamente. O sistema estima a pose do usuário com o MediaPipe e
classifica o quadro de pico de cada repetição com um modelo supervisionado por
exercício (Random Forest na elevação frontal; escolha por validação cruzada
entre Random Forest, Gradient Boosting e SVM na rosca bíceps). O artigo cobre
a arquitetura do sistema, a implantação em nuvem (Microsoft Azure) e as
limitações encontradas no dataset de treino e no protocolo de avaliação —
incluindo uma lacuna de cobertura de amplitude de movimento e um descasamento
entre a amostragem usada no treino e a usada na inferência.

## Conteúdo desta pasta

```
tcc/
├── artigo/            Artigo em formato SBC, com citações e referências em
│                       conformidade com a ABNT (NBR 10520/6023)
│   ├── artigo.tex          Fonte LaTeX
│   ├── artigo.pdf           PDF compilado (versão final)
│   ├── referencias.bib      Bibliografia
│   ├── sbc-template.sty /
│   │   sbc.bst              Template e estilo de bibliografia oficiais da SBC
│   ├── diagrama_*.jpg        Diagramas (arquitetura do sistema, casos de uso)
│   └── gerar_diagrama_*.py   Scripts que geram os diagramas acima
│
└── apresentacao/       Slides para a defesa
    ├── Apresentacao_TCC.pptx    Apresentação final (editável)
    ├── Apresentacao_TCC.pdf     Mesma apresentação, em PDF
    └── gerar_apresentacao.py    Script que gera o .pptx a partir do conteúdo do artigo
```

## Recompilando o artigo

```bash
cd tcc/artigo
pdflatex -interaction=nonstopmode artigo.tex
bibtex artigo
pdflatex -interaction=nonstopmode artigo.tex
pdflatex -interaction=nonstopmode artigo.tex
```

Requer uma distribuição TeX Live com suporte a português (pacote
`texlive-lang-portuguese` no Debian/Ubuntu).

## Regerando a apresentação

```bash
cd tcc/apresentacao
python3 -m venv venv && source venv/bin/activate   # opcional
pip install python-pptx Pillow
python3 gerar_apresentacao.py
```

Isso sobrescreve `Apresentacao_TCC.pptx` com o conteúdo definido no próprio
script — qualquer ajuste de texto/slide deve ser feito nele, não direto no
`.pptx`.
