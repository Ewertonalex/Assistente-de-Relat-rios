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

## Como usar

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
