const Store = require('electron-store');

// Configuración por defecto
const defaultSettings = {
  // Información de la empresa
  empresa_nombre: 'Mi Restaurante',
  empresa_direccion: 'Dirección del restaurante',
  empresa_telefono: '',
  empresa_email: '',
  empresa_ruc: '',
  
  // Configuración fiscal
  iva_porcentaje: 19,
  moneda: 'COP',
  moneda_simbolo: '$',
  
  // Configuración de impresora
  impresora_tipo: 'usb', // usb | ethernet
  impresora_puerto: '',
  impresora_ancho: 58, // 58 | 80
  impresora_test_print: true,
  
  // Configuración de la aplicación
  tema: 'light', // light | dark
  idioma: 'es',
  auto_backup: true,
  backup_interval: 24, // horas
  
  // Configuración de caja
  caja_monto_minimo: 0,
  caja_requiere_responsable: true,
  
  // Configuración de productos
  productos_mostrar_stock: true,
  productos_mostrar_categoria: true,
  productos_ordenar_por: 'nombre', // nombre | categoria | precio
  
  // Configuración de reportes
  reportes_mostrar_graficos: true,
  reportes_exportar_formato: 'pdf', // pdf | excel | csv
  
  // Configuración de tickets
  ticket_mostrar_logo: false,
  ticket_mostrar_observaciones: true,
  ticket_mostrar_desglose_iva: true,
  
  // Configuración de cocina
  cocina_imprimir_automatico: true,
  cocina_mostrar_observaciones: true,
  
  // Configuración de backup
  backup_ubicacion: '',
  backup_automatico: true,
  backup_retener_dias: 30
};

// Inicializar store
const store = new Store({
  defaults: defaultSettings,
  name: 'birthday-pos-settings',
  fileExtension: 'json'
});

// Obtener configuración
function get(key) {
  return store.get(key);
}

// Establecer configuración
function set(key, value) {
  store.set(key, value);
  return true;
}

// Obtener todas las configuraciones
function getAll() {
  return store.store;
}

// Establecer múltiples configuraciones
function setMultiple(settings) {
  for (const [key, value] of Object.entries(settings)) {
    store.set(key, value);
  }
  return true;
}

// Resetear configuración a valores por defecto
function reset() {
  store.clear();
  return true;
}

// Obtener configuración de empresa
function getEmpresaConfig() {
  return {
    nombre: get('empresa_nombre'),
    direccion: get('empresa_direccion'),
    telefono: get('empresa_telefono'),
    email: get('empresa_email'),
    ruc: get('empresa_ruc')
  };
}

// Establecer configuración de empresa
function setEmpresaConfig(config) {
  setMultiple({
    empresa_nombre: config.nombre,
    empresa_direccion: config.direccion,
    empresa_telefono: config.telefono,
    empresa_email: config.email,
    empresa_ruc: config.ruc
  });
  return true;
}

// Obtener configuración fiscal
function getFiscalConfig() {
  return {
    iva_porcentaje: get('iva_porcentaje'),
    moneda: get('moneda'),
    moneda_simbolo: get('moneda_simbolo')
  };
}

// Establecer configuración fiscal
function setFiscalConfig(config) {
  setMultiple({
    iva_porcentaje: config.iva_porcentaje,
    moneda: config.moneda,
    moneda_simbolo: config.moneda_simbolo
  });
  return true;
}

// Obtener configuración de impresora
function getImpresoraConfig() {
  return {
    tipo: get('impresora_tipo'),
    puerto: get('impresora_puerto'),
    ancho: get('impresora_ancho'),
    test_print: get('impresora_test_print')
  };
}

// Establecer configuración de impresora
function setImpresoraConfig(config) {
  setMultiple({
    impresora_tipo: config.tipo,
    impresora_puerto: config.puerto,
    impresora_ancho: config.ancho,
    impresora_test_print: config.test_print
  });
  return true;
}

// Obtener configuración de la aplicación
function getAppConfig() {
  return {
    tema: get('tema'),
    idioma: get('idioma'),
    auto_backup: get('auto_backup'),
    backup_interval: get('backup_interval')
  };
}

// Establecer configuración de la aplicación
function setAppConfig(config) {
  setMultiple({
    tema: config.tema,
    idioma: config.idioma,
    auto_backup: config.auto_backup,
    backup_interval: config.backup_interval
  });
  return true;
}

// Obtener configuración de caja
function getCajaConfig() {
  return {
    monto_minimo: get('caja_monto_minimo'),
    requiere_responsable: get('caja_requiere_responsable')
  };
}

// Establecer configuración de caja
function setCajaConfig(config) {
  setMultiple({
    caja_monto_minimo: config.monto_minimo,
    caja_requiere_responsable: config.requiere_responsable
  });
  return true;
}

// Obtener configuración de productos
function getProductosConfig() {
  return {
    mostrar_stock: get('productos_mostrar_stock'),
    mostrar_categoria: get('productos_mostrar_categoria'),
    ordenar_por: get('productos_ordenar_por')
  };
}

// Establecer configuración de productos
function setProductosConfig(config) {
  setMultiple({
    productos_mostrar_stock: config.mostrar_stock,
    productos_mostrar_categoria: config.mostrar_categoria,
    productos_ordenar_por: config.ordenar_por
  });
  return true;
}

// Obtener configuración de reportes
function getReportesConfig() {
  return {
    mostrar_graficos: get('reportes_mostrar_graficos'),
    exportar_formato: get('reportes_exportar_formato')
  };
}

// Establecer configuración de reportes
function setReportesConfig(config) {
  setMultiple({
    reportes_mostrar_graficos: config.mostrar_graficos,
    reportes_exportar_formato: config.exportar_formato
  });
  return true;
}

// Obtener configuración de tickets
function getTicketsConfig() {
  return {
    mostrar_logo: get('ticket_mostrar_logo'),
    mostrar_observaciones: get('ticket_mostrar_observaciones'),
    mostrar_desglose_iva: get('ticket_mostrar_desglose_iva')
  };
}

// Establecer configuración de tickets
function setTicketsConfig(config) {
  setMultiple({
    ticket_mostrar_logo: config.mostrar_logo,
    ticket_mostrar_observaciones: config.mostrar_observaciones,
    ticket_mostrar_desglose_iva: config.mostrar_desglose_iva
  });
  return true;
}

// Obtener configuración de cocina
function getCocinaConfig() {
  return {
    imprimir_automatico: get('cocina_imprimir_automatico'),
    mostrar_observaciones: get('cocina_mostrar_observaciones')
  };
}

// Establecer configuración de cocina
function setCocinaConfig(config) {
  setMultiple({
    cocina_imprimir_automatico: config.imprimir_automatico,
    cocina_mostrar_observaciones: config.mostrar_observaciones
  });
  return true;
}

// Obtener configuración de backup
function getBackupConfig() {
  return {
    ubicacion: get('backup_ubicacion'),
    automatico: get('backup_automatico'),
    retener_dias: get('backup_retener_dias')
  };
}

// Establecer configuración de backup
function setBackupConfig(config) {
  setMultiple({
    backup_ubicacion: config.ubicacion,
    backup_automatico: config.automatico,
    backup_retener_dias: config.retener_dias
  });
  return true;
}

// Validar configuración
function validateConfig(config) {
  const errors = [];
  
  // Validar empresa
  if (!config.empresa_nombre || config.empresa_nombre.trim() === '') {
    errors.push('El nombre de la empresa es requerido');
  }
  
  // Validar IVA
  if (config.iva_porcentaje < 0 || config.iva_porcentaje > 100) {
    errors.push('El porcentaje de IVA debe estar entre 0 y 100');
  }
  
  // Validar moneda
  if (!config.moneda || config.moneda.trim() === '') {
    errors.push('La moneda es requerida');
  }
  
  // Validar impresora
  if (config.impresora_tipo === 'ethernet' && !config.impresora_puerto) {
    errors.push('El puerto de la impresora es requerido para impresoras de red');
  }
  
  if (config.impresora_ancho !== 58 && config.impresora_ancho !== 80) {
    errors.push('El ancho de la impresora debe ser 58 o 80 mm');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Exportar configuración
function exportConfig() {
  return store.store;
}

// Importar configuración
function importConfig(config) {
  const validation = validateConfig(config);
  if (!validation.valid) {
    throw new Error('Configuración inválida: ' + validation.errors.join(', '));
  }
  
  store.store = config;
  return true;
}

module.exports = {
  // Métodos básicos
  get,
  set,
  getAll,
  setMultiple,
  reset,
  
  // Configuraciones específicas
  getEmpresaConfig,
  setEmpresaConfig,
  getFiscalConfig,
  setFiscalConfig,
  getImpresoraConfig,
  setImpresoraConfig,
  getAppConfig,
  setAppConfig,
  getCajaConfig,
  setCajaConfig,
  getProductosConfig,
  setProductosConfig,
  getReportesConfig,
  setReportesConfig,
  getTicketsConfig,
  setTicketsConfig,
  getCocinaConfig,
  setCocinaConfig,
  getBackupConfig,
  setBackupConfig,
  
  // Utilidades
  validateConfig,
  exportConfig,
  importConfig
};
