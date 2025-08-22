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
  Paragraph,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StorageService from '../services/StorageService';

const CapitalScreen = () => {
  const [loading, setLoading] = useState(false);
  const [inyeccionesCapital, setInyeccionesCapital] = useState([]);
  const [efectivo, setEfectivo] = useState(0);
  const [capitalInicial, setCapitalInicial] = useState(0);
  
  // Estados del formulario
  const [showAddModal, setShowAddModal] = useState(false);
  const [fecha, setFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    monto: '',
    nombre: '',
    concepto: '',
    organizacion: '',
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
      
      const [capitalData, profile] = await Promise.all([
        StorageService.getCapital(),
        StorageService.getProfile(),
      ]);

      setInyeccionesCapital(capitalData);
      
      if (profile) {
        setEfectivo(profile.efectivo || 0);
        setCapitalInicial(profile.capitalInicial || 0);
      }
    } catch (error) {
      console.error('Error loading capital data:', error);
      Alert.alert('Error', 'Error al cargar los datos de capital');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCapital = async () => {
    // Validaciones
    const monto = parseFloat(formData.monto);
    
    if (!monto || monto <= 0) {
      Alert.alert('Error', 'El monto debe ser un número mayor a 0');
      return;
    }
    
    if (!formData.nombre.trim()) {
      Alert.alert('Error', 'El nombre es requerido');
      return;
    }
    
    if (!formData.concepto.trim()) {
      Alert.alert('Error', 'El concepto es requerido');
      return;
    }
    
    if (!formData.organizacion.trim()) {
      Alert.alert('Error', 'La organización es requerida');
      return;
    }
    
    if (!formData.codigo.trim()) {
      Alert.alert('Error', 'El código es requerido');
      return;
    }

    setLoading(true);
    
    try {
      const newCapitalItem = {
        monto,
        nombre: formData.nombre.trim(),
        concepto: formData.concepto.trim(),
        organizacion: formData.organizacion.trim(),
        codigo: formData.codigo.trim(),
        timestamp: fecha.toISOString(),
      };

      // Agregar inyección de capital
      await StorageService.addCapital(newCapitalItem);

      // Actualizar capital inicial y efectivo
      const profile = await StorageService.getProfile();
      const nuevoCapital = capitalInicial + monto;
      const nuevoEfectivo = efectivo + monto;
      
      await StorageService.saveProfile({
        ...profile,
        capitalInicial: nuevoCapital,
        efectivo: nuevoEfectivo
      });

      Alert.alert('Éxito', 'Inyección de capital registrada con éxito');
      
      // Limpiar formulario
      setFormData({
        monto: '',
        nombre: '',
        concepto: '',
        organizacion: '',
        codigo: '',
      });
      setFecha(new Date());
      setShowAddModal(false);
      
      // Recargar datos
      loadData();
    } catch (error) {
      console.error('Error adding capital:', error);
      Alert.alert('Error', 'Error al registrar la inyección de capital');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCapital = async (capitalItem) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar la inyección de capital de ${capitalItem.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Eliminar inyección de capital
              await StorageService.deleteCapital(capitalItem.id);
              
              // Actualizar capital inicial y efectivo
              const profile = await StorageService.getProfile();
              await StorageService.saveProfile({
                ...profile,
                capitalInicial: capitalInicial - capitalItem.monto,
                efectivo: efectivo - capitalItem.monto
              });
              
              loadData();
              Alert.alert('Éxito', 'Inyección de capital eliminada');
            } catch (error) {
              Alert.alert('Error', 'Error al eliminar la inyección de capital');
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

  const totalInyecciones = inyeccionesCapital.reduce((sum, c) => sum + c.monto, 0);

  const CapitalItem = ({ item }) => (
    <Card style={styles.capitalCard}>
      <Card.Content>
        <View style={styles.capitalHeader}>
          <View style={styles.capitalInfo}>
            <Text style={styles.capitalName}>{item.nombre}</Text>
            <Text style={styles.capitalAmount}>Bs {item.monto.toFixed(2)}</Text>
          </View>
          <IconButton
            icon="delete"
            size={20}
            iconColor="#F44336"
            onPress={() => handleDeleteCapital(item)}
          />
        </View>

        <View style={styles.capitalDetails}>
          <View style={styles.capitalDetailRow}>
            <Text style={styles.capitalDetailLabel}>Organización:</Text>
            <Text style={styles.capitalDetailValue}>{item.organizacion}</Text>
          </View>
          <View style={styles.capitalDetailRow}>
            <Text style={styles.capitalDetailLabel}>Concepto:</Text>
            <Text style={styles.capitalDetailValue}>{item.concepto}</Text>
          </View>
          <View style={styles.capitalDetailRow}>
            <Text style={styles.capitalDetailLabel}>Código:</Text>
            <Text style={styles.capitalDetailValue}>{item.codigo}</Text>
          </View>
        </View>

        <Text style={styles.capitalDate}>
          Fecha: {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Resumen de capital */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Resumen de Capital</Title>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Capital inicial actual:</Text>
              <Text style={[styles.summaryValue, { color: '#6c9a75' }]}>
                Bs {capitalInicial.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total inyecciones:</Text>
              <Text style={styles.summaryValue}>
                Bs {totalInyecciones.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Número de inyecciones:</Text>
              <Text style={styles.summaryValue}>{inyeccionesCapital.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Efectivo disponible:</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                Bs {efectivo.toFixed(2)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Lista de inyecciones de capital */}
        <View style={styles.capitalSection}>
          <Title style={styles.sectionTitle}>Historial de Inyecciones</Title>
          {inyeccionesCapital.length > 0 ? (
            <FlatList
              data={inyeccionesCapital}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <CapitalItem item={item} />}
              scrollEnabled={false}
            />
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <View style={styles.emptyContent}>
                  <Icon name="monetization-on" size={64} color="#ccc" />
                  <Text style={styles.emptyTitle}>No hay inyecciones de capital</Text>
                  <Text style={styles.emptySubtitle}>
                    Agrega capital inicial para comenzar a operar tu negocio
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Modal para agregar capital */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView>
            <Title style={styles.modalTitle}>Inyección de Capital</Title>
            <Paragraph style={styles.modalDescription}>
              Agrega capital inicial a tu negocio.
            </Paragraph>
            
            <TextInput
              label="Monto (Bs)"
              value={formData.monto}
              onChangeText={(text) => setFormData({...formData, monto: text})}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <TextInput
              label="Nombre"
              value={formData.nombre}
              onChangeText={(text) => setFormData({...formData, nombre: text})}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Concepto"
              value={formData.concepto}
              onChangeText={(text) => setFormData({...formData, concepto: text})}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Organización"
              value={formData.organizacion}
              onChangeText={(text) => setFormData({...formData, organizacion: text})}
              style={styles.input}
              mode="outlined"
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

            {/* Preview del impacto */}
            {formData.monto && (
              <View style={styles.impactPreview}>
                <Text style={styles.impactTitle}>Impacto en las finanzas:</Text>
                <View style={styles.impactRow}>
                  <Text style={styles.impactLabel}>Capital inicial actual:</Text>
                  <Text style={styles.impactValue}>Bs {capitalInicial.toFixed(2)}</Text>
                </View>
                <View style={styles.impactRow}>
                  <Text style={styles.impactLabel}>Nuevo capital inicial:</Text>
                  <Text style={[styles.impactValue, { color: '#4CAF50' }]}>
                    Bs {(capitalInicial + parseFloat(formData.monto || 0)).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.impactRow}>
                  <Text style={styles.impactLabel}>Efectivo actual:</Text>
                  <Text style={styles.impactValue}>Bs {efectivo.toFixed(2)}</Text>
                </View>
                <View style={styles.impactRow}>
                  <Text style={styles.impactLabel}>Nuevo efectivo:</Text>
                  <Text style={[styles.impactValue, { color: '#4CAF50' }]}>
                    Bs {(efectivo + parseFloat(formData.monto || 0)).toFixed(2)}
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
                onPress={handleAddCapital}
                style={styles.saveButton}
                loading={loading}
                disabled={loading}
              >
                Registrar Capital
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

      {/* FAB para agregar capital */}
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
  capitalSection: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e3d31',
    marginBottom: 16,
  },
  capitalCard: {
    marginBottom: 12,
    elevation: 2,
  },
  capitalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  capitalInfo: {
    flex: 1,
  },
  capitalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e3d31',
  },
  capitalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 2,
  },
  capitalDetails: {
    marginBottom: 12,
  },
  capitalDetailRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  capitalDetailLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  capitalDetailValue: {
    fontSize: 14,
    color: '#2e3d31',
    flex: 1,
  },
  capitalDate: {
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
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6c9a75',
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
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6c9a75',
  },
});

export default CapitalScreen;