import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import {
  Card,
  Title,
  TextInput,
  Button,
  Chip,
  IconButton,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StorageService from '../services/StorageService';

const DeudasScreen = () => {
  const [loading, setLoading] = useState(false);
  const [deudas, setDeudas] = useState([]);
  const [efectivo, setEfectivo] = useState(0);
  const [paymentAmounts, setPaymentAmounts] = useState({});

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [deudasData, profile] = await Promise.all([
        StorageService.getDeudas(),
        StorageService.getProfile(),
      ]);

      setDeudas(deudasData);
      
      if (profile) {
        setEfectivo(profile.efectivo || 0);
      }
    } catch (error) {
      console.error('Error loading debts data:', error);
      Alert.alert('Error', 'Error al cargar los datos de deudas');
    } finally {
      setLoading(false);
    }
  };

  const handlePartialPayment = async (debtId, amount) => {
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'El monto debe ser mayor a 0');
      return;
    }

    setLoading(true);
    
    try {
      const debt = deudas.find(d => d.id === debtId);
      if (!debt) {
        Alert.alert('Error', 'Deuda no encontrada');
        return;
      }

      if (amount > debt.monto) {
        Alert.alert('Error', 'El monto a pagar no puede ser mayor a la deuda');
        return;
      }

      const newMonto = debt.monto - amount;
      const nuevoEfectivo = efectivo + amount;

      // Actualizar efectivo
      const profile = await StorageService.getProfile();
      await StorageService.saveProfile({
        ...profile,
        efectivo: nuevoEfectivo
      });

      if (newMonto <= 0) {
        // Eliminar deuda si está completamente pagada
        await StorageService.deleteDeuda(debtId);
        Alert.alert('Éxito', `Deuda de Bs ${debt.monto.toFixed(2)} pagada completamente`);
      } else {
        // Actualizar monto de la deuda
        await StorageService.updateDeuda(debtId, { monto: newMonto });
        Alert.alert('Éxito', `Se pagó Bs ${amount.toFixed(2)}. Restante: Bs ${newMonto.toFixed(2)}`);
      }

      // Limpiar input de pago
      setPaymentAmounts({ ...paymentAmounts, [debtId]: '' });
      
      // Recargar datos
      loadData();
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeuda = async (deuda) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar la deuda de ${deuda.deudor}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await StorageService.deleteDeuda(deuda.id);
              loadData();
              Alert.alert('Éxito', 'Deuda eliminada');
            } catch (error) {
              Alert.alert('Error', 'Error al eliminar la deuda');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const updatePaymentAmount = (debtId, amount) => {
    setPaymentAmounts({ ...paymentAmounts, [debtId]: amount });
  };

  const deudasVenta = deudas.filter(d => d.esVenta);
  const clientesDeuda = [...new Set(deudasVenta.map(d => d.deudor))].filter(d => d);
  const totalDeudas = deudasVenta.reduce((sum, d) => sum + d.monto, 0);

  const DeudaItem = ({ item }) => (
    <Card style={styles.deudaCard}>
      <Card.Content>
        <View style={styles.deudaHeader}>
          <View style={styles.deudaInfo}>
            <Text style={styles.deudorName}>{item.deudor}</Text>
            <Text style={styles.deudaAmount}>Bs {item.monto.toFixed(2)}</Text>
          </View>
          <IconButton
            icon="delete"
            size={20}
            iconColor="#F44336"
            onPress={() => handleDeleteDeuda(item)}
          />
        </View>

        {/* Productos vendidos */}
        {item.productosVendidos && Array.isArray(item.productosVendidos) && (
          <View style={styles.productosSection}>
            <Text style={styles.productosTitle}>Productos:</Text>
            <View style={styles.productosChips}>
              {item.productosVendidos.map((prod, index) => (
                <Chip key={index} style={styles.productoChip}>
                  {prod.nombre} ({prod.cantidad})
                </Chip>
              ))}
            </View>
          </View>
        )}

        {/* Formulario de pago */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentTitle}>Registrar Pago</Text>
          <View style={styles.paymentRow}>
            <TextInput
              label="Monto a pagar"
              value={paymentAmounts[item.id] || ''}
              onChangeText={(text) => updatePaymentAmount(item.id, text)}
              keyboardType="numeric"
              style={styles.paymentInput}
              mode="outlined"
              dense
            />
            <Button
              mode="contained"
              onPress={() => {
                const amount = parseFloat(paymentAmounts[item.id]);
                if (!isNaN(amount) && amount > 0) {
                  handlePartialPayment(item.id, amount);
                }
              }}
              style={styles.paymentButton}
              disabled={loading}
              compact
            >
              Pagar
            </Button>
          </View>
        </View>

        <Text style={styles.deudaDate}>
          Fecha: {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Resumen de deudas */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Resumen de Deudas</Title>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total de deudas:</Text>
              <Text style={styles.summaryValue}>{deudasVenta.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Monto total por cobrar:</Text>
              <Text style={[styles.summaryValue, { color: '#F44336' }]}>
                Bs {totalDeudas.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Clientes con deuda:</Text>
              <Text style={styles.summaryValue}>{clientesDeuda.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Efectivo disponible:</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                Bs {efectivo.toFixed(2)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Lista de clientes con deuda */}
        {clientesDeuda.length > 0 && (
          <Card style={styles.clientsCard}>
            <Card.Content>
              <Title>Clientes con Deuda</Title>
              <View style={styles.clientsChips}>
                {clientesDeuda.map(cliente => (
                  <Chip
                    key={cliente}
                    style={styles.clientChip}
                    textStyle={styles.clientChipText}
                  >
                    {cliente}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Lista de deudas */}
        <View style={styles.deudasSection}>
          {deudasVenta.length > 0 ? (
            <FlatList
              data={deudasVenta}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <DeudaItem item={item} />}
              scrollEnabled={false}
            />
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <View style={styles.emptyContent}>
                  <Icon name="account-balance-wallet" size={64} color="#ccc" />
                  <Text style={styles.emptyTitle}>No hay deudas registradas</Text>
                  <Text style={styles.emptySubtitle}>
                    Las deudas aparecerán aquí cuando realices ventas a crédito
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}
        </View>
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
  summaryCard: {
    margin: 16,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e3d31',
  },
  clientsCard: {
    margin: 16,
    marginTop: 0,
    elevation: 3,
  },
  clientsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  clientChip: {
    backgroundColor: '#E3F2FD',
    marginBottom: 4,
  },
  clientChipText: {
    color: '#1976D2',
  },
  deudasSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  deudaCard: {
    marginBottom: 12,
    elevation: 2,
  },
  deudaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deudaInfo: {
    flex: 1,
  },
  deudorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e3d31',
  },
  deudaAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
    marginTop: 2,
  },
  productosSection: {
    marginBottom: 12,
  },
  productosTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 6,
  },
  productosChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  productoChip: {
    backgroundColor: '#F3E5F5',
    marginBottom: 4,
  },
  paymentSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2e3d31',
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentInput: {
    flex: 1,
  },
  paymentButton: {
    backgroundColor: '#4CAF50',
  },
  deudaDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  emptyCard: {
    elevation: 3,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DeudasScreen;