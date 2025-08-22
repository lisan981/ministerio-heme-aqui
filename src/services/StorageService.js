import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  constructor() {
    this.keys = {
      PROFILE: 'profile_data',
      PRODUCTOS: 'productos',
      MATERIALES: 'materiales',
      DEUDAS: 'deudas',
      VENTAS: 'ventas',
      GASTOS: 'gastos',
      CAPITAL: 'capital_injections',
      SUSCRIPCIONES: 'suscripciones',
      REPORTES: 'quarterly_reports',
      PRODUCTOS_BASE: 'productos_base'
    };
  }

  // Métodos generales de almacenamiento
  async setItem(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      return false;
    }
  }

  async getItem(key) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  }

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      return false;
    }
  }

  // Métodos específicos para cada tipo de dato
  async saveProfile(profileData) {
    return await this.setItem(this.keys.PROFILE, profileData);
  }

  async getProfile() {
    return await this.getItem(this.keys.PROFILE);
  }

  async saveProductos(productos) {
    return await this.setItem(this.keys.PRODUCTOS, productos);
  }

  async getProductos() {
    const productos = await this.getItem(this.keys.PRODUCTOS);
    return productos || [];
  }

  async addProducto(producto) {
    const productos = await this.getProductos();
    const newProducto = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...producto
    };
    productos.push(newProducto);
    await this.saveProductos(productos);
    return newProducto;
  }

  async updateProducto(id, updates) {
    const productos = await this.getProductos();
    const index = productos.findIndex(p => p.id === id);
    if (index !== -1) {
      productos[index] = { ...productos[index], ...updates };
      await this.saveProductos(productos);
      return productos[index];
    }
    return null;
  }

  async deleteProducto(id) {
    const productos = await this.getProductos();
    const filteredProductos = productos.filter(p => p.id !== id);
    await this.saveProductos(filteredProductos);
    return true;
  }

  async saveMateriales(materiales) {
    return await this.setItem(this.keys.MATERIALES, materiales);
  }

  async getMateriales() {
    const materiales = await this.getItem(this.keys.MATERIALES);
    return materiales || [];
  }

  async addMaterial(material) {
    const materiales = await this.getMateriales();
    const newMaterial = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...material
    };
    materiales.push(newMaterial);
    await this.saveMateriales(materiales);
    return newMaterial;
  }

  async deleteMaterial(id) {
    const materiales = await this.getMateriales();
    const filteredMateriales = materiales.filter(m => m.id !== id);
    await this.saveMateriales(filteredMateriales);
    return true;
  }

  async saveDeudas(deudas) {
    return await this.setItem(this.keys.DEUDAS, deudas);
  }

  async getDeudas() {
    const deudas = await this.getItem(this.keys.DEUDAS);
    return deudas || [];
  }

  async addDeuda(deuda) {
    const deudas = await this.getDeudas();
    const newDeuda = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...deuda
    };
    deudas.push(newDeuda);
    await this.saveDeudas(deudas);
    return newDeuda;
  }

  async updateDeuda(id, updates) {
    const deudas = await this.getDeudas();
    const index = deudas.findIndex(d => d.id === id);
    if (index !== -1) {
      deudas[index] = { ...deudas[index], ...updates };
      await this.saveDeudas(deudas);
      return deudas[index];
    }
    return null;
  }

  async deleteDeuda(id) {
    const deudas = await this.getDeudas();
    const filteredDeudas = deudas.filter(d => d.id !== id);
    await this.saveDeudas(filteredDeudas);
    return true;
  }

  async saveVentas(ventas) {
    return await this.setItem(this.keys.VENTAS, ventas);
  }

  async getVentas() {
    const ventas = await this.getItem(this.keys.VENTAS);
    return ventas || [];
  }

  async addVenta(venta) {
    const ventas = await this.getVentas();
    const newVenta = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...venta
    };
    ventas.push(newVenta);
    await this.saveVentas(ventas);
    return newVenta;
  }

  async saveGastos(gastos) {
    return await this.setItem(this.keys.GASTOS, gastos);
  }

  async getGastos() {
    const gastos = await this.getItem(this.keys.GASTOS);
    return gastos || [];
  }

  async addGasto(gasto) {
    const gastos = await this.getGastos();
    const newGasto = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...gasto
    };
    gastos.push(newGasto);
    await this.saveGastos(gastos);
    return newGasto;
  }

  async deleteGasto(id) {
    const gastos = await this.getGastos();
    const filteredGastos = gastos.filter(g => g.id !== id);
    await this.saveGastos(filteredGastos);
    return true;
  }

  async saveCapital(capital) {
    return await this.setItem(this.keys.CAPITAL, capital);
  }

  async getCapital() {
    const capital = await this.getItem(this.keys.CAPITAL);
    return capital || [];
  }

  async addCapital(capitalItem) {
    const capital = await this.getCapital();
    const newCapitalItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...capitalItem
    };
    capital.push(newCapitalItem);
    await this.saveCapital(capital);
    return newCapitalItem;
  }

  async deleteCapital(id) {
    const capital = await this.getCapital();
    const filteredCapital = capital.filter(c => c.id !== id);
    await this.saveCapital(filteredCapital);
    return true;
  }

  async saveSuscripciones(suscripciones) {
    return await this.setItem(this.keys.SUSCRIPCIONES, suscripciones);
  }

  async getSuscripciones() {
    const suscripciones = await this.getItem(this.keys.SUSCRIPCIONES);
    return suscripciones || [];
  }

  async addSuscripcion(suscripcion) {
    const suscripciones = await this.getSuscripciones();
    const newSuscripcion = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...suscripcion
    };
    suscripciones.push(newSuscripcion);
    await this.saveSuscripciones(suscripciones);
    return newSuscripcion;
  }

  async deleteSuscripcion(id) {
    const suscripciones = await this.getSuscripciones();
    const filteredSuscripciones = suscripciones.filter(s => s.id !== id);
    await this.saveSuscripciones(filteredSuscripciones);
    return true;
  }

  async saveReportes(reportes) {
    return await this.setItem(this.keys.REPORTES, reportes);
  }

  async getReportes() {
    const reportes = await this.getItem(this.keys.REPORTES);
    return reportes || [];
  }

  async addReporte(reporte) {
    const reportes = await this.getReportes();
    const newReporte = {
      id: reporte.id || Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...reporte
    };
    reportes.push(newReporte);
    await this.saveReportes(reportes);
    return newReporte;
  }

  async saveProductosBase(productosBase) {
    return await this.setItem(this.keys.PRODUCTOS_BASE, productosBase);
  }

  async getProductosBase() {
    const productosBase = await this.getItem(this.keys.PRODUCTOS_BASE);
    return productosBase || [
      'Te Paris', 'Galletas', 'Cereales', 'Arroz 3/4', 'Fideo Famosa',
      'Azúcar blanca', 'Harina Pampa blanca', 'Lavandina', 'Jaboncillo',
      'Ace brillo', 'Mantequilla', 'Mermelada', 'Sal', 'Sardina',
      'Picadillo', 'Shampoo', 'Harry el limonero', 'Salsa soja',
      'Vinagre', 'Doña gusta'
    ];
  }

  // Método para limpiar todos los datos (útil para reset)
  async clearAllData() {
    try {
      const keys = Object.values(this.keys);
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      return false;
    }
  }

  // Método para backup de datos
  async exportData() {
    try {
      const data = {};
      const keys = Object.values(this.keys);
      
      for (const key of keys) {
        data[key] = await this.getItem(key);
      }
      
      return data;
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }

  // Método para restaurar datos desde backup
  async importData(data) {
    try {
      const keys = Object.values(this.keys);
      
      for (const key of keys) {
        if (data[key]) {
          await this.setItem(key, data[key]);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

export default new StorageService();