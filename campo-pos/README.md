# Birthday POS - Sistema de Punto de Venta Offline

Sistema POS completo desarrollado con Electron y React, diseñado para funcionar sin conexión a internet. Incluye gestión de pedidos, inventario, caja, reportes e impresión térmica.

## 🚀 Características

- **Completamente Offline**: Funciona sin conexión a internet
- **Gestión de Pedidos**: Sistema de comandero con pedido actual
- **Inventario**: CRUD completo de productos con categorías
- **Gestión de Caja**: Apertura/cierre con control de montos
- **Reportes**: Gráficos y estadísticas de ventas
- **Impresión Térmica**: Soporte para impresoras ESC/POS (58/80mm)
- **Backup**: Exportación e importación de datos
- **Multiplataforma**: Windows, macOS y Linux

## 🛠️ Tecnologías

- **Electron**: Contenedor de aplicación
- **React 18**: Interfaz de usuario
- **TypeScript**: Tipado estático
- **Vite**: Herramientas de desarrollo
- **Bootstrap 5**: Framework CSS
- **Zustand**: Gestión de estado
- **Chart.js**: Gráficos y reportes
- **better-sqlite3**: Base de datos local
- **ESC/POS**: Impresión térmica

## 📦 Instalación

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Impresora térmica (opcional)

### Pasos de instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd birthday-pos
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Ejecutar en modo desarrollo**
```bash
npm run dev
```

4. **Construir para producción**
```bash
npm run build
```

5. **Crear ejecutable**
```bash
npm run dist
```

## 🎯 Uso del Sistema

### Flujo Principal

1. **Abrir Caja**: Ir a Caja → Abrir Caja
2. **Tomar Pedidos**: Ir a Inicio → Agregar productos al pedido
3. **Imprimir Comanda**: Enviar pedido a cocina
4. **Cobrar**: Procesar pago del cliente
5. **Cerrar Caja**: Al final del día

### Módulos Principales

#### 🏠 Inicio (Comandero)
- Grid de productos organizados por categoría
- Panel de pedido actual con totales
- Búsqueda y filtros de productos
- Impresión de comanda y cobro

#### 📦 Inventario
- CRUD completo de productos
- Gestión de categorías
- Control de stock
- Importación/exportación

#### 📋 Pedidos
- Historial de órdenes
- Filtros por fecha, estado, mesa
- Reimpresión de tickets
- Cambio de estado de órdenes

#### 💰 Caja
- Apertura/cierre de caja
- Control de montos iniciales y finales
- Resumen diario de ventas
- Impresión de cierre de caja

#### 📊 Reportes
- Gráficos de ventas por fecha
- Análisis por categorías
- Productos más vendidos
- Exportación de reportes

#### ⚙️ Configuración
- Datos de la empresa
- Configuración fiscal (IVA, moneda)
- Configuración de impresora
- Gestión de backups

## 🖨️ Configuración de Impresora

### Tipos Soportados
- **USB**: Impresoras conectadas por USB
- **Ethernet**: Impresoras de red

### Formatos
- **58mm**: Papel de 58mm de ancho
- **80mm**: Papel de 80mm de ancho

### Configuración
1. Ir a Configuración → Impresora
2. Seleccionar tipo de conexión
3. Configurar puerto/IP
4. Realizar test de impresión

## 💾 Backup y Restauración

### Exportar Backup
1. Ir a Configuración → Backup
2. Hacer clic en "Exportar"
3. Seleccionar ubicación del archivo
4. El backup incluye todos los datos

### Importar Backup
1. Ir a Configuración → Backup
2. Hacer clic en "Importar"
3. Seleccionar archivo de backup
4. Confirmar la importación

## 🗄️ Base de Datos

El sistema utiliza SQLite como base de datos local. Los archivos se almacenan en:
- `db/database.sqlite`: Base de datos principal
- `db/init.sql`: Script de inicialización

### Estructura de Tablas
- `productos`: Catálogo de productos
- `ordenes`: Órdenes de pedidos
- `orden_items`: Items de cada orden
- `pagos`: Pagos realizados
- `caja`: Registro de apertura/cierre de caja
- `settings`: Configuraciones del sistema

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Ejecutar en modo desarrollo
npm run dev:react        # Solo React (Vite)
npm run dev:electron     # Solo Electron

# Construcción
npm run build:react      # Construir React
npm run build           # Construir aplicación completa
npm run dist            # Crear ejecutables

# Producción
npm start               # Ejecutar aplicación construida
```

## 📁 Estructura del Proyecto

```
birthday-pos/
├── main.js                 # Proceso principal Electron
├── preload.js             # Exposición segura de IPC
├── package.json           # Configuración del proyecto
├── db/
│   ├── init.sql          # Script de inicialización
│   └── database.sqlite   # Base de datos (generada)
├── src/
│   ├── utils/            # Módulos Node.js
│   │   ├── db.js         # Gestión de base de datos
│   │   ├── printer.js    # Impresión térmica
│   │   ├── settings.js   # Configuraciones
│   │   └── backup.js     # Backup/restauración
│   └── renderer/         # Aplicación React
│       ├── components/   # Componentes reutilizables
│       ├── pages/        # Páginas principales
│       ├── store/        # Estado global (Zustand)
│       ├── lib/          # Utilidades y API
│       └── styles.css    # Estilos globales
└── build/                # Archivos construidos
```

## 🚨 Consideraciones Importantes

### Seguridad
- El sistema funciona completamente offline
- Los datos se almacenan localmente
- No se envían datos a servidores externos

### Rendimiento
- SQLite optimizado para operaciones locales
- Índices en tablas principales
- Transacciones para operaciones críticas

### Compatibilidad
- Windows 10+
- macOS 10.14+
- Linux (Ubuntu 18.04+)

## 🐛 Solución de Problemas

### Error de Base de Datos
```bash
# Eliminar base de datos corrupta
rm db/database.sqlite
# Reiniciar aplicación (se recreará automáticamente)
```

### Problemas de Impresora
1. Verificar conexión USB/Red
2. Revisar configuración en Configuración → Impresora
3. Realizar test de impresión
4. Verificar drivers de impresora

### Error de Dependencias
```bash
# Limpiar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crear una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abrir un Pull Request

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear un issue en el repositorio
- Revisar la documentación
- Verificar los logs de la aplicación

---

**Birthday POS** - Sistema de Punto de Venta Offline
Desarrollado con ❤️ para restaurantes y comercios
