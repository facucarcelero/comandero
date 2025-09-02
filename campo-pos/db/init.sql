-- Configuración del sistema
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Tabla de caja
CREATE TABLE IF NOT EXISTS caja (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha_apertura TEXT NOT NULL,
  fecha_cierre TEXT,
  monto_inicial REAL NOT NULL DEFAULT 0,
  monto_final REAL,
  responsable TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'abierta' -- abierta | cerrada
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  categoria TEXT,
  precio REAL NOT NULL,
  stock INTEGER DEFAULT 0,
  activo INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabla de órdenes
CREATE TABLE IF NOT EXISTS ordenes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL DEFAULT (datetime('now')),
  estado TEXT NOT NULL DEFAULT 'pendiente', -- pendiente | completado | cancelado
  mesa TEXT,
  cliente TEXT,
  subtotal REAL NOT NULL DEFAULT 0,
  iva REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  caja_id INTEGER,
  observaciones TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(caja_id) REFERENCES caja(id)
);

-- Tabla de items de órdenes
CREATE TABLE IF NOT EXISTS orden_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  producto_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 1,
  precio REAL NOT NULL,
  subtotal REAL NOT NULL,
  observaciones TEXT,
  FOREIGN KEY(orden_id) REFERENCES ordenes(id) ON DELETE CASCADE,
  FOREIGN KEY(producto_id) REFERENCES productos(id)
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  metodo TEXT NOT NULL, -- efectivo | tarjeta | transferencia
  monto REAL NOT NULL,
  fecha TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(orden_id) REFERENCES ordenes(id) ON DELETE CASCADE
);

-- Tabla de tickets de cocina
CREATE TABLE IF NOT EXISTS kitchen_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orden_id INTEGER NOT NULL,
  data TEXT NOT NULL,
  printed_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(orden_id) REFERENCES ordenes(id) ON DELETE CASCADE
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_ordenes_fecha ON ordenes(fecha);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_caja_id ON ordenes(caja_id);
CREATE INDEX IF NOT EXISTS idx_orden_items_orden_id ON orden_items(orden_id);
CREATE INDEX IF NOT EXISTS idx_orden_items_producto_id ON orden_items(producto_id);
CREATE INDEX IF NOT EXISTS idx_pagos_orden_id ON pagos(orden_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);

-- Configuración inicial
INSERT OR IGNORE INTO settings (key, value) VALUES 
('empresa_nombre', 'Mi Restaurante'),
('empresa_direccion', 'Dirección del restaurante'),
('empresa_telefono', ''),
('empresa_email', ''),
('empresa_ruc', ''),
('iva_porcentaje', '19'),
('moneda', 'COP'),
('impresora_tipo', 'usb'),
('impresora_puerto', ''),
('impresora_ancho', '58'),
('impresora_test_print', 'false');

-- Productos de ejemplo
INSERT OR IGNORE INTO productos (nombre, categoria, precio, stock) VALUES 
('Hamburguesa Clásica', 'Hamburguesas', 15000, 50),
('Hamburguesa Especial', 'Hamburguesas', 18000, 30),
('Papas Fritas', 'Acompañamientos', 5000, 100),
('Coca Cola', 'Bebidas', 3000, 200),
('Agua', 'Bebidas', 2000, 150),
('Ensalada César', 'Ensaladas', 12000, 25),
('Pizza Margherita', 'Pizzas', 20000, 20),
('Pizza Pepperoni', 'Pizzas', 22000, 20);
