// Declaración de tipos globales para la aplicación

export interface Producto {
  id?: number;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface OrdenItem {
  id?: number;
  producto_id: number;
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  observaciones?: string;
}

export interface Orden {
  id?: number;
  fecha?: string;
  estado: 'pendiente' | 'completado' | 'cancelado' | 'eliminada';
  mesa?: string;
  cliente?: string;
  subtotal: number;
  iva: number;
  total: number;
  caja_id?: number;
  observaciones?: string;
  items: OrdenItem[];
  pagos?: Pago[];
  motivo_eliminacion?: string;
  fecha_eliminacion?: string;
}

export interface Pago {
  id?: number;
  orden_id: number;
  metodo: 'efectivo' | 'tarjeta' | 'transferencia';
  monto: number;
  fecha?: string;
}

export interface Caja {
  id?: number;
  fecha_apertura: string;
  fecha_cierre?: string;
  monto_inicial: number;
  monto_final?: number;
  responsable: string;
  estado: 'abierta' | 'cerrada';
}

export interface ConfiguracionImpresora {
  tipo: 'usb' | 'ethernet';
  puerto: string;
  ancho: 58 | 80;

}

export interface ConfiguracionEmpresa {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  ruc: string;
}

export interface ConfiguracionFiscal {
  iva_porcentaje: number;
  moneda: string;
  moneda_simbolo: string;
}

// Declaración de tipos para window.api
declare global {
  interface Window {
    api: {
      settings: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<boolean>;
        getAll: () => Promise<any>;
      };
      caja: {
        abrir: (data: { monto_inicial: number; responsable: string }) => Promise<Caja>;
        estado: () => Promise<Caja | null>;
        cerrar: (data: { monto_final: number }) => Promise<boolean>;
        resumenDia: (fecha?: string) => Promise<any>;
      };
      productos: {
        list: (filtros?: any) => Promise<Producto[]>;
        create: (producto: Omit<Producto, 'id'>) => Promise<Producto>;
        update: (id: number, producto: Partial<Producto>) => Promise<boolean>;
        delete: (id: number) => Promise<boolean>;
        import: (productos: Producto[]) => Promise<number>;
      };
      ordenes: {
        create: (orden: Omit<Orden, 'id'>) => Promise<Orden>;
        list: (filtros?: any) => Promise<Orden[]>;
        changeStatus: (id: number, estado: string) => Promise<boolean>;
        get: (id: number) => Promise<Orden | null>;
      };
      pagos: {
        add: (pago: Omit<Pago, 'id'>) => Promise<Pago>;
        list: (ordenId: number) => Promise<Pago[]>;
      };
      printer: {
        config: (config: ConfiguracionImpresora) => Promise<boolean>;
        test: () => Promise<boolean>;
        printKitchen: (ordenData: Orden) => Promise<boolean>;
        printTicket: (ordenData: Orden) => Promise<boolean>;
        printClose: (cajaData: any) => Promise<boolean>;
        printReporteVentas: (reporteData: any) => Promise<boolean>;
      };
      backup: {
        export: (filePath?: string) => Promise<any>;
        import: (filePath: string) => Promise<any>;
        verify: (filePath: string) => Promise<any>;
      };
      dialog: {
        openFile: (options: any) => Promise<any>;
        saveFile: (options: any) => Promise<any>;
      };
    };
    electron: {
      platform: string;
      versions: any;
    };
  }
}

export {};
