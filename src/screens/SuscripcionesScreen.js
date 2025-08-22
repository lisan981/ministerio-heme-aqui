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

const SuscripcionesScreen = () => {
  const [loading, setLoading] = useState(false);
  const [suscripciones, setSuscripciones] = useState([]);
  const [efectivo, setEfectivo] = useState(0);
  
  // Estados del formulario
  const [showAddModal, setShowAddModal] = useState(false);
  const [fechaInscripcion, setFechaInscripcion] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    montoPagado: '',
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
      
      const [suscripcionesData, profile] = await Promise.all([
        StorageService.getSuscripciones(),
        StorageService.getProfile(),
      ]);

      setSuscripciones(suscripcionesData);
      
      if (profile) {
        setEfectivo(profile.efectivo || 0);
      }
    } catch (error) {
      console.error('Error loading subscriptions data:', error);
      Alert.alert('Error', 'Error al cargar los datos de suscripciones');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuscripcion = async () => {
    // Validaciones
    if (!formData.nombre.trim()) {
      Alert.alert('Error', 'El nombre completo es requerido');
      return;
    }
    
    const montoPagado = parseFloat(formData.montoPagado);
    
    if (!montoPagado || montoPagado <= 0) {
      Alert.alert('Error', 'El monto pagado debe ser un número mayor a 0');
      return;
    }
    
    if (!formData.codigo.trim()) {
      Alert.alert('Error', 'El código es requerido');
      return;
    }

    setLoading(true);
    
    try {
      const newSuscripcion = {
        nombre: formData.nombre.trim(),
        montoPagado,
        codigo: formData.codigo.trim(),
        fechaInscripcion: fechaInscripcion.toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
      };

      // Agregar suscripción
      await StorageService.addSuscripcion(newSuscripcion);

      // Actualizar efectivo
      const profile = await StorageService.getProfile();
      const nuevoEfectivo = efectivo + montoPagado;
      await StorageService.saveProfile({
        ...profile,
        efectivo: nuevoEfectivo
      });

      Alert.alert('Éxito', 'Suscripción registrada con éxito y efectivo actualizado');
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        montoPagado: '',
        codigo: '',
      });
      setFechaInscripcion(new Date());
      setShowAddModal(false);
      
      // Recargar datos
      loadData();
    } catch (error) {
      console.error('Error adding subscription:', error);
      Alert.alert('Error', 'Error al registrar la suscripción');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSuscripcion = async (suscripcion) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar la suscripción de ${suscripcion.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Eliminar suscripción
              await StorageService.deleteSuscripcion(suscripcion.id);
              
              // Revertir efectivo
              const profile = await StorageService.getProfile();
              await StorageService.saveProfile({
                ...profile,
                efectivo: efectivo - suscripcion.montoPagado
              });
              
              loadData();
              Alert.alert('Éxito', 'Suscripción eliminada y efectivo ajustado');
            } catch (error) {
              Alert.alert('Error', 'Error al eliminar la suscripción');
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

  const totalSuscripciones = suscripciones.reduce((sum, s) => sum + s.montoPagado, 0);
  const promedioSuscripcion = suscripciones.length > 0 ? totalSuscripciones / suscripciones.length : 0;

  const SuscripcionItem = ({ item }) => (
    <Card style={styles.suscripcionCard}>
      <Card.Content>
        <View style={styles.suscripcionHeader}>
          <View style={styles.suscripcionInfo}>
            <Text style={styles.suscripcionName}>{item.nombre}</Text>
            <Text style={styles.suscripcionAmount}>Bs {item.montoPagado.toFixed(2)}</Text>
          </View>
          <IconButton
            icon="delete"
            size={20}
            iconColor="#F44336"
            onPress={() => handleDeleteSuscripcion(item)}
          />
        </View>

        <View style={styles.suscripcionMeta}>
          <View style={styles.suscripcionMetaRow}>
            <Text style={styles.suscripcionCodigo}>Código: {item.codigo}</Text>
            <Text style={styles.suscripcionDate}>
              {new Date(item.fechaInscripcion).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Resumen de suscripciones */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Resumen de Suscripciones</Title>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total de suscritos:</Text>
              <Text style={styles.summaryValue}>{suscripciones.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ingresos por suscripciones:</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                Bs {totalSuscripciones.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Promedio por suscripción:</Text>
              <Text style={styles.summaryValue}>
                Bs {promedioSuscripcion.toFixed(2)}
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

        {/* Lista de suscripciones */}
        <View style={styles.suscripcionesSection}>
          {suscripciones.length > 0 ? (
            <FlatList
              data={suscripciones.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <SuscripcionItem item={item} />}
              scrollEnabled={false}
            />
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <View style={styles.emptyContent}>
                  <Icon name="people" size={64} color="#ccc" />
                  <Text style={styles.emptyTitle}>No hay suscripciones registradas</Text>
                  <Text style={styles.emptySubtitle}>
                    Registra los pagos de suscripciones de los miembros
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Modal para agregar suscripción */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView>
            <Title style={styles.modalTitle}>Registrar Pago de Suscripción</Title>
            
            <TextInput
              label="Nombre Completo"
              value={formData.nombre}
              onChangeText={(text) => setFormData({...formData, nombre: text})}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Monto Pagado (Bs)"
              value={formData.montoPagado}
              onChangeText={(text) => setFormData({...formData, montoPagado: text})}
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
                label="Fecha de Inscripción"
                value={formatDate(fechaInscripcion)}
                editable={false}
                style={styles.input}
                mode="outlined"
                right={<TextInput.Icon icon="calendar" />}
              />
            </TouchableOpacity>

            {/* Preview del impacto */}
            {formData.montoPagado && (
              <View style={styles.impactPreview}>
                <Text style={styles.impactTitle}>Impacto en el efectivo:</Text>
                <View style={styles.impactRow}>
                  <Text style={styles.impactLabel}>Efectivo actual:</Text>
                  <Text style={styles.impactValue}>Bs {efectivo.toFixed(2)}</Text>
                </View>
                <View style={styles.impactRow}>
                  <Text style={styles.impactLabel}>Después del pago:</Text>
                  <Text style={[styles.impactValue, { color: '#4CAF50' }]}>
                    Bs {(efectivo + parseFloat(formData.montoPagado || 0)).toFixed(2)}
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
                onPress={handleAddSuscripcion}
                style={styles.saveButton}
                loading={loading}
                disabled={loading}
              >
                Registrar Pago
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* DatePicker */}
      <DatePicker
        modal
        open={showDatePicker}
        date={fechaInscripcion}
        mode="date"
        onConfirm={(date) => {
          setShowDatePicker(false);
          setFechaInscripcion(date);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* FAB para agregar suscripción */}
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
  suscripcionesSection: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  suscripcionCard: {
    marginBottom: 12,
    elevation: 2,
  },
  suscripcionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  suscripcionInfo: {
    flex: 1,
  },
  suscripcionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e3d31',
  },
  suscripcionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 2,
  },
  suscripcionMeta: {
    marginTop: 8,
  },
  suscripcionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suscripcionCodigo: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  suscripcionDate: {
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
    borderLeftColor: '#4CAF50',
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

export default SuscripcionesScreen;