# Assistente de Relatórios CBTU

Assistente de IA para elaboração de relatórios do dia a dia dos ASO Segurança da CBTU - Companhia Brasileira de Trens Urbanos.

## Funcionalidades

- **Tipos de documento**: RDO (Relatório de Ocorrências), BO (Boletim de Ocorrências), Requerimento e Solicitação
- **Geração com IA**: O ASO descreve o ocorrido com suas palavras e a IA (Groq) transforma em documento formal
- **Edição e refazer**: Possibilidade de editar o texto gerado ou solicitar nova geração
- **Exportação**: PDF e Word com:
  - Cabeçalho com logo CBTU e nome completo da empresa
  - Tipo do documento em negrito, centralizado, maiúsculo
  - Tabela com: Nome do ASO, Matrícula, Data, Destinatário, Protocolo (em branco para preenchimento manual)
  - Descrição formal do documento
  - Espaço para assinatura eletrônica
  - Anexos (imagens) em páginas sequenciais

## Pré-requisitos

- Node.js 18+
- Conta gratuita no [Groq Cloud](https://console.groq.com/) para obter a API Key

## Instalação

1. Clone ou acesse a pasta do projeto
2. Instale as dependências:

```bash
npm install
```

3. Crie um arquivo `.env` na raiz do projeto com sua API Key do Groq:

```
GROQ_API_KEY=sua_chave_aqui
```

4. Obtenha sua API Key em: https://console.groq.com/ → API Keys

## Uso no Windows (instalador)

**O programa é para usar no Windows.** Você não precisa usar no Mac — no Mac (ou em qualquer PC com Node) você só **gera o instalador uma vez**. Depois envia o exe para o PC com Windows, instala lá e tudo funciona: as 5 API keys, geração de documento, PDF, Word, tudo igual.

### 1. Gerar o instalador (uma vez, na máquina onde está o projeto)

No `.env` da pasta do projeto, coloque as **5 API keys** em uma linha, separadas por vírgula:

```
GROQ_API_KEYS=chave1,chave2,chave3,chave4,chave5
```

Rode:

```bash
npm run build:win
```

O instalador será criado em: **`release/Assistente de Relatórios CBTU Setup 1.0.0.exe`**

### 2. No Windows

- Envie esse arquivo **.exe** para o PC com Windows (pendrive, e-mail, etc.).
- Execute o instalador e instale.
- Abra o atalho do **Assistente de Relatórios CBTU**.
- **Não é preciso criar .env nem configurar nada no Windows** — as 5 keys já vêm dentro do instalador. O uso é o mesmo: gerar documento, editar, exportar PDF/Word.

## Deploy no Netlify

As 5 API keys já estão na função (`netlify/functions/gerar-documento.js`), então não é preciso configurar variáveis de ambiente.

1. Conecte o repositório GitHub ao Netlify (Site settings → Build & deploy → Link repository).
2. A configuração de build está em `netlify.toml` (Build command: `npm run build`, Publish directory: `dist`).
3. Faça o deploy. O Netlify builda o frontend e publica a função; a geração de documentos funciona com as keys embutidas.

## Como usar (desenvolvimento)

1. Inicie o projeto:

```bash
npm run dev
```

2. Acesse no navegador: **http://localhost:5173**

3. Fluxo:
   - Selecione o tipo de documento (RDO, BO, Requerimento ou Solicitação)
   - Preencha: Nome completo, Matrícula, Destinatário
   - Descreva o ocorrido com suas palavras
   - Clique em **Gerar Documento**
   - Revise a sugestão da IA → Edite ou Refaça se necessário
   - Clique em **Aceitar e Continuar**
   - Adicione assinatura eletrônica (opcional) e anexos (opcional)
   - Salve em **PDF** ou **Word**

## Estrutura do projeto

```
├── images/           # Logo CBTU (CBTU_Logo.svg.png)
├── server/           # Backend Node.js + Express + Groq API
├── src/
│   ├── components/   # Formulário, Preview, Documento Final
│   ├── utils/        # Geração de PDF e Word
│   └── App.jsx
├── .env.example
└── package.json
```

## Tecnologias

- **Frontend**: React, Vite
- **Backend**: Node.js, Express
- **IA**: Groq (gratuito)
- **PDF**: jsPDF, jspdf-autotable
- **Word**: docx
- **Assinatura**: react-signature-canvas

## Observações

- O campo **Protocolo** no documento fica em branco para preenchimento manual posterior
- Os anexos aceitam imagens (PNG, JPG, etc.) e são incluídos em páginas sequenciais no PDF/Word
- A assinatura eletrônica é opcional; o documento pode ser exportado sem ela
