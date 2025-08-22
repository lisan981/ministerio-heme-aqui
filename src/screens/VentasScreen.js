import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  TextInput,
  Button,
  RadioButton,
  Chip,
  Portal,
  Modal,
  IconButton,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StorageService from '../services/StorageService';

const VentasScreen = () => {
  const [loading, setLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const [productosBase, setProductosBase] = useState([]);
  const [suscritosNombres, setSuscritosNombres] = useState([]);
  const [efectivo, setEfectivo] = useState(0);
  
  // Estados del formulario
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [fechaVenta, setFechaVenta] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tipoVenta, setTipoVenta] = useState('efectivo');
  const [deudor, setDeudor] = useState('');
  const [ventaItems, setVentaItems] = useState([
    { producto: '', cantidad: '1', precioVenta: '0' }
  ]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [productosData, productosBaseData, suscripcionesData, profile] = await Promise.all([
        StorageService.getProductos(),
        StorageService.getProductosBase(),
        StorageService.getSuscripciones(),
        StorageService.getProfile(),
      ]);

      setProductos(productosData);
      setProductosBase(productosBaseData);
      setSuscritosNombres([...new Set(suscripcionesData.map(s => s.nombre))]);
      
      if (profile) {
        setEfectivo(profile.efectivo || 0);
      }
    } catch (error) {
      console.error('Error loading sales data:', error);
      Alert.alert('Error', 'Error al cargar los datos de ventas');
    } finally {
      setLoading(false);
    }
  };

  const addVentaItem = () => {
    setVentaItems([...ventaItems, { producto: '', cantidad: '1', precioVenta: '0' }]);
  };

  const removeVentaItem = (index) => {
    if (ventaItems.length > 1) {
      setVentaItems(ventaItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...ventaItems];
    newItems[index][field] = value;
    
    if (field === 'producto') {
      const product = productos.find(p => p.nombre === value);
      if (product) {
        newItems[index].precioVenta = product.precioVenta.toString();
      } else {
        newItems[index].precioVenta = '0';
      }
    }
    
    setVentaItems(newItems);
  };

  const getTotalPrice = () => {
    return ventaItems.reduce((total, item) => {
      const cantidad = parseInt(item.cantidad, 10) || 0;
      const precio = parseFloat(item.precioVenta) || 0;
      return total + (precio * cantidad);
    }, 0);
  };

  const validateSale = () => {
    // Verificar que todos los items tengan producto seleccionado
    for (const item of ventaItems) {
      if (!item.producto || !item.cantidad || item.cantidad === '0') {
        Alert.alert('Error', 'Todos los productos deben tener nombre y cantidad válida');
        return false;
      }
      
      const cantidad = parseInt(item.cantidad, 10);
      const product = productos.find(p => p.nombre === item.producto);
      
      if (!product) {
        Alert.alert('Error', `Producto ${item.producto} no encontrado en inventario`);
        return false;
      }
      
      if (product.cantidad < cantidad) {
        Alert.alert('Error', `No hay suficiente stock para ${item.producto}. Disponible: ${product.cantidad}`);
        return false;
      }
    }
    
    if (tipoVenta === 'credito' && !deudor.trim()) {
      Alert.alert('Error', 'Debe especificar el deudor para ventas a crédito');
      return false;
    }
    
    return true;
  };

  const handleSellProduct = async () => {
    if (!validateSale()) return;
    
    setLoading(true);
    
    try {
      let totalVenta = 0;
      const productosVendidos = [];
      
      // Procesar cada item de venta
      for (const item of ventaItems) {
        const cantidad = parseInt(item.cantidad, 10);
        const precioVenta = parseFloat(item.precioVenta);
        const product = productos.find(p => p.nombre === item.producto);
        
        totalVenta += precioVenta * cantidad;
        productosVendidos.push({
          nombre: item.producto,
          cantidad,
          precioVenta,
          costo: product.costo
        });
        
        // Actualizar stock del producto
        const updatedProduct = {
          ...product,
          cantidad: product.cantidad - cantidad
        };
        await StorageService.updateProducto(product.id, updatedProduct);
      }
      
      const esCredito = tipoVenta === 'credito' && deudor.trim() !== '';
      
      // Registrar la venta
      await StorageService.addVenta({
        productosVendidos,
        precioVentaTotal: totalVenta,
        gananciaTotal: productosVendidos.reduce((sum, item) => 
          sum + (item.precioVenta - item.costo) * item.cantidad, 0
        ),
        timestamp: fechaVenta.toISOString(),
        codigo: '104 Ingresos por amortizaciones',
        tipo: esCredito ? 'Crédito' : 'Efectivo',
        deudor: esCredito ? deudor : null
      });
      
      if (!esCredito) {
        // Actualizar efectivo para venta en efectivo
        const profile = await StorageService.getProfile();
        await StorageService.saveProfile({
          ...profile,
          efectivo: efectivo + totalVenta
        });
      } else {
        // Crear deuda para venta a crédito
        await StorageService.addDeuda({
          deudor: deudor,
          monto: totalVenta,
          fechaVencimiento: '',
          esVenta: true,
          productosVendidos
        });
      }
      
      Alert.alert(
        'Éxito', 
        esCredito ? 'Venta registrada como deuda' : 'Venta registrada y efectivo actualizado'
      );
      
      // Limpiar formulario
      setVentaItems([{ producto: '', cantidad: '1', precioVenta: '0' }]);
      setDeudor('');
      setFechaVenta(new Date());
      setTipoVenta('efectivo');
      setShowSaleModal(false);
      
      // Recargar datos
      loadData();
    } catch (error) {
      console.error('Error recording sale:', error);
      Alert.alert('Error', 'Error al registrar la venta');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const VentaItem = ({ item, index }) => (
    <View style={styles.ventaItem}>
      <View style={styles.ventaItemHeader}>
        <Text style={styles.ventaItemTitle}>Producto {index + 1}</Text>
        {ventaItems.length > 1 && (
          <IconButton
            icon="close"
            size={20}
            iconColor="#F44336"
            onPress={() => removeVentaItem(index)}
          />
        )}
      </View>
      
      <View style={styles.ventaItemContent}>
        {/* Selector de producto */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Producto</Text>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerText}>
              {item.producto || 'Selecciona un producto'}
            </Text>
          </View>
          <ScrollView horizontal style={styles.productChips}>
            {productosBase.map((producto, i) => (
              <Chip
                key={i}
                style={[
                  styles.productChip,
                  item.producto === producto && styles.selectedChip
                ]}
                textStyle={item.producto === producto && styles.selectedChipText}
                onPress={() => handleItemChange(index, 'producto', producto)}
              >
                {producto}
              </Chip>
            ))}
          </ScrollView>
        </View>
        
        {/* Cantidad */}
        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Cantidad</Text>
            <TextInput
              value={item.cantidad}
              onChangeText={(text) => handleItemChange(index, 'cantidad', text)}
              keyboardType="numeric"
              mode="outlined"
              dense
            />
          </View>
          
          {/* Precio unitario */}
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Precio Unitario (Bs)</Text>
            <TextInput
              value={item.precioVenta}
              onChangeText={(text) => handleItemChange(index, 'precioVenta', text)}
              keyboardType="numeric"
              mode="outlined"
              dense
            />
          </View>
        </View>
        
        {/* Total del item */}
        <View style={styles.itemTotal}>
          <Text style={styles.itemTotalLabel}>Total del item:</Text>
          <Text style={styles.itemTotalValue}>
            Bs {((parseInt(item.cantidad, 10) || 0) * (parseFloat(item.precioVenta) || 0)).toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Resumen de ventas */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Resumen de Ventas</Title>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Efectivo disponible:</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                Bs {efectivo.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Productos disponibles:</Text>
              <Text style={styles.summaryValue}>{productos.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Clientes suscritos:</Text>
              <Text style={styles.summaryValue}>{suscritosNombres.length}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Productos con bajo stock */}
        {productos.filter(p => p.cantidad <= 5).length > 0 && (
          <Card style={styles.warningCard}>
            <Card.Content>
              <View style={styles.warningHeader}>
                <Icon name="warning" size={24} color="#FF9800" />
                <Title style={styles.warningTitle}>Productos con Bajo Stock</Title>
              </View>
              <ScrollView horizontal style={styles.warningChips}>
                {productos
                  .filter(p => p.cantidad <= 5)
                  .map((producto, index) => (
                    <Chip
                      key={index}
                      style={styles.warningChip}
                      textStyle={styles.warningChipText}
                    >
                      {producto.nombre} ({producto.cantidad})
                    </Chip>
                  ))}
              </ScrollView>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Modal de venta */}
      <Portal>
        <Modal
          visible={showSaleModal}
          onDismiss={() => setShowSaleModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView>
            <Title style={styles.modalTitle}>Registrar Nueva Venta</Title>
            
            {/* Fecha de venta */}
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <TextInput
                label="Fecha de la Venta"
                value={formatDate(fechaVenta)}
                editable={false}
                style={styles.input}
                mode="outlined"
                right={<TextInput.Icon icon="calendar" />}
              />
            </TouchableOpacity>

            {/* Items de venta */}
            {ventaItems.map((item, index) => (
              <VentaItem key={index} item={item} index={index} />
            ))}

            {/* Botón para agregar más productos */}
            <Button
              mode="outlined"
              onPress={addVentaItem}
              style={styles.addButton}
              icon="plus"
            >
              Agregar otro producto
            </Button>

            {/* Total de la venta */}
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total de la Venta:</Text>
              <Text style={styles.totalValue}>Bs {getTotalPrice().toFixed(2)}</Text>
            </View>

            {/* Tipo de venta */}
            <View style={styles.radioSection}>
              <Text style={styles.sectionTitle}>Tipo de Venta</Text>
              <RadioButton.Group
                onValueChange={value => setTipoVenta(value)}
                value={tipoVenta}
              >
                <View style={styles.radioItem}>
                  <RadioButton value="efectivo" />
                  <Text style={styles.radioLabel}>Efectivo</Text>
                </View>
                <View style={styles.radioItem}>
                  <RadioButton value="credito" />
                  <Text style={styles.radioLabel}>Crédito</Text>
                </View>
              </RadioButton.Group>
            </View>

            {/* Campo de deudor para crédito */}
            {tipoVenta === 'credito' && (
              <View style={styles.deudorSection}>
                <Text style={styles.inputLabel}>Deudor</Text>
                <TextInput
                  label="Nombre del deudor"
                  value={deudor}
                  onChangeText={setDeudor}
                  style={styles.input}
                  mode="outlined"
                />
                {suscritosNombres.length > 0 && (
                  <ScrollView horizontal style={styles.deudorChips}>
                    {suscritosNombres.map((nombre, index) => (
                      <Chip
                        key={index}
                        style={styles.deudorChip}
                        onPress={() => setDeudor(nombre)}
                      >
                        {nombre}
                      </Chip>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Botones de acción */}
            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={() => setShowSaleModal(false)}
                style={styles.cancelButton}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleSellProduct}
                style={styles.saveButton}
                loading={loading}
                disabled={loading || getTotalPrice() <= 0}
              >
                Registrar Venta
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* DatePicker */}
      <DatePicker
        modal
        open={showDatePicker}
        date={fechaVenta}
        mode="date"
        onConfirm={(date) => {
          setShowDatePicker(false);
          setFechaVenta(date);
        }}
        onCancel={() => setShowDatePicker(false)}
      />

      {/* FAB para nueva venta */}
      <Button
        mode="contained"
        onPress={() => setShowSaleModal(true)}
        style={styles.fab}
        contentStyle={styles.fabContent}
        icon="plus"
      >
        Nueva Venta
      </Button>
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
  warningCard: {
    margin: 16,
    marginTop: 0,
    elevation: 3,
    backgroundColor: '#FFF3E0',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  warningTitle: {
    marginLeft: 8,
    color: '#FF9800',
  },
  warningChips: {
    flexDirection: 'row',
  },
  warningChip: {
    marginRight: 8,
    backgroundColor: '#FFE0B2',
  },
  warningChipText: {
    color: '#E65100',
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
  ventaItem: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  ventaItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ventaItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e3d31',
  },
  ventaItemContent: {
    gap: 12,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2e3d31',
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  pickerText: {
    fontSize: 16,
    color: '#666',
  },
  productChips: {
    flexDirection: 'row',
  },
  productChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  selectedChip: {
    backgroundColor: '#6c9a75',
  },
  selectedChipText: {
    color: 'white',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  itemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  itemTotalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  itemTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6c9a75',
  },
  addButton: {
    marginVertical: 16,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e3d31',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6c9a75',
  },
  radioSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e3d31',
    marginBottom: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  radioLabel: {
    fontSize: 16,
    color: '#2e3d31',
    marginLeft: 8,
  },
  deudorSection: {
    marginVertical: 16,
  },
  deudorChips: {
    flexDirection: 'row',
    marginTop: 8,
  },
  deudorChip: {
    marginRight: 8,
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
    bottom: 16,
    right: 16,
    left: 16,
    backgroundColor: '#6c9a75',
  },
  fabContent: {
    paddingVertical: 8,
  },
});

export default VentasScreen;