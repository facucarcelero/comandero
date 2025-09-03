// Módulo centralizado para manejar eventos IPC push
// Evita duplicar listeners y maneja la limpieza automática

import { useAppStore } from '../store/useAppStore';

class IPCEventManager {
  private listeners: Map<string, (event: any, data: any) => void> = new Map();
  private isInitialized = false;

  // Inicializar todos los listeners
  init() {
    if (this.isInitialized) {
      console.warn('IPCEventManager ya está inicializado');
      return;
    }

    console.log('🔗 Inicializando listeners de eventos IPC...');

    // Settings
    this.addListener('event:settingsUpdated', this.handleSettingsUpdated.bind(this));
    
    // Caja
    this.addListener('event:cajaOpened', this.handleCajaOpened.bind(this));
    this.addListener('event:cajaClosed', this.handleCajaClosed.bind(this));
    
    // Productos
    this.addListener('event:productoCreated', this.handleProductoCreated.bind(this));
    this.addListener('event:productoUpdated', this.handleProductoUpdated.bind(this));
    this.addListener('event:productoDeleted', this.handleProductoDeleted.bind(this));
    this.addListener('event:productosImported', this.handleProductosImported.bind(this));
    
    // Órdenes
    this.addListener('event:ordenCreated', this.handleOrdenCreated.bind(this));
    this.addListener('event:ordenUpdated', this.handleOrdenUpdated.bind(this));
    this.addListener('event:ordenDeleted', this.handleOrdenDeleted.bind(this));
    
    // Pagos
    this.addListener('event:pagoAdded', this.handlePagoAdded.bind(this));

    this.isInitialized = true;
    console.log('✅ Listeners de eventos IPC inicializados');
  }

  // Agregar listener
  private addListener(channel: string, handler: (event: any, data: any) => void) {
    if (this.listeners.has(channel)) {
      console.warn(`Listener para ${channel} ya existe`);
      return;
    }

    const wrappedHandler = (event: any, data: any) => {
      try {
        console.log(`📡 Evento recibido: ${channel}`, data);
        handler(event, data);
      } catch (error) {
        console.error(`❌ Error procesando evento ${channel}:`, error);
      }
    };

    (window.api as any).events[this.getEventMethodName(channel)](wrappedHandler);
    this.listeners.set(channel, wrappedHandler);
  }

  // Obtener nombre del método de evento
  private getEventMethodName(channel: string): string {
    const methodMap: Record<string, string> = {
      'event:settingsUpdated': 'onSettingsUpdated',
      'event:cajaOpened': 'onCajaOpened',
      'event:cajaClosed': 'onCajaClosed',
      'event:productoCreated': 'onProductoCreated',
      'event:productoUpdated': 'onProductoUpdated',
      'event:productoDeleted': 'onProductoDeleted',
      'event:productosImported': 'onProductosImported',
      'event:ordenCreated': 'onOrdenCreated',
      'event:ordenUpdated': 'onOrdenUpdated',
      'event:ordenDeleted': 'onOrdenDeleted',
      'event:pagoAdded': 'onPagoAdded'
    };
    
    return methodMap[channel] || channel;
  }

  // Handlers de eventos
  private handleSettingsUpdated(_event: any, data: { key: string; value: any }) {
    const store = useAppStore.getState();
    
    // Actualizar configuración específica
    if (data.key === 'iva_porcentaje') {
      const ivaValue = typeof data.value === 'number' && data.value > 1 ? data.value / 100 : data.value;
      store.setConfig({ ...store.config, vatRate: ivaValue });
    } else if (data.key === 'moneda') {
      store.setConfig({ ...store.config, currency: data.value });
    } else if (data.key === 'moneda_simbolo') {
      store.setConfig({ ...store.config, currencySymbol: data.value });
    }
  }

  private handleCajaOpened(_event: any, data: any) {
    const store = useAppStore.getState();
    store.setCash(data);
    // Cargar resumen del día cuando se abre la caja
    store.loadResumenDia();
  }

  private handleCajaClosed(_event: any, _data: any) {
    const store = useAppStore.getState();
    store.setCash(null);
    // Limpiar resumen del día cuando se cierra la caja
    store.setResumen(null);
  }

  private handleProductoCreated(_event: any, data: any) {
    const store = useAppStore.getState();
    const currentProducts = store.products;
    
    // Verificar si el producto ya existe (evitar duplicados)
    const exists = currentProducts.some(p => p.id === data.id);
    if (!exists) {
      store.setProducts([...currentProducts, data]);
    }
  }

  private handleProductoUpdated(_event: any, data: any) {
    const store = useAppStore.getState();
    const currentProducts = store.products;
    
    const updatedProducts = currentProducts.map(p => 
      p.id === data.id ? { ...p, ...data } : p
    );
    
    store.setProducts(updatedProducts);
  }

  private handleProductoDeleted(_event: any, data: { id: number }) {
    const store = useAppStore.getState();
    const currentProducts = store.products;
    
    const filteredProducts = currentProducts.filter(p => p.id !== data.id);
    store.setProducts(filteredProducts);
  }

  private handleProductosImported(_event: any, _data: { count: number }) {
    // Recargar productos después de importación masiva
    const store = useAppStore.getState();
    store.loadAll();
  }

  private handleOrdenCreated(_event: any, data: any) {
    // Las órdenes se manejan en el store de pedidos
    // Este evento se puede usar para notificaciones o actualizaciones específicas
    console.log('Nueva orden creada:', data);
  }

  private handleOrdenUpdated(_event: any, data: any) {
    // Actualizar orden en el store si es necesario
    console.log('Orden actualizada:', data);
  }

  private handleOrdenDeleted(_event: any, data: { id: number; motivo: string }) {
    // Manejar eliminación de orden
    console.log('Orden eliminada:', data);
  }

  private handlePagoAdded(_event: any, data: any) {
    // Manejar pago agregado
    console.log('Pago agregado:', data);
  }

  // Limpiar todos los listeners
  cleanup() {
    if (!this.isInitialized) return;

    console.log('🧹 Limpiando listeners de eventos IPC...');
    
    for (const [channel] of this.listeners) {
      (window.api as any).events.removeAllListeners(channel);
    }
    
    this.listeners.clear();
    this.isInitialized = false;
    console.log('✅ Listeners de eventos IPC limpiados');
  }
}

// Instancia singleton
export const ipcEventManager = new IPCEventManager();

// Hook para usar en componentes React
export const useIPCEvents = () => {
  return {
    init: () => ipcEventManager.init(),
    cleanup: () => ipcEventManager.cleanup()
  };
};
