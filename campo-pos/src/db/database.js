const { getDb } = require('./index');

// Función helper para ejecutar consultas
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// ===== CAJA =====

function getCajaEstado() {
  return getQuery(`
    SELECT * FROM caja 
    WHERE estado = 'abierta' 
    ORDER BY fecha_apertura DESC 
    LIMIT 1
  `);
}

function abrirCaja(caja) {
  return runQuery(`
    INSERT INTO caja (fecha_apertura, monto_inicial, estado, responsable)
    VALUES (?, ?, 'abierta', ?)
  `, [caja.fecha_apertura, caja.monto_inicial, caja.responsable])
    .then(result => ({ id: result.id, ...caja }));
}

function cerrarCaja(id, monto_final) {
  return runQuery(`
    UPDATE caja 
    SET estado = 'cerrada', fecha_cierre = ?, monto_final = ?
    WHERE id = ?
  `, [new Date().toISOString(), monto_final, id]);
}

function getResumenCaja(fecha) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    // Obtener caja del día
    db.get(`SELECT * FROM caja WHERE fecha_apertura LIKE ? ORDER BY fecha_apertura DESC`, [`${fecha}%`], (err, caja) => {
      if (err) {
        console.error('❌ Error al obtener caja:', err);
        reject(err);
        return;
      }
      
      if (!caja) {
        resolve(null);
        return;
      }
      
      // Obtener órdenes del día
      db.get(`
        SELECT COUNT(*) as total_ordenes, COALESCE(SUM(total), 0) as total_ventas
        FROM ordenes 
        WHERE DATE(created_at) = DATE(?)
      `, [fecha], (err, ordenes) => {
        if (err) {
          console.error('❌ Error al obtener órdenes:', err);
          reject(err);
          return;
        }
        
        // Obtener pagos por método
        db.all(`
          SELECT metodo, COALESCE(SUM(monto), 0) as total
          FROM pagos p
          JOIN ordenes o ON p.orden_id = o.id
          WHERE DATE(o.created_at) = DATE(?)
          GROUP BY metodo
        `, [fecha], (err, pagos) => {
          if (err) {
            console.error('❌ Error al obtener pagos:', err);
            reject(err);
            return;
          }
          
          // Obtener estados de órdenes
          db.all(`
            SELECT estado, COUNT(*) as total
            FROM ordenes
            WHERE DATE(created_at) = DATE(?)
            GROUP BY estado
          `, [fecha], (err, estados) => {
            if (err) {
              console.error('❌ Error al obtener estados:', err);
              reject(err);
              return;
            }
            
            // Procesar datos
            const ventas_efectivo = pagos.find(p => p.metodo === 'efectivo')?.total || 0;
            const ventas_tarjeta = pagos.find(p => p.metodo === 'tarjeta')?.total || 0;
            const ventas_transferencia = pagos.find(p => p.metodo === 'transferencia')?.total || 0;
            
            const ordenes_pendientes = estados.find(e => e.estado === 'pendiente')?.total || 0;
            const ordenes_preparando = estados.find(e => e.estado === 'preparando')?.total || 0;
            const ordenes_entregadas = estados.find(e => e.estado === 'entregada')?.total || 0;
            const ordenes_canceladas = estados.find(e => e.estado === 'cancelada')?.total || 0;
            
            const resumen = {
              ...caja,
              total_ventas: ordenes.total_ventas || 0,
              total_ordenes: ordenes.total_ordenes || 0,
              total_pagos: ventas_efectivo + ventas_tarjeta + ventas_transferencia,
              ventas_efectivo,
              ventas_tarjeta,
              ventas_transferencia,
              ordenes_pendientes,
              ordenes_preparando,
              ordenes_entregadas,
              ordenes_canceladas
            };
            
            resolve(resumen);
          });
        });
      });
    });
  });
}

function getHistorialCajas(fechaInicio, fechaFin) {
  return allQuery(`
    SELECT * FROM caja 
    WHERE fecha_apertura BETWEEN ? AND ?
    ORDER BY fecha_apertura DESC
  `, [fechaInicio, fechaFin]);
}

// ===== PRODUCTOS =====

function getProductos() {
  return allQuery('SELECT * FROM productos WHERE activo = 1 ORDER BY nombre');
}

function getProducto(id) {
  return getQuery('SELECT * FROM productos WHERE id = ?', [id]);
}

function createProducto(producto) {
  return runQuery(`
    INSERT INTO productos (nombre, categoria, precio, stock, activo, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    producto.nombre,
    producto.categoria,
    producto.precio,
    producto.stock || 0,
    producto.activo !== undefined ? producto.activo : 1,
    new Date().toISOString(),
    new Date().toISOString()
  ]).then(result => ({ id: result.id, ...producto }));
}

function updateProducto(id, producto) {
  return runQuery(`
    UPDATE productos 
    SET nombre = ?, categoria = ?, precio = ?, stock = ?, activo = ?, updated_at = ?
    WHERE id = ?
  `, [
    producto.nombre,
    producto.categoria,
    producto.precio,
    producto.stock,
    producto.activo,
    new Date().toISOString(),
    id
  ]).then(() => ({ id, ...producto }));
}

function deleteProducto(id) {
  return runQuery('UPDATE productos SET activo = 0 WHERE id = ?', [id])
    .then(() => ({ id }));
}

function updateStock(id, cantidad) {
  return runQuery(`
    UPDATE productos 
    SET stock = stock - ?, updated_at = ?
    WHERE id = ? AND stock >= ?
  `, [cantidad, new Date().toISOString(), id, cantidad])
    .then(result => {
      if (result.changes === 0) {
        throw new Error('Stock insuficiente');
      }
      return { id, cantidad };
    });
}

// ===== ÓRDENES =====

function getOrdenes(filtros = {}) {
  let sql = 'SELECT * FROM ordenes WHERE 1=1';
  const params = [];
  
  if (filtros.estado) {
    sql += ' AND estado = ?';
    params.push(filtros.estado);
  }
  
  if (filtros.fecha) {
    sql += ' AND DATE(created_at) = DATE(?)';
    params.push(filtros.fecha);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  return allQuery(sql, params);
}

function getOrden(id) {
  return getQuery('SELECT * FROM ordenes WHERE id = ?', [id]);
}

function createOrden(orden) {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Crear orden
      const ordenStmt = db.prepare(`
        INSERT INTO ordenes (numero, estado, total, subtotal, iva, metodo_pago, mesa, cliente, observaciones, caja_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const ordenResult = ordenStmt.run(
        orden.numero,
        orden.estado,
        orden.total,
        orden.subtotal,
        orden.iva,
        orden.metodo_pago,
        orden.mesa,
        orden.cliente,
        orden.observaciones,
        orden.caja_id
      );
      
      const ordenId = ordenResult.lastID;
      
      // Crear items de la orden
      const itemStmt = db.prepare(`
        INSERT INTO orden_items (orden_id, producto_id, qty, precio_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      for (const item of orden.items) {
        const qty = item.qty || item.cantidad || 1;
        const precio_unitario = item.precio_unitario || item.precio || 0;
        const subtotal = qty * precio_unitario;
        
        itemStmt.run(ordenId, item.producto_id, qty, precio_unitario, subtotal);
        
        // Actualizar stock
        updateStock(item.producto_id, qty).catch(err => {
          console.error('Error actualizando stock:', err);
        });
      }
      
      // Crear pago
      if (orden.metodo_pago && orden.total > 0) {
        const pagoStmt = db.prepare(`
          INSERT INTO pagos (orden_id, metodo, monto, created_at)
          VALUES (?, ?, ?, ?)
        `);
        pagoStmt.run(ordenId, orden.metodo_pago, orden.total, new Date().toISOString());
      }
      
      db.run('COMMIT', (err) => {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
        } else {
          resolve({ id: ordenId, ...orden });
        }
      });
    });
  });
}

function updateOrdenEstado(id, estado) {
  return runQuery('UPDATE ordenes SET estado = ? WHERE id = ?', [estado, id])
    .then(() => ({ id, estado }));
}

function deleteOrden(id, motivo) {
  return runQuery('UPDATE ordenes SET estado = ? WHERE id = ?', ['cancelada', id])
    .then(() => ({ id, motivo }));
}

// ===== PAGOS =====

function addPago(pago) {
  return runQuery(`
    INSERT INTO pagos (orden_id, metodo, monto, created_at)
    VALUES (?, ?, ?, ?)
  `, [pago.orden_id, pago.metodo, pago.monto, new Date().toISOString()])
    .then(result => ({ id: result.id, ...pago }));
}

function getPagos(ordenId) {
  return allQuery('SELECT * FROM pagos WHERE orden_id = ?', [ordenId]);
}

// ===== SETTINGS =====

function getSetting(key) {
  return getQuery('SELECT value FROM settings WHERE key = ?', [key])
    .then(result => result ? result.value : null);
}

function setSetting(key, value) {
  return runQuery('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value])
    .then(() => ({ key, value }));
}

function getAllSettings() {
  return allQuery('SELECT * FROM settings');
}

// ===== REPORTES =====

function getVentasPorFecha(fechaInicio, fechaFin) {
  return allQuery(`
    SELECT 
      DATE(created_at) as fecha,
      COUNT(*) as total_ordenes,
      SUM(total) as total_ventas
    FROM ordenes 
    WHERE estado = 'entregada' 
    AND DATE(created_at) BETWEEN ? AND ?
    GROUP BY DATE(created_at)
    ORDER BY fecha DESC
  `, [fechaInicio, fechaFin]);
}

function getVentasPorCategoria(fechaInicio, fechaFin) {
  return allQuery(`
    SELECT 
      p.categoria,
      COUNT(*) as total_ventas,
      SUM(oi.subtotal) as total_monto
    FROM orden_items oi
    JOIN productos p ON oi.producto_id = p.id
    JOIN ordenes o ON oi.orden_id = o.id
    WHERE o.estado = 'entregada'
    AND DATE(o.created_at) BETWEEN ? AND ?
    GROUP BY p.categoria
    ORDER BY total_monto DESC
  `, [fechaInicio, fechaFin]);
}

function getProductosMasVendidos(fechaInicio, fechaFin) {
  return allQuery(`
    SELECT 
      p.id,
      p.nombre,
      p.categoria,
      SUM(oi.qty) as total_vendido,
      SUM(oi.subtotal) as total_monto
    FROM orden_items oi
    JOIN productos p ON oi.producto_id = p.id
    JOIN ordenes o ON oi.orden_id = o.id
    WHERE o.estado = 'entregada'
    AND DATE(o.created_at) BETWEEN ? AND ?
    GROUP BY p.id, p.nombre, p.categoria
    ORDER BY total_vendido DESC
  `, [fechaInicio, fechaFin]);
}

module.exports = {
  // Caja
  getCajaEstado,
  abrirCaja,
  cerrarCaja,
  getResumenCaja,
  getHistorialCajas,
  
  // Productos
  getProductos,
  getProducto,
  createProducto,
  updateProducto,
  deleteProducto,
  updateStock,
  
  // Órdenes
  getOrdenes,
  getOrden,
  createOrden,
  updateOrdenEstado,
  deleteOrden,
  
  // Pagos
  addPago,
  getPagos,
  
  // Settings
  getSetting,
  setSetting,
  getAllSettings,
  
  // Reportes
  getVentasPorFecha,
  getVentasPorCategoria,
  getProductosMasVendidos
};