const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../db/database');

// Crear backup de la base de datos
function createDatabaseBackup() {
  try {
    const dbPath = path.join(__dirname, '../../db/database.sqlite');
    const backupDir = path.join(__dirname, '../../backups');
    
    // Crear directorio de backups si no existe
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}.sqlite`);
    
    // Copiar archivo de base de datos
    fs.copyFileSync(dbPath, backupPath);
    
    return {
      success: true,
      path: backupPath,
      size: fs.statSync(backupPath).size,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error al crear backup de base de datos:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Exportar datos a JSON
function exportData(filePath = null) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultPath = filePath || path.join(__dirname, '../../backups', `export-${timestamp}.json`);
    
    // Crear directorio si no existe
    const dir = path.dirname(defaultPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Obtener todos los datos de la base de datos
    const data = {
      metadata: {
        version: '1.0.0',
        export_date: new Date().toISOString(),
        app_name: 'Campo POS'
      },
      settings: db.getAllSettings(),
      productos: db.getProductos(),
      ordenes: db.getOrdenes({ limit: 10000 }), // Límite para evitar archivos muy grandes
      caja: db.getResumenCaja(),
      categorias: db.getCategorias()
    };
    
    // Agregar items de órdenes
    data.ordenes = data.ordenes.map(orden => {
      const ordenCompleta = db.getOrden(orden.id);
      return ordenCompleta;
    });
    
    // Calcular hash para verificación de integridad
    const dataString = JSON.stringify(data, null, 2);
    const hash = crypto.createHash('sha256').update(dataString).digest('hex');
    data.metadata.hash = hash;
    
    // Escribir archivo
    fs.writeFileSync(defaultPath, JSON.stringify(data, null, 2));
    
    return {
      success: true,
      path: defaultPath,
      size: fs.statSync(defaultPath).size,
      hash: hash,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error al exportar datos:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Importar datos desde JSON
function importData(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('El archivo no existe');
    }
    
    // Leer y parsear archivo
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Verificar estructura básica
    if (!data.metadata || !data.metadata.version) {
      throw new Error('Archivo de backup inválido: falta metadata');
    }
    
    // Verificar hash si existe
    if (data.metadata.hash) {
      const dataWithoutHash = { ...data };
      delete dataWithoutHash.metadata.hash;
      const dataString = JSON.stringify(dataWithoutHash, null, 2);
      const calculatedHash = crypto.createHash('sha256').update(dataString).digest('hex');
      
      if (calculatedHash !== data.metadata.hash) {
        throw new Error('El archivo de backup está corrupto (hash no coincide)');
      }
    }
    
    // Importar configuraciones
    if (data.settings) {
      for (const setting of data.settings) {
        db.setSetting(setting.key, setting.value);
      }
    }
    
    // Importar productos
    if (data.productos && Array.isArray(data.productos)) {
      // Limpiar productos existentes (opcional)
      // db.clearProductos(); // Implementar si es necesario
      
      // Importar productos
      db.importProductos(data.productos);
    }
    
    // Importar órdenes (solo si no existen)
    if (data.ordenes && Array.isArray(data.ordenes)) {
      // Verificar si ya existen órdenes
      const ordenesExistentes = db.getOrdenes({ limit: 1 });
      if (ordenesExistentes.length === 0) {
        // Importar órdenes solo si no hay ninguna
        for (const orden of data.ordenes) {
          try {
            db.createOrden(orden);
          } catch (error) {
            console.warn('Error al importar orden:', error.message);
          }
        }
      }
    }
    
    return {
      success: true,
      imported: {
        settings: !!data.settings,
        productos: data.productos ? data.productos.length : 0,
        ordenes: data.ordenes ? data.ordenes.length : 0
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error al importar datos:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Verificar integridad del backup
function verifyBackup(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        error: 'El archivo no existe'
      };
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Verificar estructura básica
    if (!data.metadata) {
      return {
        valid: false,
        error: 'Falta metadata en el archivo'
      };
    }
    
    // Verificar hash si existe
    if (data.metadata.hash) {
      const dataWithoutHash = { ...data };
      delete dataWithoutHash.metadata.hash;
      const dataString = JSON.stringify(dataWithoutHash, null, 2);
      const calculatedHash = crypto.createHash('sha256').update(dataString).digest('hex');
      
      if (calculatedHash !== data.metadata.hash) {
        return {
          valid: false,
          error: 'El archivo está corrupto (hash no coincide)'
        };
      }
    }
    
    // Verificar datos requeridos
    const requiredFields = ['productos', 'ordenes'];
    for (const field of requiredFields) {
      if (!data[field] || !Array.isArray(data[field])) {
        return {
          valid: false,
          error: `Campo requerido '${field}' no encontrado o inválido`
        };
      }
    }
    
    return {
      valid: true,
      metadata: data.metadata,
      stats: {
        productos: data.productos.length,
        ordenes: data.ordenes.length,
        settings: !!data.settings
      }
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

// Limpiar backups antiguos
function cleanupOldBackups(daysToKeep = 30) {
  try {
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      return { success: true, deleted: 0 };
    }
    
    const files = fs.readdirSync(backupDir);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
    
    return {
      success: true,
      deleted: deletedCount
    };
  } catch (error) {
    console.error('Error al limpiar backups antiguos:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Crear backup automático
function createAutomaticBackup() {
  try {
    const config = {
      automatico: db.getSetting('backup_automatico') === 'true',
      retener_dias: parseInt(db.getSetting('backup_retener_dias')) || 30
    };
    
    if (!config.automatico) {
      return { success: true, message: 'Backup automático deshabilitado' };
    }
    
    const result = exportData();
    
    if (result.success) {
      // Limpiar backups antiguos
      cleanupOldBackups(config.retener_dias);
      
      return {
        success: true,
        message: 'Backup automático creado exitosamente',
        path: result.path
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error('Error en backup automático:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Restaurar desde backup
function restoreFromBackup(filePath) {
  try {
    // Verificar backup primero
    const verification = verifyBackup(filePath);
    if (!verification.valid) {
      throw new Error(verification.error);
    }
    
    // Crear backup de seguridad antes de restaurar
    const safetyBackup = createDatabaseBackup();
    if (!safetyBackup.success) {
      throw new Error('No se pudo crear backup de seguridad: ' + safetyBackup.error);
    }
    
    // Importar datos
    const importResult = importData(filePath);
    if (!importResult.success) {
      throw new Error('Error al importar datos: ' + importResult.error);
    }
    
    return {
      success: true,
      message: 'Restauración completada exitosamente',
      safetyBackup: safetyBackup.path,
      imported: importResult.imported
    };
  } catch (error) {
    console.error('Error al restaurar backup:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Obtener lista de backups disponibles
function getBackupList() {
  try {
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      return { success: true, backups: [] };
    }
    
    const files = fs.readdirSync(backupDir);
    const backups = [];
    
    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      
      backups.push({
        name: file,
        path: filePath,
        size: stats.size,
        created: stats.mtime.toISOString(),
        type: file.endsWith('.json') ? 'export' : 'database'
      });
    }
    
    // Ordenar por fecha de creación (más reciente primero)
    backups.sort((a, b) => new Date(b.created) - new Date(a.created));
    
    return {
      success: true,
      backups
    };
  } catch (error) {
    console.error('Error al obtener lista de backups:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  createDatabaseBackup,
  exportData,
  importData,
  verifyBackup,
  cleanupOldBackups,
  createAutomaticBackup,
  restoreFromBackup,
  getBackupList
};
