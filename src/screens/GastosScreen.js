import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  TextInput,
  Button,
  FAB,
  Portal,
  Modal,
  IconButton,
  Paragraph,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StorageService from '../services/StorageService';

const GastosScreen = () => {
  const [loading, setLoading] = useState(false);
  const [gastos, setGastos] = useState([]);
  const [efectivo, setEfectivo] = useState(0);
  
  // Estados del formulario
  const [showAddModal, setShowAddModal] = useState(false);
  const [fecha, setFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    concepto: '',
    monto: '',
    codigo: '',
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [gastosData, profile] = await Promise.all([
        StorageService.getGastos(),
        StorageService.getProfile(),
      ]);

      setGastos(gastosData);
      
      if (profile) {
        setEfectivo(profile.efectivo || 0);
      }
    } catch (error) {
      console.error('Error loading expenses data:', error);
      Alert.alert('Error', 'Error al cargar los datos de gastos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGasto = async () => {
    // Validaciones
    if (!formData.concepto.trim()) {
      Alert.alert('Error', 'El concepto del gasto es requerido');
      return;
    }
    
    const monto = parseFloat(formData.monto);
    
    if (!monto || monto <= 0) {
      Alert.alert('Error', 'El monto debe ser un número mayor a 0');
      return;
    }

    setLoading(true);
    
    try {
      // Verificar si hay suficiente efectivo
      if (efectivo < monto) {
        Alert.alert(
          'Advertencia', 
          `El gasto (Bs ${monto.toFixed(2)}) es mayor al efectivo disponible (Bs ${efectivo.toFixed(2)}). ¿Desea continuar?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Continuar', onPress: () => processGasto(monto) }
          ]
        );
        return;
      }
      
      await processGasto(monto);
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Error al registrar el gasto');
    } finally {
      setLoading(false);
    }
  };

  const processGasto = async (monto) => {
    try {
      const newGasto = {
        concepto: formData.concepto.trim(),
        monto,
        codigo: formData.codigo.trim() || undefined,
        timestamp: fecha.toISOString(),
      };

      // Agregar gasto
      await StorageService.addGasto(newGasto);

      // Actualizar efectivo
      const profile = await StorageService.getProfile();
      const nuevoEfectivo = efectivo - monto;
      await StorageService.saveProfile({
        ...profile,
        efectivo: nuevoEfectivo
      });

      Alert.alert('Éxito', 'Gasto registrado con éxito y efectivo actualizado');
      
      // Limpiar formulario
      setFormData({
        concepto: '',
        monto: '',
        codigo: '',
      });
      setFecha(new Date());
      setShowAddModal(false);
      
      // Recargar datos
      loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteGasto = async (gasto) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar el gasto "${gasto.concepto}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Eliminar gasto
              await StorageService.deleteGasto(gasto.id);
              
              // Restaurar efectivo
              const profile = await StorageService.getProfile();
              await StorageService.saveProfile({
                ...profile,
                efectivo: efectivo + gasto.monto
              });
              
              loadData();
              Alert.alert('Éxito', 'Gasto eliminado y efectivo restaurado');
            } catch (error) {
              Alert.alert('Error', 'Error al eliminar el gasto');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
  const gastoPromedio = gastos.length > 0 ? totalGastos / gastos.length : 0;

  const GastoItem = ({ item }) => (
    <Card style={styles.gastoCard}>
      <Card.Content>
        <View style={styles.gastoHeader}>
          <View style={styles.gastoInfo}>
            <Text style={styles.gastoConcepto}>{item.concepto}</Text>
            <Text style={styles.gastoAmount}>Bs {item.monto.toFixed(2)}</Text>
          </View>
          <IconButton
            icon="delete"
            size={20}
            iconColor="#F44336"
            onPress={() => handleDeleteGasto(item)}
          />
        </View>

        <View style={styles.gastoMeta}>
          {item.codigo && (
            <Text style={styles.gastoCodigo}>Código: {item.codigo}</Text>
          )}
          <Text style={styles.gastoDate}>
            {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Resumen de gastos */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Resumen de Gastos</Title>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total de gastos:</Text>
              <Text style={[styles.summaryValue, { color: '#F44336' }]}>
                Bs {totalGastos.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Número de gastos:</Text>
              <Text style={styles.summaryValue}>{gastos.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Gasto promedio:</Text>
              <Text style={styles.summaryValue}>
                Bs {gastoPromedio.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Efectivo disponible:</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                Bs {efectivo.toFixed(2)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Lista de gastos */}
        <View style={styles.gastosSection}>
          {gastos.length > 0 ? (
            <FlatList
              data={gastos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <GastoItem item={item} />}
              scrollEnabled={false}
            />
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <View style={styles.emptyContent}>
                  <Icon name="money-off" size={64} color="#ccc" />
                  <Text style={styles.emptyTitle}>No hay gastos registrados</Text>
                  <Text style={styles.emptySubtitle}>
                    Registra gastos operativos como alquiler, servicios, etc.
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Modal para agregar gasto */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView>
            <Title style={styles.modalTitle}>Registrar Gasto</Title>
            <Paragraph style={styles.modalDescription}>
              Para egresos operativos (ej. alquiler, servicios).
            </Paragraph>
            
            <TextInput
              label="Concepto del Gasto"
              value={formData.concepto}
              onChangeText={(text) => setFormData({...formData, concepto: text})}
              style={styles.input}
              mode="outlined"
              multiline
            />

            <TextInput
              label="Monto (Bs)"
              value={formData.monto}
              onChangeText={(text) => setFormData({...formData, monto: text})}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <TextInput
              label="Código (Opcional)"
              value={formData.codigo}
              onChangeText={(text) => setFormData({...formData, codigo: text})}
              style={styles.input}
              mode="outlined"
            />

            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <TextInput
                label="Fecha"
                value={formatDate(fecha)}
                editable={false}
                style={styles.input}
                mode="outlined"
                right={<TextInput.Icon icon="calendar" />}
              />
            </TouchableOpacity>

            {/* Preview del impacto */}
            {formData.monto && (
              <View style={styles.impactPreview}>
                <Text style={styles.impactTitle}>Impacto en el efectivo:</Text>
                <View style={styles.impactRow}>
                  <Text style={styles.impactLabel}>Efectivo actual:</Text>
                  <Text style={styles.impactValue}>Bs {efectivo.toFixed(2)}</Text>
                </View>
                <View style={styles.impactRow}>
                  <Text style={styles.impactLabel}>Después del gasto:</Text>
                  <Text style={[
                    styles.impactValue,
                    { color: (efectivo - parseFloat(formData.monto || 0)) >= 0 ? '#4CAF50' : '#F44336' }
                  ]}>
                    Bs {(efectivo - parseFloat(formData.monto || 0)).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={() => setShowAddModal(false)}
                style={styles.cancelButton}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleAddGasto}
                style={styles.saveButton}
                loading={loading}
                disabled={loading}
              >
                Registrar Gasto
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* DatePicker */}
      <DatePicker
        modal
        open={showDatePicker}
        date={fecha}
        mode="date"
        onConfirm={(date) => {
          setShowDatePicker(false);
          setFecha(date);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* FAB para agregar gasto */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setShowAddModal(true)}
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
  gastosSection: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  gastoCard: {
    marginBottom: 12,
    elevation: 2,
  },
  gastoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  gastoInfo: {
    flex: 1,
  },
  gastoConcepto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e3d31',
  },
  gastoAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
    marginTop: 2,
  },
  gastoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gastoCodigo: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  gastoDate: {
    fontSize: 12,
    color: '#999',
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
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '90%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
  },
  impactPreview: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  impactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e3d31',
    marginBottom: 12,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  impactLabel: {
    fontSize: 14,
    color: '#666',
  },
  impactValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e3d31',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#F44336',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#F44336',
  },
});

export default GastosScreen;