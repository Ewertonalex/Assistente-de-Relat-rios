/**
 * Gera server/groq-keys.embed.json com as API keys para o instalador Windows.
 * Lê do .env: GROQ_API_KEYS (várias) ou GROQ_API_KEY (uma). Rode antes de build:win.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');
const outPath = path.join(__dirname, 'server', 'groq-keys.embed.json');

let keys = [];

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
  const multi = content.match(/GROQ_API_KEYS\s*=\s*([^\r\n#]+)/);
  const single = content.match(/GROQ_API_KEY\s*=\s*([^\r\n#]+)/);
  if (multi) {
    keys = multi[1].split(/[\n,]+/).map(k => k.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  } else if (single) {
    keys = [single[1].trim().replace(/^["']|["']$/g, '')];
  }
}

if (keys.length === 0) {
  console.warn('Aviso: nenhuma key no .env. Coloque GROQ_API_KEYS=key1,key2,... para o instalador.');
}

fs.writeFileSync(outPath, JSON.stringify(keys), 'utf8');
console.log('✓ ' + keys.length + ' API key(s) embutida(s) para o instalador (server/groq-keys.embed.json)');
