# 🏪 Campo POS - Instalador v1.0.0

## 📋 **Instrucciones de Instalación**

### **Requisitos del Sistema:**
- ✅ **Windows 10** o superior (64-bit)
- ✅ **4GB RAM** mínimo (8GB recomendado)
- ✅ **100MB** espacio libre en disco
- ✅ **Conexión a internet** solo para la primera instalación

---

## 🚀 **Proceso de Instalación**

### **Paso 1: Preparar el Sistema**
1. **Cerrar** cualquier instancia de Campo POS que esté ejecutándose
2. Si no responde, abrir **Administrador de Tareas** (Ctrl+Shift+Esc)
3. Buscar "Campo POS" en la pestaña **Procesos**
4. **Finalizar** el proceso si existe

### **Paso 2: Instalar Campo POS**
1. **Extraer** el archivo ZIP:
   - Hacer clic derecho en el ZIP → "Extraer todo..."
   - O hacer clic en "Extraer todos" cuando aparezca la advertencia
   - Elegir una carpeta (recomendado: Escritorio)
2. **Buscar** el archivo `Campo POS Setup 1.0.0.exe` en la carpeta extraída
3. **Hacer clic derecho** en `Campo POS Setup 1.0.0.exe` → "Ejecutar como administrador"
3. **Seguir** el asistente de instalación:
   - Elegir directorio de instalación
   - Crear acceso directo en escritorio
   - Crear entrada en menú inicio
4. **Esperar** a que termine la instalación

### **Paso 3: Primera Configuración**
1. **Abrir** Campo POS desde el escritorio
2. **Configurar empresa** (nombre, dirección, teléfono, etc.)
3. **Establecer IVA** y moneda (por defecto: 0% IVA, ARS)
4. **Configurar impresora** térmica (USB, Ethernet o Bluetooth)
5. **Agregar productos** al inventario
6. **Abrir caja** para comenzar a usar

---

## ⚙️ **Configuración de Impresora**

### **Impresoras Compatibles:**
- ✅ **Epson TM-T20, TM-T82, TM-T88V**
- ✅ **Star TSP143, TSP650**
- ✅ **Bixolon SRP-350, SRP-330**
- ✅ **Citizen CT-S310**

### **Configuración Recomendada:**
- **Ancho:** 58mm (estándar)
- **Velocidad:** 9600 baud
- **Codificación:** UTF-8
- **Puerto Ethernet:** 9100

---

## 🗄️ **Base de Datos**

### **Ubicación:**
- **Windows:** `C:\Users\[Usuario]\AppData\Roaming\campo-pos\data.db`
- **Datos completamente aislados** por usuario
- **Respaldos automáticos** incluidos

### **Características:**
- ✅ **Base de datos real** (no datos de ejemplo)
- ✅ **Migraciones automáticas** al instalar
- ✅ **Datos persistentes** entre reinicios
- ✅ **Respaldos automáticos** diarios

---

## 🆘 **Solución de Problemas**

### **⚠️ Advertencia: "Esta aplicación puede depender de otros archivos comprimidos"**
**Solución:** 
- **NO ejecutar** el instalador directamente desde el ZIP
- **Siempre extraer** primero el archivo ZIP
- **Hacer clic en "Extraer todos"** cuando aparezca la advertencia
- **Ejecutar** el instalador desde la carpeta extraída

### **Error: "No se puede cerrar Campo POS"**
1. Abrir **Administrador de Tareas**
2. Buscar "Campo POS" en **Procesos**
3. **Finalizar** el proceso
4. **Reintentar** la instalación

### **Error: "Cannot find module"**
- **Reinstalar** Campo POS completamente
- **Eliminar** carpeta `%APPDATA%\campo-pos`
- **Ejecutar** instalador como administrador

### **Impresora no funciona:**
1. **Verificar** que el driver esté instalado
2. **Probar** con "Modo de Prueba" activado
3. **Revisar** configuración de puerto/IP
4. **Reiniciar** Campo POS

---

## 📞 **Soporte Técnico**

### **Información del Sistema:**
- **Versión:** Campo POS v1.0.0
- **Base de datos:** SQLite3
- **Framework:** Electron + React
- **Compatibilidad:** Windows 10+

### **Archivos de Log:**
- **Ubicación:** `%APPDATA%\campo-pos\logs\`
- **Útil para** diagnóstico de problemas

---

## ✅ **Verificación de Instalación**

### **Después de instalar, verificar:**
1. ✅ **Campo POS se abre** sin errores
2. ✅ **Base de datos se crea** automáticamente
3. ✅ **Configuración se guarda** correctamente
4. ✅ **Impresora responde** a pruebas
5. ✅ **Productos se pueden** agregar
6. ✅ **Caja se puede** abrir/cerrar

---

## 🎯 **Primeros Pasos**

1. **Configurar empresa** en Configuración → Empresa
2. **Establecer IVA** en Configuración → Fiscal
3. **Configurar impresora** en Configuración → Impresora
4. **Agregar productos** en Inventario
5. **Abrir caja** en Caja
6. **Comenzar a tomar** pedidos en Inicio

---

**¡Campo POS está listo para usar! 🎉**