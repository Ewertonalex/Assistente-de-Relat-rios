/**
 * Netlify Function: geração de documento com Groq.
 * 5 keys embutidas para funcionar no Netlify sem configurar variáveis de ambiente.
 */
const Groq = require('groq-sdk');

const GROQ_API_KEYS_EMBED = [
  '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',
  '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',
  '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',
  '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',
  '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'
];

function getKeys() {
  const env = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '';
  if (env.trim()) {
    return env.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
  }
  return GROQ_API_KEYS_EMBED;
}

const TIPOS_DOCUMENTO = {
  RDO: 'Relatório de Ocorrências',
  BO: 'Boletim de Ocorrências',
  REQUERIMENTO: 'Requerimento',
  SOLICITACAO: 'Solicitação'
};

function resposta(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return resposta(405, { erro: 'Método não permitido' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return resposta(400, { erro: 'Corpo inválido' });
  }

  const { tipoDocumento, nomeCompleto, matricula, destinatario, ocorrido } = body;

  const GROQ_API_KEYS = getKeys();
  if (!GROQ_API_KEYS.length) {
    return resposta(500, { erro: 'Nenhuma API Key do Groq configurada.' });
  }
  if (!tipoDocumento || !nomeCompleto || !matricula || !destinatario || !ocorrido) {
    return resposta(400, { erro: 'Todos os campos são obrigatórios' });
  }

  const tipoNome = TIPOS_DOCUMENTO[tipoDocumento] || tipoDocumento;
  const isPolicial = tipoDocumento === 'RDO' || tipoDocumento === 'BO';

  const prompt = `INSTRUÇÃO OBRIGATÓRIA DE FORMATO (faça primeiro):
Sua resposta deve começar OBRIGATORIAMENTE com UMA LINHA contendo apenas o assunto/título do documento (ex.: "Solicitação de férias", "Requerimento de férias para junho de 2026"). Na linha seguinte deixe uma linha em branco. Só então escreva os parágrafos do documento. NUNCA comece o texto com "Por meio deste" ou "Eu," — a primeira linha é SEMPRE o assunto.

---

Você é um assistente especializado em redigir documentos oficiais para ASO Segurança da CBTU - Companhia Brasileira de Trens Urbanos.

O ASO relatou o seguinte ocorrido com suas próprias palavras:
"${ocorrido}"

Sua tarefa é transformar esse relato em um documento formal do tipo: ${tipoNome}.

REGRA OBRIGATÓRIA - PRIMEIRA PESSOA (NÃO IGNORE):
- O texto do documento INTEIRO deve ser escrito como se o ASO estivesse falando de si: use "solicito", "justifico", "requeiro", "desloquei-me", "presenciei", "apresento", "peço", "informo".
- É PROIBIDO escrever "O ASO", "o agente", "o solicitante", "ele/ela", "o ASO solicita", "o ASO justifica", "permitindo que ele possa". Substitua por: "Solicito", "Justifico", "Requeiro", "peço que eu tenha acesso".
- Exemplo CERTO para Solicitação: "Por meio deste, solicito o extrato de pagamento referente a 2025. Justifico a presente solicitação para acompanhamento de meus pagamentos. Requeiro as providências para que eu tenha acesso às informações."
- Exemplo ERRADO: "O ASO solicita... O ASO justifica... permitindo que ele possa."

Demais regras:
- Use linguagem formal, objetiva e técnica
- Mantenha TODAS as informações relatadas pelo ASO
- Para RDO e BO: narre em primeira pessoa (desloquei-me, presenciei, realizei)
- Para Requerimento e Solicitação: use primeira pessoa (solicito, requeiro, justifico, peço)
- Não invente informações que não estejam no relato
- O documento deve estar pronto para ser impresso/assinado

${isPolicial ? `Orientações específicas para RDO e BO:
- Narre em primeira pessoa (ex.: "Desloquei-me ao local", "Presenciei", "Realizei a abordagem")
- Narre os fatos em ORDEM CRONOLÓGICA (antes, durante e depois da ocorrência), deixando claro local, data e horário quando disponíveis
- Destaque as ações do ASO e de terceiros, mencionando envolvidos, testemunhas e viaturas/equipes de segurança se constarem do relato
- Use termos técnicos próprios de segurança/ocorrência quando fizerem sentido com o relato
- Evite qualificações jurídicas; descreva apenas o que aconteceu
- Mantenha o texto com tom de registro oficial.` : ''}

Lembrete final: a PRIMEIRA LINHA da sua resposta é OBRIGATORIAMENTE só o assunto (ex.: Solicitação de férias). Segunda linha em branco. Depois o corpo.`;

  const messages = [
    { role: 'system', content: 'Você redige documentos oficiais CBTU. REGRAS FIXAS: (1) Primeira pessoa: solicito, requeiro, justifico, desloquei-me, presenciei. NUNCA use "O ASO", "o agente", "ele/ela". (2) A PRIMEIRA LINHA da sua resposta é OBRIGATORIAMENTE apenas o assunto/título do documento (uma frase curta, ex.: Solicitação de férias). Você NUNCA pode começar a resposta com "Por meio deste" ou "Eu," — comece SEMPRE com o assunto na linha 1.' },
    { role: 'user', content: prompt }
  ];
  const options = { model: 'llama-3.3-70b-versatile', temperature: 0.3, max_tokens: 2000 };

  function garantirTituloNoDocumento(raw) {
    const t = (raw || '').trim();
    if (!t) return t;
    const primeiraLinha = t.split(/\n/)[0] || '';
    const pareceTitulo = primeiraLinha.length <= 70 && !/^(por meio deste|eu,|o |a presente|solicito\s|requeiro\s|justifico\s|desloquei|informo\s)/i.test(primeiraLinha.trim());
    if (pareceTitulo) return t;
    const d = t.toLowerCase();
    let titulo = '';
    if (/requerimento.*f[eé]rias|f[eé]rias.*requerimento/.test(d)) titulo = 'Requerimento de férias';
    else if (/solicitar.*f[eé]rias|f[eé]rias.*solicit|solicita[cç][aã]o.*f[eé]rias/.test(d)) titulo = 'Solicitação de férias';
    else if (/folga|consulta\s+m[eé]dica/.test(d)) titulo = 'Solicitação de folga';
    else if (/extrato.*pagamento|pagamento.*extrato/.test(d)) titulo = 'Solicitação de extrato de pagamento';
    else {
      const atePeriodo = t.match(/^[^.]{10,80}\.?/);
      titulo = (atePeriodo ? atePeriodo[0].trim() : t.slice(0, 60).trim()) || 'Documento';
    }
    return titulo + '\n\n' + t;
  }

  let lastError = null;
  for (let i = 0; i < GROQ_API_KEYS.length; i++) {
    try {
      const groq = new Groq({ apiKey: GROQ_API_KEYS[i] });
      const completion = await groq.chat.completions.create({ messages, ...options });
      const raw = completion.choices[0]?.message?.content?.trim() || '';
      const MSG_ERRO = 'Não foi possível gerar o documento.';
      const documento = raw ? garantirTituloNoDocumento(raw) : MSG_ERRO;
      return resposta(200, { sucesso: true, documento, tipoDocumento: tipoNome });
    } catch (err) {
      lastError = err;
      const msg = (err && err.message) ? String(err.message) : '';
      const status = err && err.status;
      const isRetryable = status === 429 || status === 401 || (status >= 500) || /rate limit|limit|network|timeout|fetch/i.test(msg);
      if (isRetryable && i < GROQ_API_KEYS.length - 1) continue;
      break;
    }
  }

  return resposta(500, {
    erro: (lastError && lastError.message) ? lastError.message : 'Erro ao processar com a IA. Tente novamente.'
  });
};
