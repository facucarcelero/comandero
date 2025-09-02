const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL;

// Importar módulos de utilidades
const db = require('./src/utils/db');
const printer = require('./src/utils/printer');
const settings = require('./src/utils/settings');
const backup = require('./src/utils/backup');

let mainWindow;

function createWindow() {
  console.log('🪟 Creando ventana de Electron...');
  console.log('🔧 Modo desarrollo:', isDev);
  console.log('📁 Directorio actual:', __dirname);
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    title: 'Campo POS',
    show: false
  });

  // Cargar la aplicación
  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    console.log('🔗 Cargando desde:', devUrl);
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'build/renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    console.log('✅ Ventana lista para mostrar');
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    console.log('❌ Ventana cerrada');
    mainWindow = null;
  });

  // Event listeners para debug
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Página cargada completamente');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Error al cargar página:', errorCode, errorDescription, validatedURL);
  });

  mainWindow.webContents.on('dom-ready', () => {
    console.log('✅ DOM listo');
  });
}

// Inicializar la aplicación
app.whenReady().then(async () => {
  // Inicializar base de datos
  await db.init();
  
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

// ===== HANDLERS IPC =====

// Settings
ipcMain.handle('settings:get', async (event, key) => {
  return settings.get(key);
});

ipcMain.handle('settings:set', async (event, key, value) => {
  return settings.set(key, value);
});

ipcMain.handle('settings:all', async () => {
  return settings.getAll();
});

// Caja
ipcMain.handle('caja:abrir', async (event, data) => {
  return db.abrirCaja(data);
});

ipcMain.handle('caja:estado', async () => {
  return db.getEstadoCaja();
});

ipcMain.handle('caja:cerrar', async (event, data) => {
  return db.cerrarCaja(data);
});

ipcMain.handle('caja:resumen-dia', async (event, fecha) => {
  return db.getResumenCaja(fecha);
});

// Productos
ipcMain.handle('producto:list', async (event, filtros = {}) => {
  return db.getProductos(filtros);
});

ipcMain.handle('producto:create', async (event, producto) => {
  return db.createProducto(producto);
});

ipcMain.handle('producto:update', async (event, id, producto) => {
  return db.updateProducto(id, producto);
});

ipcMain.handle('producto:delete', async (event, id) => {
  return db.deleteProducto(id);
});

ipcMain.handle('producto:import', async (event, productos) => {
  return db.importProductos(productos);
});

// Órdenes y Pagos
ipcMain.handle('orden:create', async (event, orden) => {
  return db.createOrden(orden);
});

ipcMain.handle('orden:list', async (event, filtros = {}) => {
  return db.getOrdenes(filtros);
});

ipcMain.handle('orden:changeStatus', async (event, id, estado) => {
  return db.updateEstadoOrden(id, estado);
});

ipcMain.handle('orden:get', async (event, id) => {
  return db.getOrden(id);
});

ipcMain.handle('pago:add', async (event, pago) => {
  return db.addPago(pago);
});

ipcMain.handle('pago:list', async (event, ordenId) => {
  return db.getPagos(ordenId);
});

// Impresora
ipcMain.handle('printer:config', async (event, config) => {
  return printer.setConfig(config);
});

ipcMain.handle('printer:test', async () => {
  return printer.testPrint();
});

ipcMain.handle('printer:printKitchen', async (event, ordenData) => {
  return printer.printKitchenTicket(ordenData);
});

ipcMain.handle('printer:printTicket', async (event, ordenData) => {
  return printer.printTicket(ordenData);
});

ipcMain.handle('printer:printClose', async (event, cajaData) => {
  return printer.printCierreCaja(cajaData);
});

ipcMain.handle('printer:printReporteVentas', async (event, reporteData) => {
  return printer.printReporteVentas(reporteData);
});

// Backup
ipcMain.handle('backup:export', async (event, filePath) => {
  return backup.exportData(filePath);
});

ipcMain.handle('backup:import', async (event, filePath) => {
  return backup.importData(filePath);
});

ipcMain.handle('backup:verify', async (event, filePath) => {
  return backup.verifyBackup(filePath);
});

// Diálogos del sistema
ipcMain.handle('dialog:openFile', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('dialog:saveFile', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

// Manejo de errores
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
});
