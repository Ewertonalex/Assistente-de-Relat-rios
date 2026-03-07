/**
 * Testa se a API retorna documento com título na primeira linha.
 * Uso: node server/testar-api-titulo.js
 * Requer: servidor rodando (npm run dev:server) e GROQ_API_KEY no .env
 */
const url = 'http://localhost:3001/api/gerar-documento';
const body = {
  tipoDocumento: 'SOLICITACAO',
  nomeCompleto: 'Teste API',
  matricula: '99999',
  destinatario: 'RH',
  ocorrido: 'Quero solicitar minhas férias para o mês de junho de 2026, dos dias 1 a 10.'
};

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

async function main() {
  console.log('Enviando requisição à IA...');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (!res.ok) {
    console.error('Erro:', res.status, json);
    process.exit(1);
  }
  const doc = (json.documento || '').trim();
  const primeiraLinha = doc.split(/\n/)[0] || '';
  const pareceTitulo = primeiraLinha.length <= 70 && !/^(por meio deste|eu,|o |solicito\s|requeiro\s|justifico\s)/i.test(primeiraLinha.trim());
  console.log('\n--- Primeira linha do documento ---');
  console.log(primeiraLinha || '(vazio)');
  console.log('\n--- Considerada título? ---', pareceTitulo ? 'SIM' : 'NÃO');
  if (!pareceTitulo) {
    const comTitulo = garantirTituloNoDocumento(doc);
    console.log('\n--- Com fallback do servidor (documento com título na 1ª linha) ---');
    console.log(comTitulo.split(/\n/).slice(0, 4).join('\n'));
    console.log('\n(Dica: se a resposta acima não veio com título, reinicie o servidor: pare o processo e rode npm run dev:server)');
  }
  console.log('\n--- Início do documento (3 primeiras linhas) ---');
  console.log(doc.split(/\n/).slice(0, 3).join('\n'));
  process.exit(pareceTitulo ? 0 : 1);
}

main().catch((err) => {
  if (err.cause?.code === 'ECONNREFUSED') {
    console.error('Servidor não está rodando. Inicie com: npm run dev:server');
  } else {
    console.error(err);
  }
  process.exit(1);
});
