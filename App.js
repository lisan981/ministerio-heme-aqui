import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { StatusBar } from 'react-native';

// Importar pantallas
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import InventarioScreen from './src/screens/InventarioScreen';
import MaterialesScreen from './src/screens/MaterialesScreen';
import DeudasScreen from './src/screens/DeudasScreen';
import CapitalScreen from './src/screens/CapitalScreen';
import VentasScreen from './src/screens/VentasScreen';
import GananciasScreen from './src/screens/GananciasScreen';
import GastosScreen from './src/screens/GastosScreen';
import SuscripcionesScreen from './src/screens/SuscripcionesScreen';
import ReportesScreen from './src/screens/ReportesScreen';
import AjustesScreen from './src/screens/AjustesScreen';

// Importar servicio de almacenamiento
import StorageService from './src/services/StorageService';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tema personalizado para React Native Paper
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6c9a75',
    accent: '#6c9a75',
    background: '#f7f9f3',
    surface: '#ffffff',
    text: '#2e3d31',
  },
};

// Navegador de pestañas principales
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Inventario':
              iconName = 'inventory';
              break;
            case 'Ventas':
              iconName = 'point-of-sale';
              break;
            case 'Reportes':
              iconName = 'assessment';
              break;
            case 'Más':
              iconName = 'more-horiz';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6c9a75',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e0e0e0',
          elevation: 8,
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: -2 },
        },
        headerStyle: {
          backgroundColor: '#6c9a75',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ title: 'Resumen' }}
      />
      <Tab.Screen 
        name="Inventario" 
        component={InventarioScreen}
        options={{ title: 'Inventario' }}
      />
      <Tab.Screen 
        name="Ventas" 
        component={VentasScreen}
        options={{ title: 'Ventas' }}
      />
      <Tab.Screen 
        name="Reportes" 
        component={ReportesScreen}
        options={{ title: 'Reportes' }}
      />
      <Tab.Screen 
        name="Más" 
        component={MoreTabNavigator}
        options={{ title: 'Más' }}
      />
    </Tab.Navigator>
  );
}

// Stack navigator para la pestaña "Más"
const MoreStack = createStackNavigator();

function MoreTabNavigator() {
  return (
    <MoreStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6c9a75',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <MoreStack.Screen 
        name="MoreOptions" 
        component={MoreOptionsScreen}
        options={{ title: 'Más Opciones' }}
      />
      <MoreStack.Screen 
        name="Materiales" 
        component={MaterialesScreen}
        options={{ title: 'Materiales' }}
      />
      <MoreStack.Screen 
        name="Deudas" 
        component={DeudasScreen}
        options={{ title: 'Deudas' }}
      />
      <MoreStack.Screen 
        name="Capital" 
        component={CapitalScreen}
        options={{ title: 'Capital' }}
      />
      <MoreStack.Screen 
        name="Ganancias" 
        component={GananciasScreen}
        options={{ title: 'Ganancias' }}
      />
      <MoreStack.Screen 
        name="Gastos" 
        component={GastosScreen}
        options={{ title: 'Gastos' }}
      />
      <MoreStack.Screen 
        name="Suscripciones" 
        component={SuscripcionesScreen}
        options={{ title: 'Suscripciones' }}
      />
      <MoreStack.Screen 
        name="Ajustes" 
        component={AjustesScreen}
        options={{ title: 'Ajustes' }}
      />
    </MoreStack.Navigator>
  );
}

// Pantalla de opciones adicionales
function MoreOptionsScreen({ navigation }) {
  const options = [
    { title: 'Materiales', icon: 'build', screen: 'Materiales' },
    { title: 'Deudas', icon: 'account-balance-wallet', screen: 'Deudas' },
    { title: 'Capital', icon: 'monetization-on', screen: 'Capital' },
    { title: 'Ganancias', icon: 'trending-up', screen: 'Ganancias' },
    { title: 'Gastos', icon: 'money-off', screen: 'Gastos' },
    { title: 'Suscripciones', icon: 'people', screen: 'Suscripciones' },
    { title: 'Ajustes', icon: 'settings', screen: 'Ajustes' },
  ];

  return (
    <View style={styles.moreOptionsContainer}>
      <ScrollView contentContainerStyle={styles.moreOptionsContent}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.moreOptionItem}
            onPress={() => navigation.navigate(option.screen)}
          >
            <Icon name={option.icon} size={24} color="#6c9a75" />
            <Text style={styles.moreOptionText}>{option.title}</Text>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// Stack principal de la aplicación
const AppStack = createStackNavigator();

function AppNavigator({ isAuthenticated }) {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <AppStack.Screen name="MainTabs" component={MainTabNavigator} />
      ) : (
        <AppStack.Screen name="Login" component={LoginScreen} />
      )}
    </AppStack.Navigator>
  );
}

// Componente principal de la aplicación
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const profile = await StorageService.getProfile();
      if (profile && profile.configured) {
        // Verificar si necesita reactivación (90 días)
        const activationDate = profile.activationDate ? new Date(profile.activationDate) : null;
        if (activationDate) {
          const expirationDate = new Date(activationDate);
          expirationDate.setDate(expirationDate.getDate() + 90);
          if (new Date() <= expirationDate) {
            setIsAuthenticated(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <PaperProvider theme={theme}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6c9a75" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar backgroundColor="#6c9a75" barStyle="light-content" />
      <NavigationContainer>
        <AppNavigator isAuthenticated={isAuthenticated} />
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f9f3',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2e3d31',
  },
  moreOptionsContainer: {
    flex: 1,
    backgroundColor: '#f7f9f3',
  },
  moreOptionsContent: {
    padding: 16,
  },
  moreOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  moreOptionText: {
    flex: 1,
    marginLeft: 16,
    fontSize: 16,
    color: '#2e3d31',
    fontWeight: '500',
  },
});

// Importar componentes de React Native necesarios
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';