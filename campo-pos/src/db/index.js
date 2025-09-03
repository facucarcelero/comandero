const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let db = null;

// Obtener la ruta de la base de datos en userData
function getDbPath() {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'campo-pos');
  
  // Crear directorio si no existe
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  return path.join(dbDir, 'data.db');
}

// Inicializar base de datos
function init() {
  return new Promise((resolve, reject) => {
    try {
      console.log('🔧 Iniciando proceso de inicialización de base de datos...');
      const dbPath = getDbPath();
      console.log('🗄️ Inicializando base de datos SQLite en:', dbPath);
      
      db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('❌ Error al abrir base de datos:', err);
          reject(err);
          return;
        }
        
        console.log('📊 Instancia de base de datos creada:', !!db);
        
        // Configurar SQLite para mejor rendimiento
        db.run('PRAGMA journal_mode = WAL');
        db.run('PRAGMA synchronous = NORMAL');
        db.run('PRAGMA cache_size = 1000');
        db.run('PRAGMA temp_store = MEMORY');
        console.log('⚙️ Configuración de SQLite aplicada');
        
        // Ejecutar migraciones
        runMigrations()
          .then(() => {
            console.log('✅ Base de datos inicializada correctamente');
            resolve();
          })
          .catch((error) => {
            console.error('❌ Error en migraciones:', error);
            reject(error);
          });
      });
        
    } catch (error) {
      console.error('❌ Error al inicializar base de datos SQLite:', error);
      reject(error);
    }
  });
}

// Ejecutar migraciones
async function runMigrations() {
  console.log('🔄 Ejecutando migraciones...');
  
  const migrations = [
    `CREATE TABLE IF NOT EXISTS caja (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha_apertura TEXT NOT NULL,
      fecha_cierre TEXT,
      monto_inicial REAL NOT NULL DEFAULT 0,
      monto_final REAL,
      estado TEXT NOT NULL DEFAULT 'abierta',
      responsable TEXT NOT NULL,
      total_ventas REAL DEFAULT 0,
      total_ordenes INTEGER DEFAULT 0,
      total_pagos INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    
    `CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      categoria TEXT,
      precio REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,
    
    `CREATE TABLE IF NOT EXISTS ordenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT UNIQUE,
      estado TEXT CHECK(estado IN('pendiente','preparando','entregada','cancelada')) NOT NULL,
      total REAL,
      subtotal REAL,
      iva REAL,
      metodo_pago TEXT,
      mesa TEXT,
      cliente TEXT,
      observaciones TEXT,
      caja_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (caja_id) REFERENCES caja(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS orden_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orden_id INTEGER,
      producto_id INTEGER,
      qty INTEGER,
      precio_unitario REAL,
      subtotal REAL,
      FOREIGN KEY (orden_id) REFERENCES ordenes(id),
      FOREIGN KEY (producto_id) REFERENCES productos(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS pagos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orden_id INTEGER,
      metodo TEXT,
      monto REAL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (orden_id) REFERENCES ordenes(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS kitchen_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orden_id INTEGER,
      contenido TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (orden_id) REFERENCES ordenes(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`
  ];
  
  // Crear índices
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_orden_items_orden ON orden_items(orden_id)',
    'CREATE INDEX IF NOT EXISTS idx_orden_items_producto ON orden_items(producto_id)',
    'CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria)',
    'CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo)',
    'CREATE INDEX IF NOT EXISTS idx_pagos_orden ON pagos(orden_id)'
  ];
  
  // Ejecutar migraciones
  for (const migration of migrations) {
    await new Promise((resolve, reject) => {
      db.run(migration, (err) => {
        if (err) {
          console.error('❌ Error en migración:', err);
          reject(err);
        } else {
          console.log('✅ Migración ejecutada:', migration.substring(0, 50) + '...');
          resolve();
        }
      });
    });
  }
  
  // Ejecutar índices
  for (const index of indexes) {
    await new Promise((resolve, reject) => {
      db.run(index, (err) => {
        if (err) {
          console.error('❌ Error creando índice:', err);
          reject(err);
        } else {
          console.log('✅ Índice creado:', index.substring(0, 50) + '...');
          resolve();
        }
      });
    });
  }
  
  // Insertar configuraciones iniciales
  const initialSettings = [
    ['empresa_nombre', 'Mi Restaurante'],
    ['empresa_direccion', 'Dirección del restaurante'],
    ['empresa_telefono', ''],
    ['empresa_email', ''],
    ['empresa_ruc', ''],
    ['iva_porcentaje', '0'],
    ['moneda', 'ARS'],
    ['moneda_simbolo', '$'],
    ['impresora_tipo', 'usb'],
    ['impresora_puerto', ''],
    ['impresora_ancho', '58']
  ];
  
  for (const [key, value] of initialSettings) {
    await new Promise((resolve, reject) => {
      db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value], (err) => {
        if (err) {
          console.error(`❌ Error insertando configuración ${key}:`, err);
          reject(err);
        } else {
          console.log(`✅ Configuración inicial: ${key} = ${value}`);
          resolve();
        }
      });
    });
  }
  
  console.log('✅ Todas las migraciones completadas');
}

// Cerrar base de datos
function close() {
  if (db) {
    db.close();
    db = null;
    console.log('🔒 Base de datos cerrada');
  }
}

// Ejecutar transacción
function withTransaction(callback) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      callback()
        .then((result) => {
          db.run('COMMIT', (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        })
        .catch((error) => {
          db.run('ROLLBACK', () => {
            reject(error);
          });
        });
    });
  });
}

// Obtener instancia de la base de datos
function getDb() {
  if (!db) {
    throw new Error('Base de datos no inicializada');
  }
  return db;
}

module.exports = {
  init,
  close,
  withTransaction,
  getDb
};