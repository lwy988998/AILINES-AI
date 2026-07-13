const { app, BrowserWindow } = require('electron');

const APP_URL = process.env.AILINES_DESKTOP_URL || 'http://38.76.169.175:3002/';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1000,
    minHeight: 700,
    title: 'AILINES AI',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.removeMenu();

  mainWindow.webContents.on('did-fail-load', (_event, _errorCode, _errorDescription, validatedURL, isMainFrame) => {
    if (!isMainFrame || validatedURL !== APP_URL) return;

    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
      <!doctype html>
      <html lang="zh-CN">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>AILINES AI</title>
          <style>
            body {
              margin: 0;
              min-height: 100vh;
              display: grid;
              place-items: center;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              background: #0f172a;
              color: #e2e8f0;
            }
            main {
              max-width: 560px;
              padding: 32px;
              text-align: center;
            }
            h1 { margin: 0 0 12px; font-size: 28px; }
            p { margin: 0; color: #94a3b8; line-height: 1.7; }
          </style>
        </head>
        <body>
          <main>
            <h1>AILINES AI</h1>
            <p>无法连接 AILINES AI 服务，请检查网络或稍后重试。</p>
          </main>
        </body>
      </html>
    `)}`);
  });

  mainWindow.loadURL(APP_URL);

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
