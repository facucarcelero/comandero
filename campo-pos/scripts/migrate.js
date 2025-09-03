const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// Obtener la ruta de la base de datos
function getDbPath() {
  const userDataPath = process.env.APPDATA || 
    (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config');
  
  const dbDir = path.join(userDataPath, 'campo-pos');
  
  // Crear directorio si no existe
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  return path.join(dbDir, 'data.db');
}

// Ejecutar migraciones
async function runMigrations() {
  let db;
  
  try {
    const dbPath = getDbPath();
    console.log('🗄️ Conectando a base de datos:', dbPath);
    
    db = new sqlite3.Database(dbPath);
    console.log('✅ Base de datos conectada');
    
    // Leer archivo de migración
    const migrationPath = path.join(__dirname, '..', 'db', 'init.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Ejecutar migraciones
    console.log('🔄 Ejecutando migraciones...');
    db.exec(migrationSQL, (err) => {
      if (err) {
        console.error('❌ Error ejecutando migraciones:', err);
        process.exit(1);
      }
    });
    
    console.log('✅ Migraciones completadas exitosamente');
    
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    process.exit(1);
  } finally {
    if (db) {
      db.close();
      console.log('🔒 Base de datos cerrada');
    }
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };