/**
 * Electron – abre o Assistente em janela desktop no Windows.
 * Inicia o servidor Express (que serve o frontend e a API) e abre uma janela em localhost.
 */
import { app as electronApp, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3001;

let mainWindow = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 800,
    title: 'Assistente de Relatórios CBTU',
    icon: path.join(__dirname, '..', 'images', 'CBTU_Logo.svg.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);
  mainWindow.on('closed', () => { mainWindow = null; });
}

async function main() {
  const { app: expressApp, PORT: serverPort } = await import('../server/index.js');
  await new Promise((resolve) => {
    expressApp.listen(serverPort, resolve);
  });
  await electronApp.whenReady();
  await createWindow();

  electronApp.on('window-all-closed', () => {
    electronApp.quit();
  });
}

main().catch((err) => {
  console.error(err);
  electronApp.quit(1);
});
