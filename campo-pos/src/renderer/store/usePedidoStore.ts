import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OrdenItem, Orden } from '../types/global';

interface PedidoState {
  // Estado del pedido actual
  items: OrdenItem[];
  mesa: string;
  cliente: string;
  observaciones: string;
  
  // Cálculos
  subtotal: number;
  iva: number;
  total: number;
  
  // Estado de la aplicación
  isLoading: boolean;
  error: string | null;
  
  // Acciones para items
  addItem: (producto: {
    id: number;
    nombre: string;
    precio: number;
    categoria: string;
  }) => void;
  removeItem: (index: number) => void;
  updateItemQuantity: (index: number, cantidad: number) => void;
  updateItemObservations: (index: number, observaciones: string) => void;
  clearItems: () => void;
  
  // Acciones para el pedido
  setMesa: (mesa: string) => void;
  setCliente: (cliente: string) => void;
  setObservaciones: (observaciones: string) => void;
  clearPedido: () => void;
  
  // Acciones de estado
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Utilidades
  getItemCount: () => number;
  getItemByProductId: (productoId: number) => OrdenItem | undefined;
  hasItems: () => boolean;
  recalculateTotals: (ivaPercentage: number) => void;
}

// Función para calcular totales
const calculateTotals = (items: OrdenItem[], ivaPercentage: number = 0.19) => {
  const subtotal = items.reduce((total, item) => total + item.subtotal, 0);
  const iva = Math.round(subtotal * ivaPercentage);
  const total = subtotal + iva;
  
  return { subtotal, iva, total };
};

export const usePedidoStore = create<PedidoState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      items: [],
      mesa: '',
      cliente: '',
      observaciones: '',
      subtotal: 0,
      iva: 0,
      total: 0,
      isLoading: false,
      error: null,
      
      // Acciones para items
      addItem: (producto) => {
        const { items } = get();
        const existingItemIndex = items.findIndex(
          item => item.producto_id === producto.id
        );
        
        if (existingItemIndex >= 0) {
          // Si el producto ya existe, incrementar cantidad
          const updatedItems = [...items];
          const existingItem = updatedItems[existingItemIndex];
          existingItem.cantidad += 1;
          existingItem.subtotal = existingItem.cantidad * existingItem.precio;
          updatedItems[existingItemIndex] = existingItem;
          
          const totals = calculateTotals(updatedItems);
          set({ items: updatedItems, ...totals });
        } else {
          // Si es un producto nuevo, agregarlo
          const newItem: OrdenItem = {
            producto_id: producto.id,
            nombre: producto.nombre,
            cantidad: 1,
            precio: producto.precio,
            subtotal: producto.precio,
            observaciones: ''
          };
          
          const updatedItems = [...items, newItem];
          const totals = calculateTotals(updatedItems);
          set({ items: updatedItems, ...totals });
        }
      },
      
      removeItem: (index) => {
        const { items } = get();
        const updatedItems = items.filter((_, i) => i !== index);
        const totals = calculateTotals(updatedItems);
        set({ items: updatedItems, ...totals });
      },
      
      updateItemQuantity: (index, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(index);
          return;
        }
        
        const { items } = get();
        const updatedItems = [...items];
        const item = updatedItems[index];
        item.cantidad = cantidad;
        item.subtotal = cantidad * item.precio;
        updatedItems[index] = item;
        
        const totals = calculateTotals(updatedItems);
        set({ items: updatedItems, ...totals });
      },
      
      updateItemObservations: (index, observaciones) => {
        const { items } = get();
        const updatedItems = [...items];
        updatedItems[index].observaciones = observaciones;
        set({ items: updatedItems });
      },
      
      clearItems: () => {
        set({ 
          items: [], 
          subtotal: 0, 
          iva: 0, 
          total: 0 
        });
      },
      
      // Acciones para el pedido
      setMesa: (mesa) => set({ mesa }),
      setCliente: (cliente) => set({ cliente }),
      setObservaciones: (observaciones) => set({ observaciones }),
      
      clearPedido: () => {
        set({
          items: [],
          mesa: '',
          cliente: '',
          observaciones: '',
          subtotal: 0,
          iva: 0,
          total: 0,
          error: null
        });
      },
      
      // Acciones de estado
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      
      // Utilidades
      getItemCount: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.cantidad, 0);
      },
      
      getItemByProductId: (productoId) => {
        const { items } = get();
        return items.find(item => item.producto_id === productoId);
      },
      
      hasItems: () => {
        const { items } = get();
        return items.length > 0;
      },

      // Recalcular totales con nuevo IVA
      recalculateTotals: (ivaPercentage: number) => {
        const { items } = get();
        const totals = calculateTotals(items, ivaPercentage);
        set({ 
          subtotal: totals.subtotal, 
          iva: totals.iva, 
          total: totals.total 
        });
      }
    }),
    {
      name: 'pedido-storage',
      partialize: (state) => ({
        items: state.items,
        mesa: state.mesa,
        cliente: state.cliente,
        observaciones: state.observaciones,
        subtotal: state.subtotal,
        iva: state.iva,
        total: state.total
      })
    }
  )
);

// Selectores derivados
export const usePedidoSelectors = () => {
  const store = usePedidoStore();
  
  return {
    // Estado básico
    items: store.items,
    mesa: store.mesa,
    cliente: store.cliente,
    observaciones: store.observaciones,
    subtotal: store.subtotal,
    iva: store.iva,
    total: store.total,
    isLoading: store.isLoading,
    error: store.error,
    
    // Selectores derivados
    itemCount: store.getItemCount(),
    hasItems: store.hasItems(),
    isEmpty: !store.hasItems(),
    
    // Información del pedido
    pedidoInfo: {
      mesa: store.mesa || 'S/N',
      cliente: store.cliente || 'Cliente general',
      itemCount: store.getItemCount(),
      total: store.total
    },
    
    // Items agrupados por categoría
    itemsByCategory: store.items.reduce((acc, item) => {
      // Nota: Aquí necesitarías acceso a la información de categoría del producto
      // Por simplicidad, usamos el nombre del producto
      const category = item.nombre.split(' ')[0]; // Simplificación
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, OrdenItem[]>),
    
    // Resumen de items
    itemsSummary: store.items.map(item => ({
      nombre: item.nombre,
      cantidad: item.cantidad,
      precio: item.precio,
      subtotal: item.subtotal,
      observaciones: item.observaciones
    }))
  };
};

// Hook para acciones del pedido
export const usePedidoActions = () => {
  const store = usePedidoStore();
  
  return {
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateItemQuantity: store.updateItemQuantity,
    updateItemObservations: store.updateItemObservations,
    clearItems: store.clearItems,
    setMesa: store.setMesa,
    setCliente: store.setCliente,
    setObservaciones: store.setObservaciones,
    clearPedido: store.clearPedido,
    setLoading: store.setLoading,
    setError: store.setError,
    recalculateTotals: store.recalculateTotals
  };
};

// Hook para crear orden desde el pedido actual
export const useCreateOrden = () => {
  const store = usePedidoStore();
  
  return () => {
    const { items, mesa, cliente, observaciones, subtotal, iva, total } = store;
    
    if (items.length === 0) {
      throw new Error('No hay items en el pedido');
    }
    
    const orden: Omit<Orden, 'id'> = {
      estado: 'pendiente',
      mesa,
      cliente,
      subtotal,
      iva,
      total,
      observaciones,
      items: items.map(item => ({
        ...item,
        // Asegurar que todos los campos requeridos estén presentes
        producto_id: item.producto_id,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio: item.precio,
        subtotal: item.subtotal,
        observaciones: item.observaciones || ''
      }))
    };
    
    return orden;
  };
};

// Hook para validar el pedido
export const useValidatePedido = () => {
  const store = usePedidoStore();
  
  return () => {
    const { items, cliente } = store;
    const errors: string[] = [];
    
    if (items.length === 0) {
      errors.push('El pedido debe tener al menos un item');
    }
    
    // Mesa es opcional, no validar
    
    if (!cliente.trim()) {
      errors.push('Debe especificar un cliente');
    }
    
    // Validar que todos los items tengan cantidad > 0
    const invalidItems = items.filter(item => item.cantidad <= 0);
    if (invalidItems.length > 0) {
      errors.push('Todos los items deben tener una cantidad mayor a 0');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
};
