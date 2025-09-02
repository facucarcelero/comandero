const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');

// Función para inicializar datos de prueba
function seedDatabase() {
  const dbPath = path.join(__dirname, '../../db/database.json');
  const adapter = new FileSync(dbPath);
  const db = low(adapter);

  // Establecer valores por defecto
  db.defaults({
    settings: [],
    caja: [],
    productos: [],
    ordenes: [],
    orden_items: [],
    pagos: [],
    kitchen_tickets: []
  }).write();

  // Datos de productos de ejemplo
  const productosEjemplo = [
    {
      id: 1,
      nombre: 'Hamburguesa Clásica',
      categoria: 'Hamburguesas',
      precio: 15000,
      stock: 50,
      activo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      nombre: 'Hamburguesa con Queso',
      categoria: 'Hamburguesas',
      precio: 18000,
      stock: 30,
      activo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      nombre: 'Pizza Margherita',
      categoria: 'Pizzas',
      precio: 25000,
      stock: 20,
      activo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      nombre: 'Pizza Pepperoni',
      categoria: 'Pizzas',
      precio: 28000,
      stock: 15,
      activo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      nombre: 'Coca Cola',
      categoria: 'Bebidas',
      precio: 3000,
      stock: 100,
      activo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 6,
      nombre: 'Agua',
      categoria: 'Bebidas',
      precio: 2000,
      stock: 80,
      activo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 7,
      nombre: 'Papas Fritas',
      categoria: 'Acompañamientos',
      precio: 5000,
      stock: 40,
      activo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 8,
      nombre: 'Ensalada César',
      categoria: 'Ensaladas',
      precio: 12000,
      stock: 25,
      activo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // Limpiar productos existentes y agregar los nuevos
  db.set('productos', productosEjemplo).write();

  // Configuración por defecto
  const configuracionEjemplo = [
    {
      key: 'empresa_nombre',
      value: 'Campo Restaurant'
    },
    {
      key: 'empresa_direccion',
      value: 'Calle 123 #45-67'
    },
    {
      key: 'empresa_telefono',
      value: '+57 300 123 4567'
    },
    {
      key: 'empresa_email',
      value: 'info@birthdayrestaurant.com'
    },
    {
      key: 'empresa_ruc',
      value: '12345678-9'
    },
    {
      key: 'iva_porcentaje',
      value: 19
    },
    {
      key: 'moneda',
      value: 'COP'
    },
    {
      key: 'moneda_simbolo',
      value: '$'
    },
    {
      key: 'impresora_tipo',
      value: 'usb'
    },
    {
      key: 'impresora_puerto',
      value: 'USB001'
    },
    {
      key: 'impresora_ancho',
      value: 58
    }
  ];

  db.set('settings', configuracionEjemplo).write();

  console.log('✅ Datos de prueba inicializados correctamente');
  console.log(`📦 ${productosEjemplo.length} productos agregados`);
  console.log(`⚙️ ${configuracionEjemplo.length} configuraciones agregadas`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
