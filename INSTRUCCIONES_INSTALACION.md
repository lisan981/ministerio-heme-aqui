# 📱 Instrucciones de Instalación - App Android

## Conversión Completa: Web → Android

Tu aplicación web React con Firebase ha sido **completamente convertida** a una **aplicación móvil nativa para Android** usando React Native con almacenamiento local.

## 🎯 ¿Qué se ha convertido?

### ✅ **Cambios Principales**

| **Antes (Web)** | **Ahora (Android)** |
|-----------------|---------------------|
| Firebase/Firestore | AsyncStorage (Local) |
| HTML/CSS/Tailwind | React Native Components |
| Navegación web | React Navigation (Tabs/Stack) |
| Formularios web | Modales nativos |
| Botones web | FABs y botones nativos |
| Dependiente de internet | 100% Offline |

### 📱 **Funcionalidades Convertidas**

- ✅ **Sistema de Activación** (Código: 120217)
- ✅ **Dashboard** con métricas financieras
- ✅ **Inventario** de productos con compras
- ✅ **Materiales** con gestión de stock
- ✅ **Ventas** (efectivo y crédito)
- ✅ **Deudas** con pagos parciales
- ✅ **Capital** con inyecciones
- ✅ **Gastos** operativos
- ✅ **Suscripciones** de miembros
- ✅ **Reportes** financieros completos
- ✅ **Ajustes** y configuración

## 🚀 Instalación Paso a Paso

### 1. **Prerrequisitos**

```bash
# Verificar Node.js (versión 16+)
node --version

# Instalar React Native CLI globalmente
npm install -g @react-native-community/cli

# Verificar instalación
npx react-native --version
```

### 2. **Configurar Android Studio**

1. **Descargar Android Studio**: https://developer.android.com/studio
2. **Instalar Android SDK** (API Level 33 o superior)
3. **Configurar variables de entorno**:

```bash
# En ~/.bashrc o ~/.zshrc (Linux/Mac)
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# En Windows (Variables de entorno del sistema)
ANDROID_HOME = C:\Users\TuUsuario\AppData\Local\Android\Sdk
```

### 3. **Instalar Dependencias**

```bash
# Navegar al directorio del proyecto
cd PulperiaComunitaria

# Instalar dependencias de Node.js
npm install

# Para iOS (opcional, si planeas compilar para iOS)
cd ios && pod install && cd ..
```

### 4. **Preparar Dispositivo Android**

**Opción A: Dispositivo Físico**
1. Activar **Opciones de desarrollador** en Android
2. Activar **Depuración USB**
3. Conectar dispositivo por USB
4. Verificar conexión: `adb devices`

**Opción B: Emulador**
1. Abrir Android Studio
2. Ir a **AVD Manager**
3. Crear un dispositivo virtual (API 33+)
4. Iniciar el emulador

### 5. **Ejecutar la Aplicación**

```bash
# Iniciar Metro bundler (en una terminal)
npm start

# En otra terminal, ejecutar en Android
npm run android

# O directamente
npx react-native run-android
```

## 📋 Comandos Útiles

### Desarrollo
```bash
# Limpiar caché de Metro
npm start -- --reset-cache

# Ver logs de Android
npx react-native log-android

# Limpiar build de Android
cd android && ./gradlew clean && cd ..
```

### Producción
```bash
# Generar APK de release
npm run build-android

# El APK estará en: android/app/build/outputs/apk/release/
```

### Debug
```bash
# Abrir DevTools (shake del dispositivo o Ctrl+M)
# Seleccionar "Debug" para abrir Chrome DevTools
```

## 🔧 Solución de Problemas

### **Error: "Command failed: gradlew.bat"**
```bash
# Dar permisos de ejecución (Linux/Mac)
chmod +x android/gradlew

# En Windows, usar:
cd android && gradlew.bat clean && cd ..
```

### **Error: "SDK location not found"**
1. Crear archivo `android/local.properties`:
```
sdk.dir=/path/to/Android/Sdk
```

### **Error: "Unable to load script"**
```bash
# Limpiar todo y reinstalar
rm -rf node_modules
npm install
npx react-native start --reset-cache
```

### **Error de Metro bundler**
```bash
# Matar procesos de Metro
npx react-native start --reset-cache
# O manualmente:
killall node
npm start
```

## 📊 Estructura de Datos Local

Los datos se almacenan en AsyncStorage con estas claves:

```javascript
// Datos almacenados localmente
{
  "profile_data": {           // Perfil del usuario
    "name": "Usuario",
    "email": "email@example.com",
    "configured": true,
    "activationDate": "2024-01-01",
    "capitalInicial": 1000,
    "efectivo": 500
  },
  "productos": [...],         // Inventario de productos
  "materiales": [...],        // Inventario de materiales
  "deudas": [...],           // Cuentas por cobrar
  "ventas": [...],           // Historial de ventas
  "gastos": [...],           // Registro de gastos
  "capital_injections": [...], // Inyecciones de capital
  "suscripciones": [...],    // Pagos de suscriptores
  "quarterly_reports": [...]  // Reportes automáticos
}
```

## 🔐 Seguridad y Privacidad

### ✅ **Ventajas del Almacenamiento Local**
- **100% Privado**: Los datos nunca salen del dispositivo
- **Sin Internet**: Funciona completamente offline
- **Sin Costos**: No hay gastos de Firebase/servidor
- **Control Total**: El usuario controla sus datos
- **Rápido**: Acceso instantáneo a los datos

### 🔒 **Características de Seguridad**
- **Código de Activación**: `120217`
- **Licencia de 90 días** con reactivación
- **Encriptación**: AsyncStorage encripta automáticamente
- **Backup Local**: Exportación de datos para respaldo

## 🎨 Personalización

### Cambiar Colores
Edita `App.js`:
```javascript
const theme = {
  colors: {
    primary: '#6c9a75',    // Verde principal
    accent: '#6c9a75',     // Color de acento
    background: '#f7f9f3', // Fondo
    surface: '#ffffff',    // Tarjetas
    text: '#2e3d31',      // Texto
  },
};
```

### Cambiar Código de Activación
Edita `src/screens/LoginScreen.js`:
```javascript
const activationCode = '120217'; // Tu código personalizado
```

### Agregar Productos Base
Edita `src/services/StorageService.js`:
```javascript
return productosBase || [
  'Tu Producto 1',
  'Tu Producto 2',
  // Agregar más productos...
];
```

## 📱 Funcionalidades Móviles Añadidas

### 🆕 **Mejoras Específicas para Móvil**
- **Pull-to-refresh** en todas las pantallas
- **FAB (Floating Action Button)** para acciones rápidas
- **Modales nativos** para formularios
- **Date Picker nativo** para fechas
- **Image Picker** para cambiar logo
- **Share API** para exportar datos
- **Alertas nativas** para confirmaciones
- **Navegación por pestañas** optimizada

### 📊 **Pantallas Principales**
1. **Login/Activación** - Configuración inicial
2. **Dashboard** - Resumen financiero
3. **Inventario** - Gestión de productos
4. **Ventas** - Registro de transacciones
5. **Reportes** - Informes completos
6. **Más** - Acceso a funciones adicionales

## 🎉 ¡Listo para Usar!

Tu aplicación está **completamente convertida** y lista para ser compilada como una app Android nativa. Todos los datos se guardan localmente en el dispositivo, manteniendo la funcionalidad completa de la versión web original.

### 🚀 **Para empezar:**
1. Instala las dependencias: `npm install`
2. Conecta tu dispositivo Android
3. Ejecuta: `npm run android`
4. ¡Disfruta tu app móvil! 📱

---

**¡Tu pulpería comunitaria ahora tiene su propia app Android!** 🎊