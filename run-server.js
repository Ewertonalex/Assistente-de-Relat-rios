/**
 * Script de inicialização - carrega .env da raiz do projeto antes de iniciar o servidor
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.warn('Aviso: .env não encontrado em', envPath);
} else if (result.parsed?.GROQ_API_KEY || result.parsed?.GROQ_API_KEYS) {
  console.log('✓ API Key(s) Groq carregada(s)');
}

const { app, PORT } = await import('./server/index.js');
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log('✓ Pronto para uso');
});
