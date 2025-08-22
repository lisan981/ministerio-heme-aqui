import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  FAB,
  Chip,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StorageService from '../services/StorageService';

const DashboardScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados financieros
  const [efectivo, setEfectivo] = useState(0);
  const [capitalInicial, setCapitalInicial] = useState(0);
  const [valorInventario, setValorInventario] = useState(0);
  const [valorMateriales, setValorMateriales] = useState(0);
  const [totalPorCobrar, setTotalPorCobrar] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);
  const [totalVentasIngresos, setTotalVentasIngresos] = useState(0);

  // Estados de datos
  const [productos, setProductos] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [deudas, setDeudas] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [suscripciones, setSuscripciones] = useState([]);

  // Cargar datos cuando la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Cargar perfil
      const profile = await StorageService.getProfile();
      if (profile) {
        setEfectivo(profile.efectivo || 0);
        setCapitalInicial(profile.capitalInicial || 0);
      }

      // Cargar todos los datos
      const [
        productosData,
        materialesData,
        deudasData,
        ventasData,
        gastosData,
        suscripcionesData,
      ] = await Promise.all([
        StorageService.getProductos(),
        StorageService.getMateriales(),
        StorageService.getDeudas(),
        StorageService.getVentas(),
        StorageService.getGastos(),
        StorageService.getSuscripciones(),
      ]);

      setProductos(productosData);
      setMateriales(materialesData);
      setDeudas(deudasData);
      setVentas(ventasData);
      setGastos(gastosData);
      setSuscripciones(suscripcionesData);

      // Calcular valores
      calculateValues(productosData, materialesData, deudasData, ventasData, gastosData, suscripcionesData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const calculateValues = (productos, materiales, deudas, ventas, gastos, suscripciones) => {
    // Valor del inventario de productos
    const valorProductos = productos.reduce((sum, p) => sum + (p.cantidad * p.costo), 0);
    setValorInventario(valorProductos);

    // Valor del inventario de materiales
    const valorMats = materiales.reduce((sum, m) => sum + (m.cantidad * m.costo), 0);
    setValorMateriales(valorMats);

    // Total por cobrar (solo deudas de ventas)
    const totalCobrar = deudas.filter(d => d.esVenta).reduce((sum, d) => sum + d.monto, 0);
    setTotalPorCobrar(totalCobrar);

    // Total de gastos
    const totalGast = gastos.reduce((sum, g) => sum + g.monto, 0);
    setTotalGastos(totalGast);

    // Total de ingresos por ventas
    const totalIngresos = ventas.reduce((sum, v) => sum + (v.precioVentaTotal || 0), 0);
    setTotalVentasIngresos(totalIngresos);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, []);

  // Calcular métricas adicionales
  const totalActivos = efectivo + valorInventario + valorMateriales + totalPorCobrar;
  const totalSuscripciones = suscripciones.reduce((sum, s) => sum + s.montoPagado, 0);
  const gananciaTotal = totalVentasIngresos + totalSuscripciones - totalGastos;

  // Componente para tarjetas de estadísticas
  const StatCard = ({ title, value, icon, color = '#6c9a75', subtitle }) => (
    <Card style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <Card.Content style={styles.statCardContent}>
        <View style={styles.statCardHeader}>
          <Icon name={icon} size={24} color={color} />
          <View style={styles.statCardText}>
            <Text style={styles.statCardValue}>Bs {value.toFixed(2)}</Text>
            <Text style={styles.statCardTitle}>{title}</Text>
            {subtitle && <Text style={styles.statCardSubtitle}>{subtitle}</Text>}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  // Componente para resumen rápido
  const QuickSummary = () => (
    <Card style={styles.summaryCard}>
      <Card.Content>
        <Title style={styles.summaryTitle}>Resumen Rápido</Title>
        <View style={styles.summaryRow}>
          <Chip icon="inventory" style={styles.summaryChip}>
            {productos.length} Productos
          </Chip>
          <Chip icon="build" style={styles.summaryChip}>
            {materiales.length} Materiales
          </Chip>
        </View>
        <View style={styles.summaryRow}>
          <Chip icon="account-balance-wallet" style={styles.summaryChip}>
            {deudas.filter(d => d.esVenta).length} Deudas
          </Chip>
          <Chip icon="people" style={styles.summaryChip}>
            {suscripciones.length} Suscritos
          </Chip>
        </View>
        <View style={styles.summaryRow}>
          <Chip icon="trending-up" style={styles.summaryChip}>
            {ventas.length} Ventas
          </Chip>
          <Chip icon="money-off" style={styles.summaryChip}>
            {gastos.length} Gastos
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Tarjetas de estadísticas principales */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Efectivo"
            value={efectivo}
            icon="account-balance-wallet"
            color="#4CAF50"
          />
          <StatCard
            title="Activos Totales"
            value={totalActivos}
            icon="trending-up"
            color="#2196F3"
          />
          <StatCard
            title="Por Cobrar"
            value={totalPorCobrar}
            icon="schedule"
            color="#FF9800"
          />
          <StatCard
            title="Inventario"
            value={valorInventario + valorMateriales}
            icon="inventory"
            color="#9C27B0"
          />
        </View>

        {/* Resumen rápido */}
        <QuickSummary />

        {/* Métricas financieras detalladas */}
        <Card style={styles.detailCard}>
          <Card.Content>
            <Title style={styles.detailTitle}>Métricas Financieras</Title>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Capital Inicial:</Text>
              <Text style={styles.metricValue}>Bs {capitalInicial.toFixed(2)}</Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Ingresos por Ventas:</Text>
              <Text style={[styles.metricValue, { color: '#4CAF50' }]}>
                Bs {totalVentasIngresos.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Ingresos por Suscripciones:</Text>
              <Text style={[styles.metricValue, { color: '#4CAF50' }]}>
                Bs {totalSuscripciones.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Total Gastos:</Text>
              <Text style={[styles.metricValue, { color: '#F44336' }]}>
                Bs {totalGastos.toFixed(2)}
              </Text>
            </View>
            
            <View style={[styles.metricRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Ganancia Total:</Text>
              <Text style={[styles.totalValue, { color: gananciaTotal >= 0 ? '#4CAF50' : '#F44336' }]}>
                Bs {gananciaTotal.toFixed(2)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Espacio adicional para el FAB */}
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Botón flotante para acciones rápidas */}
      <FAB
        style={styles.fab}
        icon="add"
        onPress={() => {
          Alert.alert(
            'Acción Rápida',
            'Selecciona una acción:',
            [
              { text: 'Nueva Venta', onPress: () => navigation.navigate('Ventas') },
              { text: 'Agregar Producto', onPress: () => navigation.navigate('Inventario') },
              { text: 'Cancelar', style: 'cancel' },
            ]
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9f3',
  },
  scrollView: {
    flex: 1,
  },
  statsGrid: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    marginBottom: 12,
    elevation: 3,
    backgroundColor: '#ffffff',
  },
  statCardContent: {
    padding: 16,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCardText: {
    marginLeft: 16,
    flex: 1,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e3d31',
  },
  statCardTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statCardSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  summaryCard: {
    margin: 16,
    marginTop: 0,
    elevation: 3,
    backgroundColor: '#ffffff',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2e3d31',
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  summaryChip: {
    flex: 1,
  },
  detailCard: {
    margin: 16,
    marginTop: 0,
    elevation: 3,
    backgroundColor: '#ffffff',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2e3d31',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e3d31',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#6c9a75',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e3d31',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  bottomSpace: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6c9a75',
  },
});

export default DashboardScreen;