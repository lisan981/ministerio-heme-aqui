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
  Chip,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StorageService from '../services/StorageService';

const MaterialesScreen = () => {
  const [loading, setLoading] = useState(false);
  const [materiales, setMateriales] = useState([]);
  const [efectivo, setEfectivo] = useState(0);
  
  // Estados del formulario
  const [showAddModal, setShowAddModal] = useState(false);
  const [fecha, setFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    cantidad: '',
    costo: '',
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
      
      const [materialesData, profile] = await Promise.all([
        StorageService.getMateriales(),
        StorageService.getProfile(),
      ]);

      setMateriales(materialesData);
      
      if (profile) {
        setEfectivo(profile.efectivo || 0);
      }
    } catch (error) {
      console.error('Error loading materials data:', error);
      Alert.alert('Error', 'Error al cargar los datos de materiales');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async () => {
    // Validaciones
    if (!formData.nombre.trim()) {
      Alert.alert('Error', 'El nombre del material es requerido');
      return;
    }
    
    const cantidad = parseInt(formData.cantidad, 10);
    const costo = parseFloat(formData.costo);
    
    if (!cantidad || cantidad <= 0) {
      Alert.alert('Error', 'La cantidad debe ser un número mayor a 0');
      return;
    }
    
    if (!costo || costo < 0) {
      Alert.alert('Error', 'El costo debe ser un número mayor o igual a 0');
      return;
    }
    
    if (!formData.codigo.trim()) {
      Alert.alert('Error', 'El código del material es requerido');
      return;
    }

    setLoading(true);
    
    try {
      const purchaseCost = cantidad * costo;
      
      // Verificar si hay suficiente efectivo
      if (efectivo < purchaseCost) {
        Alert.alert(
          'Advertencia', 
          `El costo total (Bs ${purchaseCost.toFixed(2)}) es mayor al efectivo disponible (Bs ${efectivo.toFixed(2)}). ¿Desea continuar?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Continuar', onPress: () => processMaterial(purchaseCost) }
          ]
        );
        return;
      }
      
      await processMaterial(purchaseCost);
    } catch (error) {
      console.error('Error adding material:', error);
      Alert.alert('Error', 'Error al agregar el material');
    } finally {
      setLoading(false);
    }
  };

  const processMaterial = async (purchaseCost) => {
    try {
      const newMaterial = {
        nombre: formData.nombre.trim(),
        cantidad: parseInt(formData.cantidad, 10),
        costo: parseFloat(formData.costo),
        codigo: formData.codigo.trim(),
        timestamp: fecha.toISOString(),
      };

      // Agregar material
      await StorageService.addMaterial(newMaterial);

      // Actualizar efectivo
      const profile = await StorageService.getProfile();
      const nuevoEfectivo = efectivo - purchaseCost;
      await StorageService.saveProfile({
        ...profile,
        efectivo: nuevoEfectivo
      });

      // Registrar gasto
      await StorageService.addGasto({
        concepto: `Compra de materiales: ${newMaterial.nombre}`,
        monto: purchaseCost,
        timestamp: fecha.toISOString(),
        codigo: newMaterial.codigo
      });

      Alert.alert('Éxito', 'Material agregado con éxito y efectivo actualizado');
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        cantidad: '',
        costo: '',
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

  const handleDeleteMaterial = async (material) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar ${material.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await StorageService.deleteMaterial(material.id);
              loadData();
              Alert.alert('Éxito', 'Material eliminado');
            } catch (error) {
              Alert.alert('Error', 'Error al eliminar el material');
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

  const MaterialItem = ({ item }) => (
    <View style={styles.materialItem}>
      <View style={styles.materialItemContent}>
        <Text style={styles.materialItemName}>{item.nombre}</Text>
        <View style={styles.materialItemDetails}>
          <Chip size="small" style={styles.materialChip}>
            Cant: {item.cantidad}
          </Chip>
          <Chip size="small" style={styles.materialChip}>
            Costo: Bs {item.costo.toFixed(2)}
          </Chip>
          <Chip size="small" style={styles.materialChip}>
            Total: Bs {(item.cantidad * item.costo).toFixed(2)}
          </Chip>
        </View>
        <View style={styles.materialItemMeta}>
          <Text style={styles.materialItemCode}>Código: {item.codigo || 'N/A'}</Text>
          <Text style={styles.materialItemDate}>
            {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
      </View>
      <IconButton
        icon="delete"
        size={20}
        iconColor="#F44336"
        onPress={() => handleDeleteMaterial(item)}
      />
    </View>
  );

  const valorTotalMateriales = materiales.reduce((sum, m) => sum + (m.cantidad * m.costo), 0);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Resumen de materiales */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Resumen de Materiales</Title>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total de materiales:</Text>
              <Text style={styles.summaryValue}>{materiales.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Valor total del inventario:</Text>
              <Text style={styles.summaryValue}>
                Bs {valorTotalMateriales.toFixed(2)}
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

        {/* Lista de materiales */}
        <Card style={styles.materialsCard}>
          <Card.Content>
            <Title>Inventario de Materiales</Title>
            {materiales.length > 0 ? (
              <FlatList
                data={materiales}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <MaterialItem item={item} />}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.emptyText}>No hay materiales en el inventario</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Modal para agregar material */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView>
            <Title style={styles.modalTitle}>Agregar Material</Title>
            
            <TextInput
              label="Nombre del Material"
              value={formData.nombre}
              onChangeText={(text) => setFormData({...formData, nombre: text})}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Cantidad"
              value={formData.cantidad}
              onChangeText={(text) => setFormData({...formData, cantidad: text})}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <TextInput
              label="Costo Unitario (Bs)"
              value={formData.costo}
              onChangeText={(text) => setFormData({...formData, costo: text})}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <TextInput
              label="Código"
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

            {/* Cálculo del costo total */}
            {formData.cantidad && formData.costo && (
              <View style={styles.costPreview}>
                <Text style={styles.costPreviewLabel}>Costo total:</Text>
                <Text style={styles.costPreviewValue}>
                  Bs {((parseInt(formData.cantidad, 10) || 0) * (parseFloat(formData.costo) || 0)).toFixed(2)}
                </Text>
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
                onPress={handleAddMaterial}
                style={styles.saveButton}
                loading={loading}
                disabled={loading}
              >
                Agregar Material
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

      {/* FAB para agregar material */}
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
  materialsCard: {
    margin: 16,
    marginTop: 0,
    elevation: 3,
    marginBottom: 80,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  materialItemContent: {
    flex: 1,
  },
  materialItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e3d31',
    marginBottom: 4,
  },
  materialItemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  materialChip: {
    marginRight: 4,
  },
  materialItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  materialItemCode: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  materialItemDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 20,
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
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
  },
  costPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6c9a75',
  },
  costPreviewLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e3d31',
  },
  costPreviewValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6c9a75',
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
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6c9a75',
  },
});

export default MaterialesScreen;