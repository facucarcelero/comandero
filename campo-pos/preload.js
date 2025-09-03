const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al renderer
contextBridge.exposeInMainWorld('api', {
  // Settings
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:all')
  },

  // Caja
  caja: {
    abrir: (data) => ipcRenderer.invoke('caja:abrir', data),
    estado: () => ipcRenderer.invoke('caja:estado'),
    cerrar: (data) => ipcRenderer.invoke('caja:cerrar', data),
    resumenDia: (fecha) => ipcRenderer.invoke('caja:resumen-dia', fecha)
  },

  // Productos
  productos: {
    list: (filtros) => ipcRenderer.invoke('producto:list', filtros),
    create: (producto) => ipcRenderer.invoke('producto:create', producto),
    update: (id, producto) => ipcRenderer.invoke('producto:update', id, producto),
    delete: (id) => ipcRenderer.invoke('producto:delete', id),
    import: (productos) => ipcRenderer.invoke('producto:import', productos)
  },

  // Órdenes
  ordenes: {
    create: (orden) => ipcRenderer.invoke('orden:create', orden),
    list: (filtros) => ipcRenderer.invoke('orden:list', filtros),
    changeStatus: (id, estado) => ipcRenderer.invoke('orden:changeStatus', id, estado),
    get: (id) => ipcRenderer.invoke('orden:get', id),
    delete: (id, motivo) => ipcRenderer.invoke('orden:delete', id, motivo)
  },

  // Pagos
  pagos: {
    add: (pago) => ipcRenderer.invoke('pago:add', pago),
    list: (ordenId) => ipcRenderer.invoke('pago:list', ordenId)
  },

  // Reportes
  reportes: {
    getVentasPorFecha: (fechaInicio, fechaFin) => ipcRenderer.invoke('reportes:getVentasPorFecha', fechaInicio, fechaFin),
    getVentasPorCategoria: (fechaInicio, fechaFin) => ipcRenderer.invoke('reportes:getVentasPorCategoria', fechaInicio, fechaFin),
    getProductosMasVendidos: (fechaInicio, fechaFin, limit) => ipcRenderer.invoke('reportes:getProductosMasVendidos', fechaInicio, fechaFin, limit)
  },

  // Impresora
  printer: {
    config: (config) => ipcRenderer.invoke('printer:config', config),
    test: () => ipcRenderer.invoke('printer:test'),
    printKitchen: (ordenData) => ipcRenderer.invoke('printer:printKitchen', ordenData),
    printTicket: (ordenData) => ipcRenderer.invoke('printer:printTicket', ordenData),
    printClose: (cajaData) => ipcRenderer.invoke('printer:printClose', cajaData),
    printReporteVentas: (reporteData) => ipcRenderer.invoke('printer:printReporteVentas', reporteData)
  },

  // Backup
  backup: {
    export: (filePath) => ipcRenderer.invoke('backup:export', filePath),
    import: (filePath) => ipcRenderer.invoke('backup:import', filePath),
    verify: (filePath) => ipcRenderer.invoke('backup:verify', filePath)
  },

  // Diálogos del sistema
  dialog: {
    openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
    saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options)
  }
});

// Exponer información del entorno
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  versions: process.versions
});
