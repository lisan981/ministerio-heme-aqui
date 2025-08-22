# Pulpería Comunitaria - App Android

Una aplicación móvil para Android desarrollada en React Native para la gestión completa de una pulpería comunitaria. Esta app convierte la funcionalidad web original a una experiencia móvil nativa con almacenamiento local.

## 🎯 Características Principales

### 📱 **App Móvil Nativa**
- **Interfaz Optimizada**: Diseño adaptado específicamente para dispositivos Android
- **Navegación por Pestañas**: Acceso rápido a las funciones principales
- **Almacenamiento Local**: Todos los datos se guardan en el dispositivo usando AsyncStorage
- **Funciona Sin Internet**: Una vez instalada, funciona completamente offline

### 💼 **Gestión Completa de Negocio**
- **Dashboard Inteligente**: Resumen financiero y métricas en tiempo real
- **Inventario de Productos**: Control de stock, compras y precios
- **Gestión de Materiales**: Inventario de materiales y suministros
- **Sistema de Ventas**: Registro de ventas en efectivo y crédito
- **Control de Deudas**: Seguimiento de cuentas por cobrar
- **Gestión de Capital**: Registro de inyecciones de capital
- **Control de Gastos**: Seguimiento de egresos operativos
- **Suscripciones**: Manejo de pagos de suscriptores
- **Reportes**: Generación de reportes financieros detallados

### 🔒 **Seguridad y Licencias**
- **Sistema de Activación**: Código de activación para uso autorizado
- **Licencia de 90 días**: Sistema de reactivación automática
- **Datos Locales**: Información almacenada únicamente en el dispositivo

## 🚀 Instalación y Configuración

### Prerrequisitos

```bash
# Node.js (versión 16 o superior)
node --version

# React Native CLI
npm install -g @react-native-community/cli

# Android Studio con SDK de Android
# Java Development Kit (JDK) 11 o superior
```

### Configuración del Proyecto

1. **Clonar el repositorio**:
```bash
git clone <repository-url>
cd PulperiaComunitaria
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar Android**:
```bash
# Asegúrate de que Android Studio esté instalado
# Configura las variables de entorno ANDROID_HOME y PATH
# Conecta un dispositivo Android o inicia un emulador
```

4. **Ejecutar la aplicación**:
```bash
# Iniciar Metro bundler
npm start

# En otra terminal, ejecutar en Android
npm run android
```

### Construcción para Producción

```bash
# Generar APK de release
npm run build-android

# El APK se generará en: android/app/build/outputs/apk/release/
```

## 📱 Uso de la Aplicación

### Primera Configuración

1. **Activación Inicial**:
   - Al abrir la app por primera vez, se solicitará el código de activación
   - Introduce tu nombre y correo electrónico
   - Ingresa el código de activación: `120217`

2. **Navegación Principal**:
   - **Resumen**: Dashboard con métricas financieras
   - **Inventario**: Gestión de productos y stock
   - **Ventas**: Registro de transacciones
   - **Reportes**: Informes financieros detallados
   - **Más**: Acceso a funciones adicionales

### Funciones Clave

#### 📊 **Dashboard**
- Visualización de efectivo disponible
- Total de activos y valores del inventario
- Resumen de deudas por cobrar
- Métricas de ganancias y gastos

#### 📦 **Inventario**
- Agregar productos con precios de costo y venta
- Control de stock en tiempo real
- Códigos de compra para organización
- Actualización automática del efectivo

#### 💰 **Ventas**
- Ventas en efectivo o crédito
- Selección múltiple de productos
- Cálculo automático de totales
- Registro automático de deudores

#### 📈 **Reportes**
- Reportes financieros completos
- Historial de ganancias por mes
- Detalle de inventarios y deudas
- Exportación e impresión de reportes

## 🛠️ Arquitectura Técnica

### Estructura del Proyecto

```
PulperiaComunitaria/
├── src/
│   ├── screens/           # Pantallas de la aplicación
│   │   ├── LoginScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── InventarioScreen.js
│   │   └── ...
│   └── services/
│       └── StorageService.js  # Servicio de almacenamiento local
├── App.js                 # Componente principal y navegación
├── package.json          # Dependencias y scripts
└── README.md            # Documentación
```

### Tecnologías Utilizadas

- **React Native 0.72.6**: Framework principal
- **React Navigation 6**: Navegación entre pantallas
- **React Native Paper 5**: Componentes UI Material Design
- **AsyncStorage**: Almacenamiento local persistente
- **React Native Vector Icons**: Iconografía
- **React Native Date Picker**: Selección de fechas

### Almacenamiento de Datos

Los datos se almacenan localmente usando AsyncStorage con la siguiente estructura:

```javascript
// Tipos de datos almacenados
- profile_data: Información del usuario y configuración
- productos: Inventario de productos
- materiales: Inventario de materiales
- deudas: Cuentas por cobrar
- ventas: Historial de ventas
- gastos: Registro de gastos
- capital_injections: Inyecciones de capital
- suscripciones: Pagos de suscriptores
- quarterly_reports: Reportes automáticos
```

## 🔧 Personalización

### Cambiar Colores del Tema

Edita el archivo `App.js`:

```javascript
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6c9a75',      // Color principal
    accent: '#6c9a75',       // Color de acento
    background: '#f7f9f3',   // Fondo de la app
    surface: '#ffffff',      // Fondo de tarjetas
    text: '#2e3d31',        // Color de texto
  },
};
```

### Agregar Nuevos Productos Base

Edita `src/services/StorageService.js`:

```javascript
async getProductosBase() {
  const productosBase = await this.getItem(this.keys.PRODUCTOS_BASE);
  return productosBase || [
    'Producto 1',
    'Producto 2',
    // Agregar más productos aquí
  ];
}
```

### Personalizar Código de Activación

Edita `src/screens/LoginScreen.js`:

```javascript
const activationCode = '120217'; // Cambiar por tu código
```

## 📊 Conversión de Web a Móvil

Esta aplicación es una conversión completa de la versión web original con las siguientes mejoras:

### ✅ **Cambios Realizados**

1. **Firebase → AsyncStorage**: 
   - Eliminación de dependencia de Firebase
   - Almacenamiento 100% local en el dispositivo

2. **HTML/CSS → React Native**:
   - Componentes web convertidos a componentes nativos
   - Estilos CSS convertidos a StyleSheet de React Native

3. **Navegación Web → React Navigation**:
   - Navegación por pestañas optimizada para móvil
   - Stack navigation para pantallas secundarias

4. **UI/UX Móvil**:
   - Interfaz adaptada para pantallas táctiles
   - Componentes Material Design con React Native Paper
   - Navegación optimizada para una mano

5. **Funcionalidad Offline**:
   - Todos los datos se almacenan localmente
   - No requiere conexión a internet para funcionar

### 🆕 **Mejoras Añadidas**

- **Pull-to-refresh** en todas las pantallas
- **FAB (Floating Action Button)** para acciones rápidas
- **Modales** para formularios complejos
- **Date Picker nativo** para selección de fechas
- **Alertas nativas** para confirmaciones
- **Navegación por pestañas** más intuitiva

## 🔄 Migración de Datos

Si tienes datos de la versión web y quieres migrarlos a la app móvil:

1. Exporta los datos desde Firebase (versión web)
2. Usa el método `importData()` del `StorageService`
3. Los datos se convertirán automáticamente al formato local

```javascript
// Ejemplo de migración
import StorageService from './src/services/StorageService';

const migrateFromWeb = async (webData) => {
  await StorageService.importData(webData);
  console.log('Datos migrados exitosamente');
};
```

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Error de Metro bundler**:
```bash
npx react-native start --reset-cache
```

2. **Error de Android build**:
```bash
cd android
./gradlew clean
cd ..
npm run android
```

3. **Problemas de permisos**:
```bash
chmod +x android/gradlew
```

### Logs de Debug

```bash
# Ver logs de Android
npx react-native log-android

# Debug en Chrome
# Shake del dispositivo > "Debug" > Abre Chrome DevTools
```

## 📞 Soporte

Para soporte técnico o consultas sobre la aplicación:

- **Desarrollado por**: Ministerio Heme Aquí
- **Versión**: 1.0.0
- **Licencia**: MIT

## 🚀 Próximas Funcionalidades

- [ ] Backup y restauración de datos
- [ ] Exportación de reportes a PDF
- [ ] Notificaciones push para recordatorios
- [ ] Modo oscuro
- [ ] Múltiples monedas
- [ ] Sincronización en la nube (opcional)

---

**¡Gracias por usar la Pulpería Comunitaria App!** 🎉

Esta aplicación ha sido desarrollada específicamente para facilitar la gestión de pulperías comunitarias, manteniendo todos los datos seguros en el dispositivo local.