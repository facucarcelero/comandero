const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL;

// Importar módulos de utilidades
const db = require(path.join(__dirname, 'src', 'db', 'database'));
const dbInit = require(path.join(__dirname, 'src', 'db', 'index'));
const printer = require(path.join(__dirname, 'src', 'utils', 'printer'));
const backup = require(path.join(__dirname, 'src', 'utils', 'backup'));

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
  } else {
    const indexPath = path.join(__dirname, 'renderer/index.html');
    console.log('🔗 Cargando archivo:', indexPath);
    console.log('🔗 Archivo existe:', fs.existsSync(indexPath));
    console.log('🔗 __dirname:', __dirname);

    // Opción B: loadURL con file:// (robusto)
    const { pathToFileURL } = require('url');
    const fileUrl = pathToFileURL(indexPath).toString();
    console.log('🔗 File URL:', fileUrl);
    
    mainWindow.loadURL(fileUrl).then(() => {
      console.log('✅ Archivo HTML cargado correctamente');
    }).catch((error) => {
      console.error('❌ Error al cargar archivo HTML:', error);
    });
  }

  mainWindow.once('ready-to-show', () => {
    console.log('✅ Ventana lista para mostrar');
    mainWindow.show();
    // DevTools solo se abren manualmente (F12 o Ctrl+Shift+I)
    // if (isDev) {
    //   mainWindow.webContents.openDevTools();
    // }
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

// ===== HANDLERS IPC =====
// Estos handlers se registran después de inicializar la base de datos

function registerIpcHandlers() {
  console.log('🔗 Registrando handlers IPC...');

  // Settings
  ipcMain.handle('settings:get', async (event, key) => {
    return db.getSetting(key);
  });

  ipcMain.handle('settings:set', async (event, key, value) => {
    const result = db.setSetting(key, value);
    if (result && mainWindow) {
      mainWindow.webContents.send('event:settingsUpdated', { key, value });
    }
    return result;
  });

  ipcMain.handle('settings:all', async () => {
    return db.getAllSettings();
  });

  // Caja
  ipcMain.handle('caja:abrir', async (event, data) => {
    const result = db.abrirCaja(data);
    if (result && mainWindow) {
      mainWindow.webContents.send('event:cajaOpened', result);
    }
    return result;
  });

  ipcMain.handle('caja:estado', async () => {
    return db.getCajaEstado();
  });

  ipcMain.handle('caja:cerrar', async (event, data) => {
    const result = db.cerrarCaja(data);
    if (result && mainWindow) {
      mainWindow.webContents.send('event:cajaClosed', data);
    }
    return result;
  });

  ipcMain.handle('caja:resumen-dia', async (event, fecha) => {
    return db.getResumenCaja(fecha);
  });

  ipcMain.handle('caja:historial', async (event, fechaInicio, fechaFin) => {
    return db.getHistorialCajas(fechaInicio, fechaFin);
  });

  // Productos
  ipcMain.handle('producto:list', async (event, filtros = {}) => {
    return db.getProductos(filtros);
  });

  ipcMain.handle('producto:create', async (event, producto) => {
    const result = db.createProducto(producto);
    if (result && mainWindow) {
      mainWindow.webContents.send('event:productoCreated', result);
    }
    return result;
  });

  ipcMain.handle('producto:update', async (event, id, producto) => {
    const result = db.updateProducto(id, producto);
    if (result && mainWindow) {
      const updatedProducto = db.getProducto(id);
      mainWindow.webContents.send('event:productoUpdated', updatedProducto);
    }
    return result;
  });

  ipcMain.handle('producto:delete', async (event, id) => {
    const result = db.deleteProducto(id);
    if (result && mainWindow) {
      mainWindow.webContents.send('event:productoDeleted', { id });
    }
    return result;
  });

  ipcMain.handle('producto:import', async (event, productos) => {
    const result = db.importProductos(productos);
    if (result > 0 && mainWindow) {
      mainWindow.webContents.send('event:productosImported', { count: result });
    }
    return result;
  });



  // Órdenes y Pagos
  ipcMain.handle('orden:create', async (event, orden) => {
    const result = await db.createOrden(orden);
    if (result && mainWindow) {
      mainWindow.webContents.send('event:ordenCreated', result);
      
      // Enviar eventos de productos actualizados (stock cambiado)
      for (const item of orden.items) {
        const producto = await db.getProducto(item.producto_id);
        if (producto) {
          mainWindow.webContents.send('event:productoUpdated', producto);
        }
      }
    }
    return result;
  });

  ipcMain.handle('orden:list', async (event, filtros = {}) => {
    return db.getOrdenes(filtros);
  });

  ipcMain.handle('orden:changeStatus', async (event, id, estado) => {
    const result = db.updateEstadoOrden(id, estado);
    if (result && mainWindow) {
      const orden = db.getOrden(id);
      mainWindow.webContents.send('event:ordenUpdated', orden);
    }
    return result;
  });

  ipcMain.handle('orden:get', async (event, id) => {
    return db.getOrden(id);
  });

  ipcMain.handle('orden:delete', async (event, id, motivo) => {
    const result = db.deleteOrden(id, motivo);
    if (result && mainWindow) {
      mainWindow.webContents.send('event:ordenDeleted', { id, motivo });
    }
    return result;
  });

  ipcMain.handle('pago:add', async (event, pago) => {
    const result = db.addPago(pago);
    if (result && mainWindow) {
      mainWindow.webContents.send('event:pagoAdded', result);
    }
    return result;
  });

  ipcMain.handle('pago:list', async (event, ordenId) => {
    return db.getPagos(ordenId);
  });

  // Reportes
  ipcMain.handle('reportes:getVentasPorFecha', async (event, fechaInicio, fechaFin) => {
    return db.getVentasPorFecha(fechaInicio, fechaFin);
  });

  ipcMain.handle('reportes:getVentasPorCategoria', async (event, fechaInicio, fechaFin) => {
    return db.getVentasPorCategoria(fechaInicio, fechaFin);
  });

  ipcMain.handle('reportes:getProductosMasVendidos', async (event, fechaInicio, fechaFin, limit) => {
    return db.getProductosMasVendidos(fechaInicio, fechaFin, limit);
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

  ipcMain.handle('printer:printResumenCaja', async (event, data) => {
    return printer.printResumenCaja(data);
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

  console.log('✅ Handlers IPC registrados correctamente');
}

// Inicializar la aplicación
app.whenReady().then(async () => {
  console.log('🚀 Aplicación lista');
  
  // Inicializar base de datos SQLite PRIMERO
  console.log('🔧 Inicializando base de datos SQLite...');
  try {
    await dbInit.init();
    console.log('✅ Base de datos SQLite inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar base de datos SQLite:', error);
    return; // No continuar si la base de datos no se puede inicializar
  }
  
  // Registrar handlers IPC después de inicializar la base de datos
  registerIpcHandlers();
  
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

// Manejo de errores
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
});