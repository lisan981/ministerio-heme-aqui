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
  DataTable,
  Chip,
  FAB,
  Portal,
  Modal,
  IconButton,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StorageService from '../services/StorageService';

const InventarioScreen = () => {
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const [productosBase, setProductosBase] = useState([]);
  const [productosPreview, setProductosPreview] = useState([]);
  
  // Estados del formulario
  const [showAddModal, setShowAddModal] = useState(false);
  const [compraFecha, setCompraFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [compraCodigo, setCompraCodigo] = useState('');
  const [currentProduct, setCurrentProduct] = useState({
    nombre: '',
    cantidad: '',
    costo: '',
    precioVenta: '',
  });

  // Estados del perfil
  const [efectivo, setEfectivo] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar productos y productos base
      const [productosData, productosBaseData, profile] = await Promise.all([
        StorageService.getProductos(),
        StorageService.getProductosBase(),
        StorageService.getProfile(),
      ]);

      setProductos(productosData);
      setProductosBase(productosBaseData);
      
      if (profile) {
        setEfectivo(profile.efectivo || 0);
      }
    } catch (error) {
      console.error('Error loading inventory data:', error);
      Alert.alert('Error', 'Error al cargar los datos del inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProductToPreview = () => {
    if (!currentProduct.nombre || !currentProduct.cantidad || !currentProduct.costo || !currentProduct.precioVenta) {
      Alert.alert('Error', 'Por favor, completa todos los campos');
      return;
    }

    const newProduct = {
      nombre: currentProduct.nombre.trim(),
      cantidad: parseInt(currentProduct.cantidad, 10),
      costo: parseFloat(currentProduct.costo),
      precioVenta: parseFloat(currentProduct.precioVenta),
    };

    if (newProduct.cantidad <= 0 || newProduct.costo < 0 || newProduct.precioVenta < 0) {
      Alert.alert('Error', 'Los valores deben ser positivos');
      return;
    }

    setProductosPreview(prev => [...prev, newProduct]);
    
    // Agregar a productos base si no existe
    if (!productosBase.includes(newProduct.nombre)) {
      const updatedProductosBase = [...productosBase, newProduct.nombre].sort();
      setProductosBase(updatedProductosBase);
      StorageService.saveProductosBase(updatedProductosBase);
    }

    // Limpiar formulario
    setCurrentProduct({ nombre: '', cantidad: '', costo: '', precioVenta: '' });
  };

  const handleRemoveFromPreview = (index) => {
    setProductosPreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinalizePurchase = async () => {
    if (productosPreview.length === 0) {
      Alert.alert('Error', 'No hay productos en la vista previa para guardar');
      return;
    }
    
    if (!compraCodigo.trim()) {
      Alert.alert('Error', 'Por favor, introduce un código de compra');
      return;
    }

    setLoading(true);
    let totalPurchaseCost = 0;

    try {
      for (const newProduct of productosPreview) {
        const { nombre, cantidad, costo, precioVenta } = newProduct;
        const purchaseCost = cantidad * costo;
        totalPurchaseCost += purchaseCost;

        // Buscar si el producto ya existe
        const existingProductIndex = productos.findIndex(p => p.nombre === nombre);

        if (existingProductIndex !== -1) {
          // Actualizar producto existente
          const existingProduct = productos[existingProductIndex];
          const updatedProduct = {
            ...existingProduct,
            cantidad: existingProduct.cantidad + cantidad,
            costo,
            precioVenta,
            timestamp: compraFecha.toISOString(),
            codigoCompra: compraCodigo,
          };
          
          await StorageService.updateProducto(existingProduct.id, updatedProduct);
        } else {
          // Agregar nuevo producto
          await StorageService.addProducto({
            nombre,
            cantidad,
            costo,
            precioVenta,
            timestamp: compraFecha.toISOString(),
            codigoCompra: compraCodigo,
          });
        }
      }

      // Actualizar efectivo
      const nuevoEfectivo = efectivo - totalPurchaseCost;
      const profile = await StorageService.getProfile();
      await StorageService.saveProfile({
        ...profile,
        efectivo: nuevoEfectivo,
      });

      // Registrar gasto
      await StorageService.addGasto({
        concepto: `Compra general de productos (Código: ${compraCodigo})`,
        monto: totalPurchaseCost,
        timestamp: compraFecha.toISOString(),
        codigo: compraCodigo,
      });

      Alert.alert('Éxito', 'Compra registrada con éxito y efectivo actualizado');
      
      // Limpiar formularios
      setProductosPreview([]);
      setCompraCodigo('');
      setCompraFecha(new Date());
      setShowAddModal(false);
      
      // Recargar datos
      loadData();
    } catch (error) {
      console.error('Error finalizing purchase:', error);
      Alert.alert('Error', 'Error al registrar la compra');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProducto = async (producto) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar ${producto.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteProducto(producto.id);
              loadData();
              Alert.alert('Éxito', 'Producto eliminado');
            } catch (error) {
              Alert.alert('Error', 'Error al eliminar el producto');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const ProductoPreviewItem = ({ item, index }) => (
    <View style={styles.previewItem}>
      <View style={styles.previewItemContent}>
        <Text style={styles.previewItemName}>{item.nombre}</Text>
        <Text style={styles.previewItemDetails}>
          Cantidad: {item.cantidad} | Costo: Bs {item.costo.toFixed(2)}
        </Text>
      </View>
      <IconButton
        icon="delete"
        size={20}
        iconColor="#F44336"
        onPress={() => handleRemoveFromPreview(index)}
      />
    </View>
  );

  const ProductoItem = ({ item }) => (
    <View style={styles.productItem}>
      <View style={styles.productItemContent}>
        <Text style={styles.productItemName}>{item.nombre}</Text>
        <View style={styles.productItemDetails}>
          <Chip size="small" style={styles.productChip}>
            Cant: {item.cantidad}
          </Chip>
          <Chip size="small" style={styles.productChip}>
            Costo: Bs {item.costo.toFixed(2)}
          </Chip>
          <Chip size="small" style={styles.productChip}>
            Venta: Bs {item.precioVenta.toFixed(2)}
          </Chip>
        </View>
        <Text style={styles.productItemDate}>
          {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'N/A'}
        </Text>
      </View>
      <IconButton
        icon="delete"
        size={20}
        iconColor="#F44336"
        onPress={() => handleDeleteProducto(item)}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Resumen del inventario */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Resumen del Inventario</Title>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total de productos:</Text>
              <Text style={styles.summaryValue}>{productos.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Valor total del inventario:</Text>
              <Text style={styles.summaryValue}>
                Bs {productos.reduce((sum, p) => sum + (p.cantidad * p.costo), 0).toFixed(2)}
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

        {/* Lista de productos */}
        <Card style={styles.inventoryCard}>
          <Card.Content>
            <Title>Inventario Actual</Title>
            {productos.length > 0 ? (
              <FlatList
                data={productos}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <ProductoItem item={item} />}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.emptyText}>No hay productos en el inventario</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Modal para agregar productos */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView>
            <Title style={styles.modalTitle}>Agregar Compra de Productos</Title>
            
            {/* Información de la compra */}
            <TextInput
              label="Código de Compra"
              value={compraCodigo}
              onChangeText={setCompraCodigo}
              style={styles.input}
              mode="outlined"
            />

            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <TextInput
                label="Fecha de Compra"
                value={formatDate(compraFecha)}
                editable={false}
                style={styles.input}
                mode="outlined"
                right={<TextInput.Icon icon="calendar" />}
              />
            </TouchableOpacity>

            {/* Formulario de producto */}
            <Title style={styles.sectionTitle}>Agregar Producto</Title>
            
            <TextInput
              label="Nombre del Producto"
              value={currentProduct.nombre}
              onChangeText={(text) => setCurrentProduct({...currentProduct, nombre: text})}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Cantidad"
              value={currentProduct.cantidad}
              onChangeText={(text) => setCurrentProduct({...currentProduct, cantidad: text})}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <TextInput
              label="Costo Unitario (Bs)"
              value={currentProduct.costo}
              onChangeText={(text) => setCurrentProduct({...currentProduct, costo: text})}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <TextInput
              label="Precio de Venta (Bs)"
              value={currentProduct.precioVenta}
              onChangeText={(text) => setCurrentProduct({...currentProduct, precioVenta: text})}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            <Button
              mode="contained"
              onPress={handleAddProductToPreview}
              style={styles.addButton}
            >
              Agregar a la Lista
            </Button>

            {/* Vista previa de productos */}
            {productosPreview.length > 0 && (
              <>
                <Title style={styles.sectionTitle}>Vista Previa de la Compra</Title>
                <FlatList
                  data={productosPreview}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item, index }) => 
                    <ProductoPreviewItem item={item} index={index} />
                  }
                  scrollEnabled={false}
                />

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total de la compra:</Text>
                  <Text style={styles.totalValue}>
                    Bs {productosPreview.reduce((sum, p) => sum + (p.cantidad * p.costo), 0).toFixed(2)}
                  </Text>
                </View>

                <Button
                  mode="contained"
                  onPress={handleFinalizePurchase}
                  style={styles.finalizeButton}
                  loading={loading}
                  disabled={loading}
                >
                  Guardar en Inventario
                </Button>
              </>
            )}

            <Button
              mode="outlined"
              onPress={() => setShowAddModal(false)}
              style={styles.cancelButton}
            >
              Cerrar
            </Button>
          </ScrollView>
        </Modal>
      </Portal>

      {/* DatePicker Modal */}
      <DatePicker
        modal
        open={showDatePicker}
        date={compraFecha}
        mode="date"
        onConfirm={(date) => {
          setShowDatePicker(false);
          setCompraFecha(date);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* FAB para agregar productos */}
      <FAB
        style={styles.fab}
        icon="add"
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
  inventoryCard: {
    margin: 16,
    marginTop: 0,
    elevation: 3,
    marginBottom: 80,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productItemContent: {
    flex: 1,
  },
  productItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e3d31',
    marginBottom: 4,
  },
  productItemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  productChip: {
    marginRight: 4,
  },
  productItemDate: {
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
  sectionTitle: {
    fontSize: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    marginBottom: 12,
  },
  addButton: {
    marginVertical: 16,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  previewItemContent: {
    flex: 1,
  },
  previewItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e3d31',
  },
  previewItemDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#6c9a75',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e3d31',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6c9a75',
  },
  finalizeButton: {
    marginVertical: 16,
  },
  cancelButton: {
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6c9a75',
  },
});

export default InventarioScreen;