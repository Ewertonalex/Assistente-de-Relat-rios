const MSG_ERRO = 'Não foi possível gerar o documento.';
const TITULO_GENERICO = /^relato\s+de\s+ocorr[eê]ncia$|^assunto\s+do\s+documento$/i;

function ehTituloGenerico(s) {
  return !s || TITULO_GENERICO.test((s || '').trim());
}

/** Título curto a partir de palavras-chave no texto (ex.: férias → Solicitação de férias). */
function tituloPorPalavrasChave(documento) {
  const d = (documento || '').toLowerCase();
  if (/requerimento.*f[eé]rias|f[eé]rias.*requerimento/.test(d)) return 'Requerimento de férias';
  if (/solicitar.*f[eé]rias|f[eé]rias.*solicit|solicita[cç][aã]o.*f[eé]rias/.test(d)) return 'Solicitação de férias';
  if (/folga|consulta\s+m[eé]dica/.test(d)) return 'Solicitação de folga';
  if (/extrato.*pagamento|pagamento.*extrato/.test(d)) return 'Solicitação de extrato de pagamento';
  return '';
}

/** Deriva um título a partir do corpo (primeira frase ou início do texto). */
function derivarTituloDoCorpo(documento) {
  const d = (documento || '').trim();
  if (!d) return '';
  const porChave = tituloPorPalavrasChave(d);
  if (porChave) return porChave;
  const atePeriodo = d.match(/^[^.]{10,100}\.?/);
  if (atePeriodo) return atePeriodo[0].trim().slice(0, 120);
  const primeiraLinha = d.split(/\n/)[0] || d.slice(0, 80);
  return (primeiraLinha.trim().slice(0, 120) || d.slice(0, 80).trim()) || '';
}

/**
 * Extrai título e corpo do documento a partir da resposta bruta da IA.
 * Garante título específico (nunca "Relato de ocorrência") quando há conteúdo.
 * @param {string} raw - Texto bruto retornado pela IA
 * @returns {{ titulo: string, documento: string }}
 */
export function extrairTituloEDocumento(raw) {
  const trimmed = (raw || '').trim();
  let titulo = '';
  let documento = trimmed || MSG_ERRO;
  const partes = trimmed.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);

  if (partes.length >= 2 && partes[0].length <= 180) {
    titulo = partes[0].slice(0, 200);
    documento = partes.slice(1).join('\n\n').trim();
  } else {
    const primeiroBloco = (documento.split(/\n/)[0] || documento.slice(0, 150)).trim();
    const atePeriodo = documento.match(/^[^.]{15,120}\.?/);
    titulo =
      (atePeriodo ? atePeriodo[0].trim() : null) ||
      (primeiroBloco.length >= 10 ? primeiroBloco.slice(0, 120) : null) ||
      documento.slice(0, 100).trim();
  }

  titulo = (titulo || '').slice(0, 200).trim();

  if (documento === MSG_ERRO || !documento.trim()) {
    titulo = 'Relato de ocorrência';
    return { titulo, documento };
  }

  if (!titulo || ehTituloGenerico(titulo)) {
    titulo = derivarTituloDoCorpo(documento).slice(0, 200).trim() || documento.slice(0, 80).trim();
  }
  if (!titulo) titulo = 'Relato de ocorrência';
  return { titulo, documento };
}
