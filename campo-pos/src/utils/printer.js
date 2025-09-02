const escpos = require('escpos');
const escposUSB = require('escpos-usb');
const settings = require('./settings');

let printer = null;
let config = null;

// Configurar impresora
function setConfig(newConfig) {
  config = newConfig;
  settings.set('impresora_config', newConfig);
  return true;
}

// Obtener configuración
function getConfig() {
  if (!config) {
    config = settings.get('impresora_config') || {
      tipo: 'usb',
      puerto: '',
      ancho: 58,
      test_print: false
    };
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
    // En modo de desarrollo, simular impresión exitosa
    const config = getConfig();
    if (config.test_print) {
      console.log('🖨️ Simulando test de impresión...');
      return true;
    }

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
    if (config.test_print) {
      console.log('🖨️ Simulando impresión de comanda de cocina...');
      console.log('🍽️ Datos de la orden:', ordenData);
      return true;
    }

    if (!initPrinter()) {
      throw new Error('No se pudo inicializar la impresora');
    }

    const empresa = settings.get('empresa_nombre') || 'Mi Restaurante';
    
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
    if (config.test_print) {
      console.log('🖨️ Simulando impresión de ticket de venta...');
      console.log('🧾 Datos de la orden:', ordenData);
      return true;
    }

    if (!initPrinter()) {
      throw new Error('No se pudo inicializar la impresora');
    }

    const empresa = settings.get('empresa_nombre') || 'Mi Restaurante';
    const direccion = settings.get('empresa_direccion') || '';
    const telefono = settings.get('empresa_telefono') || '';
    const ruc = settings.get('empresa_ruc') || '';
    
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
    return false;
  }
}

// Imprimir cierre de caja
function printCierreCaja(cajaData) {
  try {
    // En modo de desarrollo, simular impresión exitosa
    const config = getConfig();
    if (config.test_print) {
      console.log('🖨️ Simulando impresión de cierre de caja...');
      console.log('💰 Datos de la caja:', cajaData);
      return true;
    }

    if (!initPrinter()) {
      throw new Error('No se pudo inicializar la impresora');
    }

    const empresa = settings.get('empresa_nombre') || 'Mi Restaurante';
    
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

// Imprimir reporte de ventas
function printReporteVentas(reporteData) {
  try {
    // En modo de desarrollo, simular impresión exitosa
    const config = getConfig();
    if (config.test_print) {
      console.log('🖨️ Simulando impresión de reporte de ventas...');
      console.log('📊 Datos del reporte:', reporteData);
      return true;
    }

    if (!initPrinter()) {
      throw new Error('No se pudo inicializar la impresora');
    }

    const empresa = settings.get('empresa_nombre') || 'Mi Restaurante';
    
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
  printReporteVentas
};
