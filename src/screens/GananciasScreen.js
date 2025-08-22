import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  DataTable,
  Chip,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StorageService from '../services/StorageService';

const GananciasScreen = () => {
  const [loading, setLoading] = useState(false);
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [ventasData, productosData] = await Promise.all([
        StorageService.getVentas(),
        StorageService.getProductos(),
      ]);

      setVentas(ventasData);
      setProductos(productosData);
    } catch (error) {
      console.error('Error loading profits data:', error);
      Alert.alert('Error', 'Error al cargar los datos de ganancias');
    } finally {
      setLoading(false);
    }
  };

  const getGananciaPorVenta = (venta) => {
    let totalCosto = 0;
    if (Array.isArray(venta.productosVendidos)) {
      totalCosto = venta.productosVendidos.reduce((sum, p) => sum + (p.costo * p.cantidad), 0);
    }
    return venta.precioVentaTotal - totalCosto;
  };

  const getGananciaPorMes = () => {
    const gananciasMensuales = {};
    ventas.forEach(venta => {
      const date = new Date(venta.timestamp);
      const mesAnio = `${date.getMonth() + 1}/${date.getFullYear()}`;
      const ganancia = getGananciaPorVenta(venta);
      gananciasMensuales[mesAnio] = (gananciasMensuales[mesAnio] || 0) + ganancia;
    });
    return gananciasMensuales;
  };

  const gananciasMensuales = getGananciaPorMes();
  const gananciaTotal = Object.values(gananciasMensuales).reduce((sum, g) => sum + g, 0);
  const ventaConMayorGanancia = ventas.reduce((max, venta) => {
    const ganancia = getGananciaPorVenta(venta);
    return ganancia > getGananciaPorVenta(max) ? venta : max;
  }, ventas[0] || {});

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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Resumen de ganancias */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.headerTitle}>Reporte de Ganancias</Title>
            <Text style={styles.headerSubtitle}>
              Análisis detallado de la rentabilidad del negocio
            </Text>
          </Card.Content>
        </Card>

        {/* Métricas principales */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Ganancia Total"
            value={gananciaTotal}
            icon="trending-up"
            color="#4CAF50"
            subtitle="Todas las ventas"
          />
          <StatCard
            title="Promedio por Venta"
            value={ventas.length > 0 ? gananciaTotal / ventas.length : 0}
            icon="assessment"
            color="#2196F3"
            subtitle={`${ventas.length} ventas`}
          />
          <StatCard
            title="Mejor Venta"
            value={ventaConMayorGanancia ? getGananciaPorVenta(ventaConMayorGanancia) : 0}
            icon="star"
            color="#FF9800"
            subtitle="Mayor ganancia"
          />
        </View>

        {/* Ganancias por mes */}
        <Card style={styles.monthlyCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Ganancias por Mes</Title>
            {Object.keys(gananciasMensuales).length > 0 ? (
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Mes/Año</DataTable.Title>
                  <DataTable.Title numeric>Ganancia (Bs)</DataTable.Title>
                  <DataTable.Title>Código</DataTable.Title>
                </DataTable.Header>
                {Object.keys(gananciasMensuales)
                  .sort()
                  .map(mes => (
                    <DataTable.Row key={mes}>
                      <DataTable.Cell>{mes}</DataTable.Cell>
                      <DataTable.Cell numeric>
                        <Text style={[
                          styles.gananciaValue,
                          { color: gananciasMensuales[mes] >= 0 ? '#4CAF50' : '#F44336' }
                        ]}>
                          Bs {gananciasMensuales[mes].toFixed(2)}
                        </Text>
                      </DataTable.Cell>
                      <DataTable.Cell>104</DataTable.Cell>
                    </DataTable.Row>
                  ))}
              </DataTable>
            ) : (
              <Text style={styles.emptyText}>No hay datos de ganancias por mes</Text>
            )}
          </Card.Content>
        </Card>

        {/* Detalle de ganancias por venta */}
        <Card style={styles.detailCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Detalle por Venta</Title>
            {ventas.length > 0 ? (
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Fecha</DataTable.Title>
                  <DataTable.Title numeric>Venta (Bs)</DataTable.Title>
                  <DataTable.Title numeric>Ganancia (Bs)</DataTable.Title>
                  <DataTable.Title>Tipo</DataTable.Title>
                </DataTable.Header>
                {ventas
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .slice(0, 10)
                  .map(venta => {
                    const ganancia = getGananciaPorVenta(venta);
                    return (
                      <DataTable.Row key={venta.id}>
                        <DataTable.Cell>
                          {new Date(venta.timestamp).toLocaleDateString()}
                        </DataTable.Cell>
                        <DataTable.Cell numeric>
                          Bs {venta.precioVentaTotal.toFixed(2)}
                        </DataTable.Cell>
                        <DataTable.Cell numeric>
                          <Text style={[
                            styles.gananciaValue,
                            { color: ganancia >= 0 ? '#4CAF50' : '#F44336' }
                          ]}>
                            Bs {ganancia.toFixed(2)}
                          </Text>
                        </DataTable.Cell>
                        <DataTable.Cell>
                          <Chip
                            style={[
                              styles.tipoChip,
                              { backgroundColor: venta.tipo === 'Efectivo' ? '#E8F5E8' : '#FFF3E0' }
                            ]}
                            textStyle={{
                              color: venta.tipo === 'Efectivo' ? '#2E7D32' : '#E65100'
                            }}
                          >
                            {venta.tipo}
                          </Chip>
                        </DataTable.Cell>
                      </DataTable.Row>
                    );
                  })}
              </DataTable>
            ) : (
              <Text style={styles.emptyText}>No hay ventas registradas</Text>
            )}
            
            {ventas.length > 10 && (
              <Text style={styles.moreText}>
                ... y {ventas.length - 10} ventas más
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Análisis de productos más rentables */}
        <Card style={styles.analysisCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Productos Más Rentables</Title>
            {(() => {
              const productoProfits = {};
              ventas.forEach(venta => {
                if (Array.isArray(venta.productosVendidos)) {
                  venta.productosVendidos.forEach(prod => {
                    const ganancia = (prod.precioVenta - prod.costo) * prod.cantidad;
                    productoProfits[prod.nombre] = (productoProfits[prod.nombre] || 0) + ganancia;
                  });
                }
              });

              const sortedProducts = Object.entries(productoProfits)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5);

              return sortedProducts.length > 0 ? (
                <View style={styles.productsGrid}>
                  {sortedProducts.map(([producto, ganancia], index) => (
                    <View key={producto} style={styles.productProfitCard}>
                      <View style={styles.productRank}>
                        <Text style={styles.rankNumber}>{index + 1}</Text>
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{producto}</Text>
                        <Text style={[
                          styles.productProfit,
                          { color: ganancia >= 0 ? '#4CAF50' : '#F44336' }
                        ]}>
                          Bs {ganancia.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No hay datos suficientes para el análisis</Text>
              );
            })()}
          </Card.Content>
        </Card>
      </ScrollView>
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
  headerCard: {
    margin: 16,
    elevation: 4,
    backgroundColor: '#4CAF50',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#C8E6C9',
    marginTop: 4,
  },
  statsGrid: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    marginBottom: 12,
    elevation: 3,
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
    fontSize: 20,
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
  monthlyCard: {
    margin: 16,
    marginTop: 0,
    elevation: 3,
  },
  detailCard: {
    margin: 16,
    marginTop: 0,
    elevation: 3,
  },
  analysisCard: {
    margin: 16,
    marginTop: 0,
    elevation: 3,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2e3d31',
  },
  gananciaValue: {
    fontWeight: 'bold',
  },
  tipoChip: {
    paddingHorizontal: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  moreText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginTop: 12,
    fontSize: 12,
  },
  productsGrid: {
    gap: 8,
  },
  productProfitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  productRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6c9a75',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e3d31',
  },
  productProfit: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default GananciasScreen;