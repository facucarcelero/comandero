const db = require('./src/utils/db');

async function testAPI() {
  try {
    console.log('🧪 Probando la API de la base de datos...\n');
    
    // Inicializar la base de datos
    await db.init();
    console.log('✅ Base de datos inicializada\n');
    
    // Probar obtener productos
    const productos = await db.getProductos();
    console.log(`📦 Productos encontrados: ${productos.length}`);
    productos.forEach(p => {
      console.log(`  - ${p.nombre} (${p.categoria}): $${p.precio.toLocaleString()}`);
    });
    console.log('');
    
    // Probar obtener categorías
    const categorias = await db.getCategorias();
    console.log(`📂 Categorías: ${categorias.join(', ')}\n`);
    
    // Probar estado de caja
    const estadoCaja = await db.getEstadoCaja();
    console.log(`💰 Estado de caja: ${estadoCaja ? 'Abierta' : 'Cerrada'}\n`);
    
    // Probar crear una orden (esto fallará si no hay caja abierta)
    try {
      const orden = await db.createOrden({
        mesa: 'Mesa 1',
        cliente: 'Cliente de Prueba',
        subtotal: 15000,
        iva: 2850,
        total: 17850,
        observaciones: 'Orden de prueba',
        items: [{
          producto_id: 1,
          nombre: 'Hamburguesa Clásica',
          cantidad: 1,
          precio: 15000,
          subtotal: 15000
        }]
      });
      console.log(`✅ Orden creada: ID ${orden.id}`);
    } catch (error) {
      console.log(`⚠️ No se pudo crear orden: ${error.message}`);
    }
    
    console.log('\n🎉 Prueba de API completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en la prueba de API:', error);
  } finally {
    await db.close();
  }
}

testAPI();
