const path = require('path');
const fs = require('fs');

// Resolver ruta de dependencias para aplicación empaquetada
function resolveNodeModule(moduleName) {
  const possiblePaths = [
    path.join(__dirname, '../../node_modules', moduleName),
    path.join(__dirname, '../../../resources/node_modules', moduleName),
    path.join(process.resourcesPath, 'node_modules', moduleName)
  ];

  for (const modulePath of possiblePaths) {
    if (fs.existsSync(modulePath)) {
      return modulePath;
    }
  }

  // Fallback a require normal
  return moduleName;
}

const low = require(resolveNodeModule('lowdb'));
const FileSync = require(resolveNodeModule('lowdb/adapters/FileSync'));

let db;

// Inicializar base de datos
function init() {
  return new Promise((resolve, reject) => {
    try {
      const dbPath = path.join(__dirname, '../../db/database.json');
      
      // Crear directorio si no existe
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Crear archivo de base de datos si no existe
      if (!fs.existsSync(dbPath)) {
        const initialData = {
          settings: [],
          caja: [],
          productos: [],
          ordenes: [],
          orden_items: [],
          pagos: [],
          kitchen_tickets: []
        };
        fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
      }

      const adapter = new FileSync(dbPath);
      db = low(adapter);

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

      console.log('Base de datos inicializada correctamente');
      resolve();
    } catch (error) {
      console.error('Error al inicializar la base de datos:', error);
      reject(error);
    }
  });
}

// ===== PRODUCTOS =====

function getProductos(filtros = {}) {
  let productos = db.get('productos').value();

  if (filtros.categoria) {
    productos = productos.filter(p => p.categoria === filtros.categoria);
  }

  if (filtros.activo !== undefined) {
    productos = productos.filter(p => p.activo === filtros.activo);
  }

  if (filtros.busqueda) {
    productos = productos.filter(p => 
      p.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase())
    );
  }

  return productos.sort((a, b) => {
    if (a.categoria !== b.categoria) {
      return a.categoria.localeCompare(b.categoria);
    }
    return a.nombre.localeCompare(b.nombre);
  });
}

function getProducto(id) {
  return db.get('productos').find({ id: parseInt(id) }).value();
}

function createProducto(producto) {
  const productos = db.get('productos').value();
  const newId = productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 1;
  
  const newProducto = {
    id: newId,
    nombre: producto.nombre,
    categoria: producto.categoria,
    precio: producto.precio,
    stock: producto.stock || 0,
    activo: producto.activo !== false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.get('productos').push(newProducto).write();
  return newProducto;
}

function updateProducto(id, producto) {
  const result = db.get('productos')
    .find({ id: parseInt(id) })
    .assign({
      ...producto,
      updated_at: new Date().toISOString()
    })
    .write();

  return !!result;
}

function deleteProducto(id) {
  const result = db.get('productos')
    .remove({ id: parseInt(id) })
    .write();

  return result.length > 0;
}

function importProductos(productos) {
  const existingProducts = db.get('productos').value();
  const maxId = existingProducts.length > 0 ? Math.max(...existingProducts.map(p => p.id)) : 0;
  
  const importedProducts = productos.map((producto, index) => ({
    id: maxId + index + 1,
    nombre: producto.nombre,
    categoria: producto.categoria,
    precio: producto.precio,
    stock: producto.stock || 0,
    activo: producto.activo !== false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  db.get('productos').push(...importedProducts).write();
  return importedProducts.length;
}

// ===== CAJA =====

function getEstadoCaja() {
  const cajas = db.get('caja').value();
  return cajas.find(c => c.estado === 'abierta') || null;
}

function abrirCaja(data) {
  const cajaAbierta = getEstadoCaja();
  if (cajaAbierta) {
    throw new Error('Ya existe una caja abierta');
  }

  const cajas = db.get('caja').value();
  const newId = cajas.length > 0 ? Math.max(...cajas.map(c => c.id)) + 1 : 1;

  const newCaja = {
    id: newId,
    fecha_apertura: new Date().toISOString(),
    monto_inicial: data.monto_inicial,
    responsable: data.responsable,
    estado: 'abierta',
    total_ventas: 0,
    total_ordenes: 0,
    total_pagos: 0
  };

  db.get('caja').push(newCaja).write();
  return { id: newCaja.id, ...data };
}

function cerrarCaja(data) {
  const cajaAbierta = getEstadoCaja();
  if (!cajaAbierta) {
    throw new Error('No hay caja abierta para cerrar');
  }

  const result = db.get('caja')
    .find({ id: cajaAbierta.id })
    .assign({
      fecha_cierre: new Date().toISOString(),
      monto_final: data.monto_final,
      estado: 'cerrada'
    })
    .write();

  return !!result;
}

function getResumenCaja(fecha = null) {
  const fechaFiltro = fecha || new Date().toISOString().split('T')[0];
  
  const cajas = db.get('caja').value();
  const caja = cajas.find(c => 
    c.fecha_apertura.split('T')[0] === fechaFiltro
  );

  if (!caja) return null;

  const ordenes = db.get('ordenes').value();
  const pagos = db.get('pagos').value();

  const ordenesDelDia = ordenes.filter(o => o.caja_id === caja.id);
  const totalVentas = ordenesDelDia.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalPagos = pagos
    .filter(p => ordenesDelDia.some(o => o.id === p.orden_id))
    .reduce((sum, p) => sum + (p.monto || 0), 0);

  return {
    ...caja,
    total_ordenes: ordenesDelDia.length,
    total_ventas: totalVentas,
    total_pagos: totalPagos
  };
}

// ===== ÓRDENES =====

function createOrden(orden) {
  const cajaAbierta = getEstadoCaja();
  if (!cajaAbierta) {
    throw new Error('No se puede crear una orden sin caja abierta');
  }

  const ordenes = db.get('ordenes').value();
  const ordenItems = db.get('orden_items').value();
  const productos = db.get('productos').value();

  const newOrdenId = ordenes.length > 0 ? Math.max(...ordenes.map(o => o.id)) + 1 : 1;
  const newItemId = ordenItems.length > 0 ? Math.max(...ordenItems.map(i => i.id)) + 1 : 1;

  // Crear la orden
  const newOrden = {
    id: newOrdenId,
    mesa: orden.mesa,
    cliente: orden.cliente,
    subtotal: orden.subtotal,
    iva: orden.iva,
    total: orden.total,
    caja_id: cajaAbierta.id,
    observaciones: orden.observaciones,
    estado: 'pendiente',
    fecha: new Date().toISOString()
  };

  db.get('ordenes').push(newOrden).write();

  // Crear los items de la orden
  const items = orden.items.map((item, index) => ({
    id: newItemId + index,
    orden_id: newOrdenId,
    producto_id: item.producto_id,
    nombre: item.nombre,
    cantidad: item.cantidad,
    precio: item.precio,
    subtotal: item.subtotal,
    observaciones: item.observaciones
  }));

  db.get('orden_items').push(...items).write();

  // Actualizar stock de productos
  orden.items.forEach(item => {
    const producto = productos.find(p => p.id === item.producto_id);
    if (producto) {
      db.get('productos')
        .find({ id: item.producto_id })
        .assign({ stock: producto.stock - item.cantidad })
        .write();
    }
  });

  // Actualizar totales de caja
  db.get('caja')
    .find({ estado: 'abierta' })
    .assign({
      total_ventas: (cajaAbierta.total_ventas || 0) + orden.total,
      total_ordenes: (cajaAbierta.total_ordenes || 0) + 1
    })
    .write();

  return { id: newOrdenId, ...orden };
}

function getOrdenes(filtros = {}) {
  let ordenes = db.get('ordenes').value();
  const cajas = db.get('caja').value();

  if (filtros.estado) {
    ordenes = ordenes.filter(o => o.estado === filtros.estado);
  }

  if (filtros.fecha_desde) {
    ordenes = ordenes.filter(o => o.fecha.split('T')[0] >= filtros.fecha_desde);
  }

  if (filtros.fecha_hasta) {
    ordenes = ordenes.filter(o => o.fecha.split('T')[0] <= filtros.fecha_hasta);
  }

  if (filtros.mesa) {
    ordenes = ordenes.filter(o => o.mesa === filtros.mesa);
  }

  // Agregar información de la caja
  ordenes = ordenes.map(orden => {
    const caja = cajas.find(c => c.id === orden.caja_id);
    return {
      ...orden,
      responsable: caja ? caja.responsable : null
    };
  });

  ordenes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (filtros.limit) {
    ordenes = ordenes.slice(0, filtros.limit);
  }

  return ordenes;
}

function getOrden(id) {
  const orden = db.get('ordenes').find({ id: parseInt(id) }).value();
  if (!orden) return null;

  const items = db.get('orden_items').value();
  const pagos = db.get('pagos').value();
  const productos = db.get('productos').value();

  orden.items = items
    .filter(i => i.orden_id === parseInt(id))
    .map(item => {
      const producto = productos.find(p => p.id === item.producto_id);
      return {
        ...item,
        categoria: producto ? producto.categoria : null
      };
    });

  orden.pagos = pagos.filter(p => p.orden_id === parseInt(id));

  return orden;
}

function updateEstadoOrden(id, estado) {
  const result = db.get('ordenes')
    .find({ id: parseInt(id) })
    .assign({ estado })
    .write();

  return !!result;
}

function deleteOrden(id, motivo) {
  try {
    const orden = db.get('ordenes').find({ id: parseInt(id) }).value();
    if (!orden) {
      return false;
    }

    // Marcar como eliminada en lugar de borrar físicamente
    const result = db.get('ordenes')
      .find({ id: parseInt(id) })
      .assign({ 
        estado: 'eliminada',
        motivo_eliminacion: motivo,
        fecha_eliminacion: new Date().toISOString()
      })
      .write();

    if (result) {
      // Restaurar stock de los productos
      const items = db.get('orden_items').filter({ orden_id: parseInt(id) }).value();
      
      for (const item of items) {
        const producto = db.get('productos').find({ id: item.producto_id }).value();
        if (producto) {
          // Restaurar el stock
          db.get('productos')
            .find({ id: item.producto_id })
            .assign({ stock: producto.stock + item.cantidad })
            .write();
        }
      }

      // Marcar items como eliminados también
      db.get('orden_items')
        .filter({ orden_id: parseInt(id) })
        .assign({ estado: 'eliminado' })
        .write();

      // Marcar pagos como eliminados
      db.get('pagos')
        .filter({ orden_id: parseInt(id) })
        .assign({ estado: 'eliminado' })
        .write();

      // Actualizar totales de caja si está abierta
      const cajaAbierta = db.get('caja').find({ estado: 'abierta' }).value();
      if (cajaAbierta) {
        // Restar el total de la orden eliminada de los totales de caja
        const totalOrden = orden.total || 0;
        const pagosOrden = db.get('pagos').filter({ orden_id: parseInt(id) }).value();
        const cantidadPagos = pagosOrden.length;
        
        // Actualizar totales de caja
        db.get('caja')
          .find({ estado: 'abierta' })
          .assign({
            total_ventas: Math.max(0, (cajaAbierta.total_ventas || 0) - totalOrden),
            total_ordenes: Math.max(0, (cajaAbierta.total_ordenes || 0) - 1),
            total_pagos: Math.max(0, (cajaAbierta.total_pagos || 0) - cantidadPagos)
          })
          .write();
      }
    }

    return !!result;
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    return false;
  }
}

// ===== PAGOS =====

function addPago(pago) {
  const pagos = db.get('pagos').value();
  const newId = pagos.length > 0 ? Math.max(...pagos.map(p => p.id)) + 1 : 1;

  const newPago = {
    id: newId,
    orden_id: pago.orden_id,
    metodo: pago.metodo,
    monto: pago.monto,
    fecha: new Date().toISOString()
  };

  db.get('pagos').push(newPago).write();

  // Actualizar total de pagos en caja si está abierta
  const cajaAbierta = db.get('caja').find({ estado: 'abierta' }).value();
  if (cajaAbierta) {
    db.get('caja')
      .find({ estado: 'abierta' })
      .assign({
        total_pagos: (cajaAbierta.total_pagos || 0) + 1
      })
      .write();
  }

  return newPago;
}

function getPagos(ordenId) {
  return db.get('pagos')
    .filter({ orden_id: parseInt(ordenId) })
    .sortBy('fecha')
    .value();
}

// ===== REPORTES =====

function getVentasPorFecha(fechaInicio, fechaFin) {
  const ordenes = db.get('ordenes').value();
  
  const ventas = ordenes
    .filter(o => {
      const fecha = o.fecha.split('T')[0];
      return fecha >= fechaInicio && fecha <= fechaFin && o.estado === 'completado';
    })
    .reduce((acc, orden) => {
      const fecha = orden.fecha.split('T')[0];
      if (!acc[fecha]) {
        acc[fecha] = {
          fecha,
          total_ordenes: 0,
          total_ventas: 0,
          subtotal: 0,
          iva: 0
        };
      }
      acc[fecha].total_ordenes++;
      acc[fecha].total_ventas += orden.total || 0;
      acc[fecha].subtotal += orden.subtotal || 0;
      acc[fecha].iva += orden.iva || 0;
      return acc;
    }, {});

  return Object.values(ventas).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function getVentasPorCategoria(fechaInicio, fechaFin) {
  const ordenes = db.get('ordenes').value();
  const ordenItems = db.get('orden_items').value();
  const productos = db.get('productos').value();

  const ventas = ordenes
    .filter(o => {
      const fecha = o.fecha.split('T')[0];
      return fecha >= fechaInicio && fecha <= fechaFin && o.estado === 'completado';
    })
    .reduce((acc, orden) => {
      const items = ordenItems.filter(i => i.orden_id === orden.id);
      items.forEach(item => {
        const producto = productos.find(p => p.id === item.producto_id);
        if (producto) {
          if (!acc[producto.categoria]) {
            acc[producto.categoria] = {
              categoria: producto.categoria,
              cantidad_vendida: 0,
              total_ventas: 0
            };
          }
          acc[producto.categoria].cantidad_vendida += item.cantidad;
          acc[producto.categoria].total_ventas += item.subtotal;
        }
      });
      return acc;
    }, {});

  return Object.values(ventas).sort((a, b) => b.total_ventas - a.total_ventas);
}

function getProductosMasVendidos(fechaInicio, fechaFin, limit = 10) {
  const ordenes = db.get('ordenes').value();
  const ordenItems = db.get('orden_items').value();
  const productos = db.get('productos').value();

  const ventas = ordenes
    .filter(o => {
      const fecha = o.fecha.split('T')[0];
      return fecha >= fechaInicio && fecha <= fechaFin && o.estado === 'completado';
    })
    .reduce((acc, orden) => {
      const items = ordenItems.filter(i => i.orden_id === orden.id);
      items.forEach(item => {
        const producto = productos.find(p => p.id === item.producto_id);
        if (producto) {
          const key = `${item.producto_id}-${item.nombre}`;
          if (!acc[key]) {
            acc[key] = {
              nombre: item.nombre,
              categoria: producto.categoria,
              cantidad_vendida: 0,
              total_ventas: 0
            };
          }
          acc[key].cantidad_vendida += item.cantidad;
          acc[key].total_ventas += item.subtotal;
        }
      });
      return acc;
    }, {});

  return Object.values(ventas)
    .sort((a, b) => b.cantidad_vendida - a.cantidad_vendida)
    .slice(0, limit);
}

// ===== UTILIDADES =====

function getCategorias() {
  const productos = db.get('productos').value();
  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
  return categorias.sort();
}

function close() {
  return Promise.resolve();
}

module.exports = {
  init,
  close,
  // Productos
  getProductos,
  getProducto,
  createProducto,
  updateProducto,
  deleteProducto,
  importProductos,
  // Caja
  getEstadoCaja,
  abrirCaja,
  cerrarCaja,
  getResumenCaja,
  // Órdenes
  createOrden,
  getOrdenes,
  getOrden,
  updateEstadoOrden,
  deleteOrden,
  // Pagos
  addPago,
  getPagos,
  // Reportes
  getVentasPorFecha,
  getVentasPorCategoria,
  getProductosMasVendidos,
  // Utilidades
  getCategorias
};