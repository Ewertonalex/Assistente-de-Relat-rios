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

  const prompt = `Você é um assistente especializado em redigir documentos oficiais para ASO Segurança da CBTU - Companhia Brasileira de Trens Urbanos.

O ASO relatou o seguinte ocorrido com suas próprias palavras:
"${ocorrido}"

Sua tarefa é transformar esse relato em um documento formal do tipo: ${tipoNome}.

Regras:
- Use linguagem formal, objetiva e técnica apropriada para documentos oficiais
- Mantenha TODAS as informações e fatos relatados pelo ASO
- Estruture o texto em parágrafos claros
- Use terceira pessoa ou primeira pessoa formal conforme o tipo de documento
- Para RDO e BO: foco em descrição factual, data/hora se mencionadas, local, envolvidos
- Para Requerimento e Solicitação: inclua justificativa e pedido formal
- Não invente informações que não estejam no relato
- O documento deve estar pronto para ser impresso/assinado

${isPolicial ? `Orientações específicas para RDO e BO (linha policial):
- Adote estilo de redação de ocorrência policial: objetivo, impessoal, sem opiniões pessoais
- Narre os fatos em ORDEM CRONOLÓGICA (antes, durante e depois da ocorrência), deixando claro local, data e horário quando disponíveis
- Destaque as ações do ASO e de terceiros, mencionando envolvidos, testemunhas e viaturas/equipes de segurança se constarem do relato
- Use termos técnicos próprios de segurança/ocorrência (ex.: ocorrência, guarnição, deslocamento, abordagem, encaminhamento, vítima, autor, suspeito), somente quando fizerem sentido com o relato
- Evite qualificações jurídicas (não tipifique crimes, não escreva "furto", "roubo" etc. se o ASO não usou esses termos; descreva apenas o que aconteceu)
- Mantenha o texto com tom de registro oficial, como se fosse um histórico de ocorrência policial.` : ''}

Retorne APENAS o texto do documento formatado, sem título no início (o título será adicionado separadamente).`;

  const messages = [
    { role: 'system', content: 'Você é um redator especializado em documentos oficiais para segurança operacional de transportes. Redija de forma clara, formal e profissional.' },
    { role: 'user', content: prompt }
  ];
  const options = { model: 'llama-3.3-70b-versatile', temperature: 0.3, max_tokens: 2000 };

  let lastError = null;
  for (let i = 0; i < GROQ_API_KEYS.length; i++) {
    try {
      const groq = new Groq({ apiKey: GROQ_API_KEYS[i] });
      const completion = await groq.chat.completions.create({ messages, ...options });
      const documentoGerado = completion.choices[0]?.message?.content?.trim() || 'Não foi possível gerar o documento.';
      return resposta(200, { sucesso: true, documento: documentoGerado, tipoDocumento: tipoNome });
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
