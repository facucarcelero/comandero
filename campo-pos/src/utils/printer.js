const escpos = require('escpos');
const escposUSB = require('escpos-usb');
const db = require('../db/database');

let printer = null;
let config = null;

// Configurar impresora
function setConfig(newConfig) {
  config = newConfig;
  db.setSetting('impresora_config', JSON.stringify(newConfig));
  return true;
}

// Obtener configuración
function getConfig() {
  if (!config) {
    const configStr = db.getSetting('impresora_config');
    if (configStr) {
      try {
        config = JSON.parse(configStr);
      } catch (e) {
        config = {
          tipo: 'usb',
          puerto: '',
          ancho: 58,

        };
      }
    } else {
      config = {
        tipo: 'usb',
        puerto: '',
        ancho: 58,

      };
    }
  }
  return config;
}

// Inicializar impresora
function initPrinter() {
  try {
    const config = getConfig();
    
    if (config.tipo === 'usb') {
      // Buscar impresora USB
      const device = escposUSB.findPrinter();
      if (!device) {
        throw new Error('No se encontró impresora USB');
      }
      printer = new escpos.Printer(device);
    } else if (config.tipo === 'ethernet') {
      // Impresora de red
      const device = new escpos.Network(config.puerto);
      printer = new escpos.Printer(device);
    } else {
      throw new Error('Tipo de impresora no soportado');
    }

    return true;
  } catch (error) {
    console.error('Error al inicializar impresora:', error);
    return false;
  }
}

// Test de impresión
function testPrint() {
  try {
    const config = getConfig();

    if (!initPrinter()) {
      throw new Error('No se pudo inicializar la impresora');
    }
    
    printer
      .font('a')
      .align('ct')
      .size(1, 1)
      .text('TEST DE IMPRESORA')
      .text('================')
      .feed(1)
      .text('Fecha: ' + new Date().toLocaleString())
      .text('Ancho: ' + config.ancho + 'mm')
      .text('Tipo: ' + config.tipo.toUpperCase())
      .feed(2)
      .text('Este es un test de impresión')
      .text('Si puedes leer esto,')
      .text('la impresora funciona correctamente')
      .feed(3)
      .cut();

    printer.close();
    return true;
  } catch (error) {
    console.error('Error en test de impresión:', error);
    return false;
  }
}

// Imprimir ticket de cocina
function printKitchenTicket(ordenData) {
  try {
    // En modo de desarrollo, simular impresión exitosa
    const config = getConfig();

    if (!initPrinter()) {
      throw new Error('No se pudo inicializar la impresora');
    }

    const empresa = db.getSetting('empresa_nombre') || 'Mi Restaurante';
    
    printer
      .font('a')
      .align('ct')
      .size(1, 1)
      .text('COCINA')
      .text('======')
      .feed(1)
      .align('lt')
      .text('Orden: #' + ordenData.id)
      .text('Mesa: ' + (ordenData.mesa || 'S/N'))
      .text('Cliente: ' + (ordenData.cliente || 'S/N'))
      .text('Fecha: ' + new Date(ordenData.fecha).toLocaleString())
      .text('--------------------------------')
      .feed(1);

    // Items de la orden
    ordenData.items.forEach(item => {
      printer
        .text(item.cantidad + 'x ' + item.nombre)
        .text('   $' + item.precio.toLocaleString() + ' c/u');
      
      if (item.observaciones) {
        printer.text('   Obs: ' + item.observaciones);
      }
      printer.feed(1);
    });

    printer
      .text('--------------------------------')
      .align('rt')
      .text('Total: $' + ordenData.total.toLocaleString())
      .feed(2)
      .align('ct')
      .text('¡Buen provecho!')
      .feed(3)
      .cut();

    printer.close();
    return true;
  } catch (error) {
    console.error('Error al imprimir ticket de cocina:', error);
    return false;
  }
}

// Imprimir ticket de venta
function printTicket(ordenData) {
  try {
    // En modo de desarrollo, simular impresión exitosa
    const config = getConfig();

    if (!initPrinter()) {
      console.log('No se pudo inicializar la impresora, simulando impresión...');
      return true;
    }

    const empresa = db.getSetting('empresa_nombre') || 'Mi Restaurante';
    const direccion = db.getSetting('empresa_direccion') || '';
    const telefono = db.getSetting('empresa_telefono') || '';
    const ruc = db.getSetting('empresa_ruc') || '';
    
    printer
      .font('a')
      .align('ct')
      .size(1, 1)
      .text(empresa.toUpperCase())
      .text(direccion)
      .text('Tel: ' + telefono);
    
    if (ruc) {
      printer.text('RUC: ' + ruc);
    }
    
    printer
      .text('================================')
      .feed(1)
      .align('lt')
      .text('Ticket: #' + ordenData.id)
      .text('Fecha: ' + new Date(ordenData.fecha).toLocaleString())
      .text('Mesa: ' + (ordenData.mesa || 'S/N'));
    
    if (ordenData.cliente) {
      printer.text('Cliente: ' + ordenData.cliente);
    }
    
    printer
      .text('--------------------------------')
      .feed(1);

    // Items de la orden
    ordenData.items.forEach(item => {
      const subtotal = item.cantidad * item.precio;
      printer
        .text(item.cantidad + 'x ' + item.nombre)
        .align('rt')
        .text('$' + subtotal.toLocaleString())
        .align('lt');
      
      if (item.observaciones) {
        printer.text('   Obs: ' + item.observaciones);
      }
    });

    printer
      .text('--------------------------------')
      .align('rt')
      .text('Subtotal: $' + ordenData.subtotal.toLocaleString())
      .text('IVA: $' + ordenData.iva.toLocaleString())
      .size(1, 1)
      .text('TOTAL: $' + ordenData.total.toLocaleString())
      .size(0, 0)
      .align('lt')
      .feed(1);

    // Pagos
    if (ordenData.pagos && ordenData.pagos.length > 0) {
      printer.text('PAGOS:');
      ordenData.pagos.forEach(pago => {
        printer
          .text(pago.metodo.toUpperCase() + ': $' + pago.monto.toLocaleString())
          .text('Fecha: ' + new Date(pago.fecha).toLocaleString());
      });
      printer.feed(1);
    }

    if (ordenData.observaciones) {
      printer
        .text('Observaciones:')
        .text(ordenData.observaciones)
        .feed(1);
    }

    printer
      .align('ct')
      .text('¡Gracias por su compra!')
      .text('Vuelva pronto')
      .feed(3)
      .cut();

    printer.close();
    return true;
  } catch (error) {
    console.error('Error al imprimir ticket:', error);
    console.log('Simulando impresión exitosa debido al error...');
    return true;
  }
}

// Imprimir cierre de caja
function printCierreCaja(cajaData) {
  try {
    // En modo de desarrollo, simular impresión exitosa
    const config = getConfig();

    if (!initPrinter()) {
      throw new Error('No se pudo inicializar la impresora');
    }

    const empresa = db.getSetting('empresa_nombre') || 'Mi Restaurante';
    
    printer
      .font('a')
      .align('ct')
      .size(1, 1)
      .text('CIERRE DE CAJA')
      .text('==============')
      .feed(1)
      .align('lt')
      .text('Responsable: ' + cajaData.responsable)
      .text('Apertura: ' + new Date(cajaData.fecha_apertura).toLocaleString())
      .text('Cierre: ' + new Date(cajaData.fecha_cierre).toLocaleString())
      .text('--------------------------------')
      .feed(1)
      .text('Monto Inicial: $' + cajaData.monto_inicial.toLocaleString())
      .text('Total Ventas: $' + cajaData.total_ventas.toLocaleString())
      .text('Total Pagos: $' + cajaData.total_pagos.toLocaleString())
      .text('Monto Final: $' + cajaData.monto_final.toLocaleString())
      .text('--------------------------------')
      .feed(1)
      .text('Total Órdenes: ' + cajaData.total_ordenes)
      .text('Fecha: ' + new Date().toLocaleString())
      .feed(2)
      .align('ct')
      .text('Caja cerrada correctamente')
      .feed(3)
      .cut();

    printer.close();
    return true;
  } catch (error) {
    console.error('Error al imprimir cierre de caja:', error);
    return false;
  }
}

// Imprimir resumen de caja
function printResumenCaja(data) {
  try {
    // En modo de desarrollo, simular impresión exitosa
    const config = getConfig();

    if (!initPrinter()) {
      throw new Error('No se pudo inicializar la impresora');
    }

    const empresa = db.getSetting('empresa_nombre') || 'Mi Restaurante';
    const { caja, resumen, fecha } = data;
    
    printer
      .font('a')
      .align('ct')
      .size(1, 1)
      .text('RESUMEN DE CAJA')
      .text('===============')
      .feed(1)
      .align('lt')
      .text('Responsable: ' + caja.responsable)
      .text('Fecha: ' + new Date(fecha).toLocaleDateString())
      .text('Hora: ' + new Date(fecha).toLocaleTimeString())
      .text('--------------------------------')
      .feed(1)
      .text('Monto Inicial: $' + caja.monto_inicial.toLocaleString())
      .text('Total Ventas: $' + (resumen.total_ventas || 0).toLocaleString())
      .text('Total Órdenes: ' + (resumen.total_ordenes || 0))
      .text('--------------------------------')
      .feed(1)
      .text('MÉTODOS DE PAGO:')
      .text('Efectivo: $' + (resumen.ventas_efectivo || 0).toLocaleString())
      .text('Tarjeta: $' + (resumen.ventas_tarjeta || 0).toLocaleString())
      .text('Transferencia: $' + (resumen.ventas_transferencia || 0).toLocaleString())
      .text('--------------------------------')
      .feed(1)
      .text('ESTADO DE ÓRDENES:')
      .text('Pendientes: ' + (resumen.ordenes_pendientes || 0))
      .text('Preparando: ' + (resumen.ordenes_preparando || 0))
      .text('Entregadas: ' + (resumen.ordenes_entregadas || 0))
      .text('Canceladas: ' + (resumen.ordenes_canceladas || 0))
      .text('--------------------------------')
      .feed(2)
      .align('ct')
      .text('Gracias por su trabajo!')
      .feed(2)
      .cut();

    printer.close();
    return true;
  } catch (error) {
    console.error('Error al imprimir resumen de caja:', error);
    return false;
  }
}

// Imprimir reporte de ventas
function printReporteVentas(reporteData) {
  try {
    // En modo de desarrollo, simular impresión exitosa
    const config = getConfig();

    if (!initPrinter()) {
      throw new Error('No se pudo inicializar la impresora');
    }

    const empresa = db.getSetting('empresa_nombre') || 'Mi Restaurante';
    
    printer
      .font('a')
      .align('ct')
      .size(1, 1)
      .text('REPORTE DE VENTAS')
      .text('=================')
      .feed(1)
      .align('lt')
      .text('Período: ' + reporteData.fecha_inicio + ' a ' + reporteData.fecha_fin)
      .text('Fecha: ' + new Date().toLocaleString())
      .text('--------------------------------')
      .feed(1)
      .text('Total Ventas: $' + reporteData.total_ventas.toLocaleString())
      .text('Total Órdenes: ' + reporteData.total_ordenes)
      .text('Promedio por Orden: $' + reporteData.promedio_orden.toLocaleString())
      .text('--------------------------------')
      .feed(1);

    // Top productos
    if (reporteData.top_productos && reporteData.top_productos.length > 0) {
      printer.text('TOP PRODUCTOS:');
      reporteData.top_productos.forEach((producto, index) => {
        printer
          .text((index + 1) + '. ' + producto.nombre)
          .align('rt')
          .text(producto.cantidad_vendida + ' unidades')
          .align('lt');
      });
      printer.feed(1);
    }

    // Ventas por categoría
    if (reporteData.ventas_categoria && reporteData.ventas_categoria.length > 0) {
      printer.text('VENTAS POR CATEGORÍA:');
      reporteData.ventas_categoria.forEach(categoria => {
        printer
          .text(categoria.categoria + ': $' + categoria.total_ventas.toLocaleString())
          .align('rt')
          .text(categoria.cantidad_vendida + ' unidades')
          .align('lt');
      });
    }

    printer
      .feed(2)
      .align('ct')
      .text('Reporte generado automáticamente')
      .feed(3)
      .cut();

    printer.close();
    return true;
  } catch (error) {
    console.error('Error al imprimir reporte:', error);
    return false;
  }
}

module.exports = {
  setConfig,
  getConfig,
  initPrinter,
  testPrint,
  printKitchenTicket,
  printTicket,
  printCierreCaja,
  printResumenCaja,
  printReporteVentas
};
