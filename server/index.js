import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Se o texto não começar com um título (primeira linha curta), adiciona um no início. */
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

let envPath = path.resolve(__dirname, '..', '.env');
if (!fs.existsSync(envPath) && typeof process !== 'undefined' && process.execPath) {
  const alt = path.join(path.dirname(process.execPath), '.env');
  if (fs.existsSync(alt)) envPath = alt;
}
dotenv.config({ path: envPath });

// Keys embutidas no instalador (JSON + fs para funcionar no .exe no Windows)
function carregarKeysEmbutidas() {
  const jsonPath = path.join(__dirname, 'groq-keys.embed.json');
  try {
    if (fs.existsSync(jsonPath)) {
      const data = fs.readFileSync(jsonPath, 'utf8');
      const keys = JSON.parse(data);
      if (Array.isArray(keys) && keys.length > 0) return keys;
    }
  } catch (e) {}
  return [];
}

// Múltiplas API keys do .env (uma por linha ou separadas por vírgula). Fallback: GROQ_API_KEY única.
function carregarGroqKeysDoEnv() {
  const multi = process.env.GROQ_API_KEYS;
  if (multi && multi.trim()) {
    return multi.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
  }
  const single = process.env.GROQ_API_KEY;
  if (single && single.trim()) return [single.trim()];
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
    const match = content.match(/GROQ_API_KEY\s*=\s*([^\r\n#]+)/);
    if (match) {
      const k = match[1].trim().replace(/^["']|["']$/g, '');
      if (k) return [k];
    }
  }
  return [];
}

// Prioridade: keys embutidas (instalador) → depois .env
const GROQ_API_KEYS = (() => {
  const embutidas = carregarKeysEmbutidas();
  if (embutidas.length > 0) return embutidas;
  return carregarGroqKeysDoEnv();
})();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/images', express.static(path.join(__dirname, '../images')));

const TIPOS_DOCUMENTO = {
  RDO: 'Relatório de Ocorrências',
  BO: 'Boletim de Ocorrências',
  REQUERIMENTO: 'Requerimento',
  SOLICITACAO: 'Solicitação'
};

app.post('/api/gerar-documento', async (req, res) => {
  try {
    const { tipoDocumento, nomeCompleto, matricula, destinatario, ocorrido } = req.body;

    if (!GROQ_API_KEYS.length) {
      return res.status(500).json({
        erro: 'Nenhuma API Key do Groq configurada.'
      });
    }

    if (!tipoDocumento || !nomeCompleto || !matricula || !destinatario || !ocorrido) {
      return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
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

${isPolicial ? `Orientações específicas para RDO e BO (linha policial):
- Narre em primeira pessoa (ex.: "Desloquei-me ao local", "Presenciei", "Realizei a abordagem")
- Narre os fatos em ORDEM CRONOLÓGICA (antes, durante e depois da ocorrência), deixando claro local, data e horário quando disponíveis
- Destaque as ações do ASO e de terceiros, mencionando envolvidos, testemunhas e viaturas/equipes de segurança se constarem do relato
- Use termos técnicos próprios de segurança/ocorrência (ex.: ocorrência, guarnição, deslocamento, abordagem, encaminhamento, vítima, autor, suspeito), somente quando fizerem sentido com o relato
- Evite qualificações jurídicas (não tipifique crimes, não escreva “furto”, “roubo” etc. se o ASO não usou esses termos; descreva apenas o que aconteceu)
- Mantenha o texto com tom de registro oficial.` : ''}

Lembrete final: a PRIMEIRA LINHA da sua resposta é OBRIGATORIAMENTE só o assunto (ex.: Solicitação de férias). Segunda linha em branco. Depois o corpo.`;

    const messages = [
      { role: 'system', content: 'Você redige documentos oficiais CBTU. REGRAS FIXAS: (1) Primeira pessoa: solicito, requeiro, justifico, desloquei-me, presenciei. NUNCA use "O ASO", "o agente", "ele/ela". (2) A PRIMEIRA LINHA da sua resposta é OBRIGATORIAMENTE apenas o assunto/título do documento (uma frase curta, ex.: Solicitação de férias). Você NUNCA pode começar a resposta com "Por meio deste" ou "Eu," — comece SEMPRE com o assunto na linha 1.' },
      { role: 'user', content: prompt }
    ];
    const options = { model: 'llama-3.3-70b-versatile', temperature: 0.3, max_tokens: 2000 };

    let lastError = null;
    for (let i = 0; i < GROQ_API_KEYS.length; i++) {
      try {
        const groq = new Groq({ apiKey: GROQ_API_KEYS[i] });
        const completion = await groq.chat.completions.create({ messages, ...options });
        const raw = completion.choices[0]?.message?.content?.trim() || '';
        const documento = raw ? garantirTituloNoDocumento(raw) : 'Não foi possível gerar o documento.';
        return res.json({ sucesso: true, documento, tipoDocumento: tipoNome });
      } catch (err) {
        lastError = err;
        const msg = (err && err.message) ? String(err.message) : '';
        const status = err && err.status;
        const isRetryable = status === 429 || status === 401 || status >= 500 || /rate limit|limit|network|timeout|fetch/i.test(msg);
        if (isRetryable && i < GROQ_API_KEYS.length - 1) {
          console.warn(`Groq falhou com key ${i + 1}/${GROQ_API_KEYS.length} (${status || msg.slice(0, 50)}). Tentando próxima key.`);
          continue;
        }
        break;
      }
    }

    console.error('Erro ao gerar documento (todas as keys tentadas):', lastError);
    res.status(500).json({
      erro: lastError && lastError.message ? lastError.message : 'Erro ao processar com a IA. Tente novamente.'
    });
  } catch (error) {
    console.error('Erro ao gerar documento:', error);
    res.status(500).json({
      erro: error.message || 'Erro ao processar com a IA. Tente novamente.'
    });
  }
});

// Servir frontend (build) quando a pasta dist existir (uso no executável Windows)
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

export { app, PORT };
