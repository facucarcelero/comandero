import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { api } from '../lib/api';

// Tipos - usar los tipos existentes de la aplicación
import type { Caja, Producto, Orden } from '../types/global';

export type ConfigState = {
  vatRate: number;
  currency: string;
  currencySymbol: string;
};

export type OrderItem = {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
};

export type AppState = {
  // State
  cash: Caja | null;
  config: ConfigState;
  products: Producto[];
  isLoading: boolean;
  lastUpdate: number;
  
  // Actions
  loadAll: () => Promise<void>;
  forceSync: () => Promise<void>;
  setVAT: (rate: number) => Promise<void>;
  setCurrency: (currency: string, symbol: string) => Promise<void>;
  openCash: (payload: { monto_inicial: number; responsable: string }) => Promise<void>;
  closeCash: (payload: { monto_final: number }) => Promise<void>;
  createOrder: (items: OrderItem[], mesa?: string, cliente?: string, observaciones?: string) => Promise<Orden>;
  setLoading: (loading: boolean) => void;
};

// Función para comparar objetos
const isEqual = (a: any, b: any): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // Estado inicial
    cash: null,
    config: { vatRate: 0.19, currency: 'ARS', currencySymbol: '$' },
    products: [],
    isLoading: false,
    lastUpdate: 0,

    // Cargar todos los datos
    loadAll: async () => {
      try {
        set({ isLoading: true });
        
        const [cashState, settings, products] = await Promise.all([
          api.getEstadoCaja(),
          api.getAllSettings(),
          api.getProductos()
        ]);

        // Procesar configuraciones - asegurar que settings es un array
        const settingsArray = Array.isArray(settings) ? settings : [];
        
        const ivaValue = settingsArray.find(s => s.key === 'iva_porcentaje')?.value || 19;
        const config: ConfigState = {
          vatRate: typeof ivaValue === 'number' && ivaValue > 1 ? ivaValue / 100 : ivaValue,
          currency: settingsArray.find(s => s.key === 'moneda')?.value || 'ARS',
          currencySymbol: settingsArray.find(s => s.key === 'moneda_simbolo')?.value || '$'
        };

        // Solo actualizar si hay cambios reales
        const current = get();
        const hasChanges = !isEqual(current.cash, cashState) || 
                          !isEqual(current.config, config) || 
                          !isEqual(current.products, products);
        
        if (hasChanges) {
          set({ cash: cashState, config, products, lastUpdate: Date.now() });
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    // Sincronización forzada (sin throttling)
    forceSync: async () => {
      try {
        set({ isLoading: true });
        const [cashState, settings, products] = await Promise.all([
          api.getEstadoCaja(),
          api.getAllSettings(),
          api.getProductos()
        ]);

        const settingsArray = Array.isArray(settings) ? settings : [];
        const ivaValue = settingsArray.find(s => s.key === 'iva_porcentaje')?.value || 19;
        const config: ConfigState = {
          vatRate: typeof ivaValue === 'number' && ivaValue > 1 ? ivaValue / 100 : ivaValue,
          currency: settingsArray.find(s => s.key === 'moneda')?.value || 'ARS',
          currencySymbol: settingsArray.find(s => s.key === 'moneda_simbolo')?.value || '$'
        };

        set({ 
          cash: cashState, 
          config, 
          products, 
          lastUpdate: Date.now(),
          isLoading: false 
        });
      } catch (error) {
        console.error('Error en sincronización forzada:', error);
        set({ isLoading: false });
      }
    },

    // Establecer IVA
    setVAT: async (rate: number) => {
      const normalized = Math.max(0, Math.min(1, rate));
      const current = get().config.vatRate;
      
      if (Math.abs(current - normalized) < 0.001) return; // Evitar cambios mínimos
      
      set(state => ({ 
        config: { ...state.config, vatRate: normalized },
        lastUpdate: Date.now()
      }));
      
      await api.setSetting('iva_porcentaje', Math.round(normalized * 100));
    },

    // Establecer moneda
    setCurrency: async (currency: string, symbol: string) => {
      set(state => ({ 
        config: { ...state.config, currency, currencySymbol: symbol } 
      }));
      
      await Promise.all([
        api.setSetting('moneda', currency),
        api.setSetting('moneda_simbolo', symbol)
      ]);
    },

    // Abrir caja
    openCash: async (payload: { monto_inicial: number; responsable: string }) => {
      const cashData = await api.abrirCaja(payload);
      set({ cash: cashData });
    },

    // Cerrar caja
    closeCash: async (payload: { monto_final: number }) => {
      await api.cerrarCaja(payload);
      set({ cash: null });
    },

    // Crear orden
    createOrder: async (items: OrderItem[], mesa?: string, cliente?: string, observaciones?: string) => {
      const { config } = get();
      
      // Calcular totales
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const iva = subtotal * config.vatRate;
      const total = subtotal + iva;

      // Crear orden
      const orden = {
        mesa: mesa || '',
        cliente: cliente || '',
        observaciones: observaciones || '',
        subtotal,
        iva,
        total,
        estado: 'pendiente' as const,
        items: items.map(item => ({
          producto_id: item.id,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio: item.precio,
          subtotal: item.subtotal,
          observaciones: ''
        }))
      };

      const ordenCreada = await api.createOrden(orden);
      
      // Recargar datos para actualizar stock y estado
      await get().loadAll();
      
      return ordenCreada;
    },

    // Establecer loading
    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    }
  }))
);
