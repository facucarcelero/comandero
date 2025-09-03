// Wrapper para la API de Electron IPC
// Proporciona una interfaz tipada para comunicarse con el proceso principal

import type { Producto, Orden, Pago, Caja, ConfiguracionImpresora } from '../types/global';

// API wrapper con manejo de errores
class ApiWrapper {
  private async handleRequest<T>(request: () => Promise<T>): Promise<T> {
    try {
      return await request();
    } catch (error) {
      console.error('Error en API request:', error);
      throw error;
    }
  }

  // Settings
  async getSetting(key: string): Promise<any> {
    return this.handleRequest(() => window.api.settings.get(key));
  }

  async setSetting(key: string, value: any): Promise<boolean> {
    return this.handleRequest(() => window.api.settings.set(key, value));
  }

  async getAllSettings(): Promise<any> {
    return this.handleRequest(() => window.api.settings.getAll());
  }

  // Caja
  async abrirCaja(data: { monto_inicial: number; responsable: string }): Promise<Caja> {
    return this.handleRequest(() => window.api.caja.abrir(data));
  }

  async getEstadoCaja(): Promise<Caja | null> {
    return this.handleRequest(() => window.api.caja.estado());
  }

  async cerrarCaja(data: { monto_final: number }): Promise<boolean> {
    return this.handleRequest(() => window.api.caja.cerrar(data));
  }

  async getResumenCaja(fecha?: string): Promise<any> {
    return this.handleRequest(() => window.api.caja.resumenDia(fecha));
  }

  async getHistorialCajas(fechaInicio: string, fechaFin: string): Promise<any[]> {
    return this.handleRequest(() => window.api.caja.historial(fechaInicio, fechaFin));
  }

  // Productos
  async getProductos(filtros?: any): Promise<Producto[]> {
    return this.handleRequest(() => window.api.productos.list(filtros));
  }

  async createProducto(producto: Omit<Producto, 'id'>): Promise<Producto> {
    return this.handleRequest(() => window.api.productos.create(producto));
  }

  async updateProducto(id: number, producto: Partial<Producto>): Promise<boolean> {
    return this.handleRequest(() => window.api.productos.update(id, producto));
  }

  async deleteProducto(id: number): Promise<boolean> {
    return this.handleRequest(() => window.api.productos.delete(id));
  }

  async importProductos(productos: Producto[]): Promise<number> {
    return this.handleRequest(() => window.api.productos.import(productos));
  }

  // Órdenes
  async createOrden(orden: Omit<Orden, 'id'>): Promise<Orden> {
    return this.handleRequest(() => window.api.ordenes.create(orden));
  }

  async getOrdenes(filtros?: any): Promise<Orden[]> {
    return this.handleRequest(() => window.api.ordenes.list(filtros));
  }

  async updateEstadoOrden(id: number, estado: string): Promise<boolean> {
    return this.handleRequest(() => window.api.ordenes.changeStatus(id, estado));
  }

  async getOrden(id: number): Promise<Orden | null> {
    return this.handleRequest(() => window.api.ordenes.get(id));
  }

  async deleteOrden(id: number, motivo: string): Promise<boolean> {
    return this.handleRequest(() => window.api.ordenes.delete(id, motivo));
  }

  // Pagos
  async addPago(pago: Omit<Pago, 'id'>): Promise<Pago> {
    return this.handleRequest(() => window.api.pagos.add(pago));
  }

  async getPagos(ordenId: number): Promise<Pago[]> {
    return this.handleRequest(() => window.api.pagos.list(ordenId));
  }

  // Reportes
  async getVentasPorFecha(fechaInicio: string, fechaFin: string): Promise<any[]> {
    return this.handleRequest(() => window.api.reportes.getVentasPorFecha(fechaInicio, fechaFin));
  }

  async getVentasPorCategoria(fechaInicio: string, fechaFin: string): Promise<any[]> {
    return this.handleRequest(() => window.api.reportes.getVentasPorCategoria(fechaInicio, fechaFin));
  }

  async getProductosMasVendidos(fechaInicio: string, fechaFin: string, limit: number = 10): Promise<any[]> {
    return this.handleRequest(() => window.api.reportes.getProductosMasVendidos(fechaInicio, fechaFin, limit));
  }

  // Impresora
  async configImpresora(config: ConfiguracionImpresora): Promise<boolean> {
    return this.handleRequest(() => window.api.printer.config(config));
  }

  async testImpresora(): Promise<boolean> {
    return this.handleRequest(() => window.api.printer.test());
  }

  async printKitchenTicket(ordenData: Orden): Promise<boolean> {
    return this.handleRequest(() => window.api.printer.printKitchen(ordenData));
  }

  async printTicket(ordenData: Orden): Promise<boolean> {
    return this.handleRequest(() => window.api.printer.printTicket(ordenData));
  }

  async printCierreCaja(cajaData: any): Promise<boolean> {
    return this.handleRequest(() => window.api.printer.printClose(cajaData));
  }

  async printResumenCaja(data: any): Promise<boolean> {
    return this.handleRequest(() => window.api.printer.printResumenCaja(data));
  }

  async printReporteVentas(reporteData: any): Promise<boolean> {
    return this.handleRequest(() => window.api.printer.printReporteVentas(reporteData));
  }

  // Backup
  async exportData(filePath?: string): Promise<any> {
    return this.handleRequest(() => window.api.backup.export(filePath));
  }

  async importData(filePath: string): Promise<any> {
    return this.handleRequest(() => window.api.backup.import(filePath));
  }

  async verifyBackup(filePath: string): Promise<any> {
    return this.handleRequest(() => window.api.backup.verify(filePath));
  }

  // Diálogos
  async openFileDialog(options: any): Promise<any> {
    return this.handleRequest(() => window.api.dialog.openFile(options));
  }

  async saveFileDialog(options: any): Promise<any> {
    return this.handleRequest(() => window.api.dialog.saveFile(options));
  }

  // Alias para compatibilidad
  get dialog() {
    return {
      openFile: this.openFileDialog,
      saveFile: this.saveFileDialog
    };
  }
}

// Instancia singleton de la API
export const api = new ApiWrapper();

// Utilidades para formateo
export const formatCurrency = (amount: number, currency = 'COP'): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateOnly = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Constantes
export const ESTADOS_ORDEN = {
  PENDIENTE: 'pendiente',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado'
} as const;

export const METODOS_PAGO = {
  EFECTIVO: 'efectivo',
  TARJETA: 'tarjeta',
  TRANSFERENCIA: 'transferencia'
} as const;

export const TIPOS_IMPRESORA = {
  USB: 'usb',
  ETHERNET: 'ethernet'
} as const;

export const ANCHOS_IMPRESORA = {
  MM_58: 58,
  MM_80: 80
} as const;
