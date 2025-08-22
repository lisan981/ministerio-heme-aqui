import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  DataTable,
  Chip,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StorageService from '../services/StorageService';

const ReportesScreen = () => {
  const [loading, setLoading] = useState(false);
  
  // Estados financieros
  const [capitalInicial, setCapitalInicial] = useState(0);
  const [efectivo, setEfectivo] = useState(0);
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
  const [inyeccionesCapital, setInyeccionesCapital] = useState([]);
  const [suscripciones, setSuscripciones] = useState([]);

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
        capitalData,
        suscripcionesData,
      ] = await Promise.all([
        StorageService.getProductos(),
        StorageService.getMateriales(),
        StorageService.getDeudas(),
        StorageService.getVentas(),
        StorageService.getGastos(),
        StorageService.getCapital(),
        StorageService.getSuscripciones(),
      ]);

      setProductos(productosData);
      setMateriales(materialesData);
      setDeudas(deudasData);
      setVentas(ventasData);
      setGastos(gastosData);
      setInyeccionesCapital(capitalData);
      setSuscripciones(suscripcionesData);

      // Calcular valores
      calculateValues(productosData, materialesData, deudasData, ventasData, gastosData);
    } catch (error) {
      console.error('Error loading report data:', error);
      Alert.alert('Error', 'Error al cargar los datos del reporte');
    } finally {
      setLoading(false);
    }
  };

  const calculateValues = (productos, materiales, deudas, ventas, gastos) => {
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

  const handleExportReport = async () => {
    try {
      const totalActivos = efectivo + valorInventario + valorMateriales + totalPorCobrar;
      const totalSuscripciones = suscripciones.reduce((sum, s) => sum + s.montoPagado, 0);
      const gananciaTotal = totalVentasIngresos + totalSuscripciones - totalGastos;
      const gananciasMensuales = getGananciaPorMes();

      const reportText = `
REPORTE FINANCIERO COMPLETO
Ministerio Heme Aquí - Pulpería Comunitaria Benigno
Fecha: ${new Date().toLocaleDateString()}

=== RESUMEN FINANCIERO ===
Capital Inicial: Bs ${capitalInicial.toFixed(2)}
Efectivo: Bs ${efectivo.toFixed(2)}
Valor Inventario Productos: Bs ${valorInventario.toFixed(2)}
Valor Inventario Materiales: Bs ${valorMateriales.toFixed(2)}
Total por Cobrar: Bs ${totalPorCobrar.toFixed(2)}
ACTIVOS TOTALES: Bs ${totalActivos.toFixed(2)}

=== GANANCIAS POR MES ===
${Object.keys(gananciasMensuales).map(mes => 
  `${mes}: Bs ${gananciasMensuales[mes].toFixed(2)}`
).join('\n')}

=== INVENTARIO ACTUAL ===
Productos (${productos.length}):
${productos.map(p => 
  `- ${p.nombre}: ${p.cantidad} unidades, Bs ${p.costo.toFixed(2)} c/u`
).join('\n')}

Materiales (${materiales.length}):
${materiales.map(m => 
  `- ${m.nombre}: ${m.cantidad} unidades, Bs ${m.costo.toFixed(2)} c/u`
).join('\n')}

=== DEUDAS POR COBRAR ===
${deudas.filter(d => d.esVenta).map(d => 
  `- ${d.deudor}: Bs ${d.monto.toFixed(2)}`
).join('\n')}

=== RESUMEN FINAL ===
Total Ingresos por Ventas: Bs ${totalVentasIngresos.toFixed(2)}
Total Ingresos por Suscripciones: Bs ${totalSuscripciones.toFixed(2)}
Total Gastos: Bs ${totalGastos.toFixed(2)}
GANANCIA TOTAL: Bs ${gananciaTotal.toFixed(2)}
      `;

      await Share.share({
        message: reportText,
        title: 'Reporte Financiero - Pulpería Comunitaria',
      });
    } catch (error) {
      Alert.alert('Error', 'Error al exportar el reporte');
    }
  };

  const handleSaveQuarterlyReport = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const reportYear = now.getFullYear();
      const reportQuarter = Math.floor(now.getMonth() / 3) + 1;
      const reportId = `${reportYear}-Q${reportQuarter}`;

      const reportData = {
        capitalInicial,
        efectivo,
        valorInventario,
        valorMateriales,
        totalPorCobrar,
        totalGastos,
        totalVentasIngresos,
        productos,
        materiales,
        deudas,
        ventas,
        gastos,
        inyeccionesCapital,
        suscripciones,
      };

      await StorageService.addReporte({
        id: reportId,
        ...reportData,
      });

      Alert.alert('Éxito', `Reporte trimestral ${reportId} guardado con éxito`);
    } catch (error) {
      Alert.alert('Error', 'Error al guardar el reporte trimestral');
    } finally {
      setLoading(false);
    }
  };

  // Calcular métricas adicionales
  const totalActivos = efectivo + valorInventario + valorMateriales + totalPorCobrar;
  const totalSuscripciones = suscripciones.reduce((sum, s) => sum + s.montoPagado, 0);
  const gananciaTotal = totalVentasIngresos + totalSuscripciones - totalGastos;
  const gananciasMensuales = getGananciaPorMes();

  const StatCard = ({ title, value, color = '#6c9a75', icon }) => (
    <Card style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <Card.Content style={styles.statCardContent}>
        <View style={styles.statCardHeader}>
          {icon && <Icon name={icon} size={24} color={color} />}
          <View style={styles.statCardText}>
            <Text style={styles.statCardValue}>Bs {value.toFixed(2)}</Text>
            <Text style={styles.statCardTitle}>{title}</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.headerTitle}>Reporte Financiero Completo</Title>
            <Text style={styles.headerSubtitle}>
              Generado el {new Date().toLocaleDateString()}
            </Text>
            
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={handleExportReport}
                style={styles.exportButton}
                icon="share"
              >
                Exportar
              </Button>
              <Button
                mode="outlined"
                onPress={handleSaveQuarterlyReport}
                style={styles.saveButton}
                loading={loading}
                icon="save"
              >
                Guardar Trimestral
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Resumen Financiero */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Resumen Financiero</Title>
            
            <View style={styles.statsGrid}>
              <StatCard
                title="Capital Inicial"
                value={capitalInicial}
                icon="account-balance"
                color="#2196F3"
              />
              <StatCard
                title="Efectivo"
                value={efectivo}
                icon="account-balance-wallet"
                color="#4CAF50"
              />
              <StatCard
                title="Inventario Productos"
                value={valorInventario}
                icon="inventory"
                color="#9C27B0"
              />
              <StatCard
                title="Inventario Materiales"
                value={valorMateriales}
                icon="build"
                color="#FF9800"
              />
              <StatCard
                title="Por Cobrar"
                value={totalPorCobrar}
                icon="schedule"
                color="#F44336"
              />
              <StatCard
                title="Activos Totales"
                value={totalActivos}
                icon="trending-up"
                color="#6c9a75"
              />
            </View>
          </Card.Content>
        </Card>

        {/* Ganancias por Mes */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Ganancias por Mes</Title>
            {Object.keys(gananciasMensuales).length > 0 ? (
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Mes/Año</DataTable.Title>
                  <DataTable.Title numeric>Ganancia (Bs)</DataTable.Title>
                  <DataTable.Title>Código</DataTable.Title>
                </DataTable.Header>
                {Object.keys(gananciasMensuales).map(mes => (
                  <DataTable.Row key={mes}>
                    <DataTable.Cell>{mes}</DataTable.Cell>
                    <DataTable.Cell numeric>
                      Bs {gananciasMensuales[mes].toFixed(2)}
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

        {/* Suscritos */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Suscritos ({suscripciones.length})</Title>
            {suscripciones.length > 0 ? (
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Nombre</DataTable.Title>
                  <DataTable.Title numeric>Monto (Bs)</DataTable.Title>
                  <DataTable.Title>Código</DataTable.Title>
                </DataTable.Header>
                {suscripciones.slice(0, 5).map(s => (
                  <DataTable.Row key={s.id}>
                    <DataTable.Cell>{s.nombre}</DataTable.Cell>
                    <DataTable.Cell numeric>Bs {s.montoPagado.toFixed(2)}</DataTable.Cell>
                    <DataTable.Cell>{s.codigo}</DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            ) : (
              <Text style={styles.emptyText}>No hay suscripciones registradas</Text>
            )}
            {suscripciones.length > 5 && (
              <Text style={styles.moreText}>
                ... y {suscripciones.length - 5} más
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Inventario Resumen */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Resumen de Inventarios</Title>
            
            <View style={styles.inventorySection}>
              <Text style={styles.inventoryTitle}>
                Productos ({productos.length} items)
              </Text>
              <View style={styles.chipContainer}>
                {productos.slice(0, 10).map((producto, index) => (
                  <Chip key={index} style={styles.inventoryChip}>
                    {producto.nombre} ({producto.cantidad})
                  </Chip>
                ))}
              </View>
              {productos.length > 10 && (
                <Text style={styles.moreText}>
                  ... y {productos.length - 10} productos más
                </Text>
              )}
            </View>

            <View style={styles.inventorySection}>
              <Text style={styles.inventoryTitle}>
                Materiales ({materiales.length} items)
              </Text>
              <View style={styles.chipContainer}>
                {materiales.slice(0, 10).map((material, index) => (
                  <Chip key={index} style={styles.inventoryChip}>
                    {material.nombre} ({material.cantidad})
                  </Chip>
                ))}
              </View>
              {materiales.length > 10 && (
                <Text style={styles.moreText}>
                  ... y {materiales.length - 10} materiales más
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Deudas por Cobrar */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>
              Deudas por Cobrar ({deudas.filter(d => d.esVenta).length})
            </Title>
            {deudas.filter(d => d.esVenta).length > 0 ? (
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Deudor</DataTable.Title>
                  <DataTable.Title numeric>Monto (Bs)</DataTable.Title>
                </DataTable.Header>
                {deudas.filter(d => d.esVenta).slice(0, 5).map(d => (
                  <DataTable.Row key={d.id}>
                    <DataTable.Cell>{d.deudor}</DataTable.Cell>
                    <DataTable.Cell numeric>Bs {d.monto.toFixed(2)}</DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            ) : (
              <Text style={styles.emptyText}>No hay deudas por cobrar</Text>
            )}
          </Card.Content>
        </Card>

        {/* Resumen Final */}
        <Card style={styles.finalCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Resumen Final</Title>
            
            <View style={styles.finalStats}>
              <View style={styles.finalStatRow}>
                <Text style={styles.finalStatLabel}>Ingresos por Ventas:</Text>
                <Text style={[styles.finalStatValue, { color: '#4CAF50' }]}>
                  Bs {totalVentasIngresos.toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.finalStatRow}>
                <Text style={styles.finalStatLabel}>Ingresos por Suscripciones:</Text>
                <Text style={[styles.finalStatValue, { color: '#4CAF50' }]}>
                  Bs {totalSuscripciones.toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.finalStatRow}>
                <Text style={styles.finalStatLabel}>Total Gastos:</Text>
                <Text style={[styles.finalStatValue, { color: '#F44336' }]}>
                  Bs {totalGastos.toFixed(2)}
                </Text>
              </View>
              
              <View style={[styles.finalStatRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>GANANCIA TOTAL:</Text>
                <Text style={[styles.totalValue, { 
                  color: gananciaTotal >= 0 ? '#4CAF50' : '#F44336' 
                }]}>
                  Bs {gananciaTotal.toFixed(2)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Espacio adicional */}
        <View style={styles.bottomSpace} />
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
    backgroundColor: '#6c9a75',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#e8f5e8',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  exportButton: {
    flex: 1,
    backgroundColor: 'white',
  },
  saveButton: {
    flex: 1,
    borderColor: 'white',
  },
  sectionCard: {
    margin: 16,
    marginTop: 0,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2e3d31',
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    marginBottom: 12,
    elevation: 2,
  },
  statCardContent: {
    padding: 12,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCardText: {
    marginLeft: 12,
    flex: 1,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e3d31',
  },
  statCardTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
    marginTop: 8,
    fontSize: 12,
  },
  inventorySection: {
    marginBottom: 20,
  },
  inventoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e3d31',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  inventoryChip: {
    marginBottom: 4,
  },
  finalCard: {
    margin: 16,
    marginTop: 0,
    elevation: 4,
    backgroundColor: '#e8f5e8',
  },
  finalStats: {
    gap: 12,
  },
  finalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#d0d0d0',
  },
  finalStatLabel: {
    fontSize: 14,
    color: '#2e3d31',
  },
  finalStatValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#6c9a75',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e3d31',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  bottomSpace: {
    height: 20,
  },
});

export default ReportesScreen;