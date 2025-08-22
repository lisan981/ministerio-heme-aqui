import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, query, where, addDoc, getDocs, deleteDoc } from 'firebase/firestore';

// Componente para los botones de navegación
const NavButton = ({ text, onClick, currentView, target }) => (
  <button
    onClick={onClick}
    className={`
      px-4 py-2 rounded-full font-semibold transition-all duration-300 shadow-md
      ${currentView === target
        ? 'bg-pulperia-primary text-white scale-105'
        : 'bg-pulperia-card-light text-pulperia-text-light hover:bg-pulperia-primary hover:text-white'}
    `}
  >
    {text}
  </button>
);

// Componente para mostrar las métricas financieras
const StatCard = ({ title, value, isProfit, color }) => (
  <div className={`bg-pulperia-card-light p-6 rounded-2xl shadow-lg transition-colors duration-300 ${color || ''}`}>
    <h3 className="text-lg font-medium text-gray-600 mb-2">{title}</h3>
    <p className={`text-3xl font-bold ${isProfit === undefined ? 'text-pulperia-primary' : (isProfit ? 'text-green-500' : 'text-red-500')}`}>
      Bs {value.toFixed(2)}
    </p>
  </div>
);

// Componente para el panel principal (Dashboard)
const Dashboard = ({ efectivo, totalActivos, totalPorCobrar, valorInventario }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    <StatCard title="Efectivo (Bs)" value={efectivo} />
    <StatCard title="Activos Totales (Bs)" value={totalActivos} />
    <StatCard title="Total por Cobrar (Bs)" value={totalPorCobrar} />
    <StatCard title="Valor Total Inventario (Bs)" value={valorInventario} />
  </div>
);

// Componente para la gestión de inventario
const Inventario = ({ productos, productosBase, setProductosBase, loading, handleFinalizePurchase, handleDeleteProducto }) => {
  const [productosPreview, setProductosPreview] = useState([]);
  const [compraFecha, setCompraFecha] = useState('');
  const [compraCodigo, setCompraCodigo] = useState('');

  const [currentProduct, setCurrentProduct] = useState({
    nombre: '',
    cantidad: '',
    costo: '',
    precioVenta: '',
  });

  const handleRemoveFromPreview = (index) => {
    setProductosPreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddProductToPreview = (e) => {
    e.preventDefault();
    const newProduct = {
      nombre: currentProduct.nombre.trim(),
      cantidad: parseInt(currentProduct.cantidad, 10),
      costo: parseFloat(currentProduct.costo),
      precioVenta: parseFloat(currentProduct.precioVenta),
    };
    if (newProduct.nombre && newProduct.cantidad > 0 && newProduct.costo >= 0 && newProduct.precioVenta >= 0) {
      setProductosPreview(prev => [...prev, newProduct]);
      
      if (!productosBase.includes(newProduct.nombre)) {
        setProductosBase(prev => [...prev, newProduct.nombre].sort());
      }

      setCurrentProduct({ nombre: '', cantidad: '', costo: '', precioVenta: '' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-pulperia-card-light p-6 rounded-2xl shadow-lg">
        <h2 className="text-xl font-bold mb-4">Añadir Productos a la Compra</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Código de Compra</label>
          <input
            type="text"
            name="compraCodigo"
            required
            value={compraCodigo}
            onChange={(e) => setCompraCodigo(e.target.value)}
            className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Fecha de Compra</label>
          <input
            type="date"
            name="fechaCompra"
            required
            value={compraFecha}
            onChange={(e) => setCompraFecha(e.target.value)}
            className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary"
          />
        </div>
        <form onSubmit={handleAddProductToPreview}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Nombre del Producto</label>
            <input
              type="text"
              list="productos-sugeridos"
              name="nombre"
              required
              value={currentProduct.nombre}
              onChange={(e) => setCurrentProduct({ ...currentProduct, nombre: e.target.value })}
              className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary"
              placeholder="Escribe o selecciona un producto"
            />
            <datalist id="productos-sugeridos">
              {productosBase.map((p, index) => (
                <option key={index} value={p} />
              ))}
            </datalist>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Cantidad</label>
            <input
              type="number"
              name="cantidad"
              required
              min="1"
              value={currentProduct.cantidad}
              onChange={(e) => setCurrentProduct({ ...currentProduct, cantidad: e.target.value })}
              className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Costo Unitario (Bs)</label>
            <input
              type="number"
              name="costo"
              required
              step="0.01"
              min="0"
              value={currentProduct.costo}
              onChange={(e) => setCurrentProduct({ ...currentProduct, costo: e.target.value })}
              className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Precio de Venta (Bs)</label>
            <input
              type="number"
              name="precioVenta"
              required
              step="0.01"
              min="0"
              value={currentProduct.precioVenta}
              onChange={(e) => setCurrentProduct({ ...currentProduct, precioVenta: e.target.value })}
              className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-pulperia-primary text-white p-3 rounded-lg shadow-md hover:bg-pulperia-primary-dark transition-colors"
          >
            Añadir a la lista
          </button>
        </form>
      </div>
      <div className="bg-pulperia-card-light p-6 rounded-2xl shadow-lg flex flex-col h-full">
        <h2 className="text-xl font-bold mb-4">Vista Previa de la Compra</h2>
        <div className="mb-4">
          <p className="text-sm font-medium">
            <strong>Código de Compra:</strong> {compraCodigo || 'No especificado'}
          </p>
          <p className="text-sm font-medium">
            <strong>Fecha de Compra:</strong> {compraFecha || 'No especificado'}
          </p>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 text-left font-medium rounded-tl-lg">Nombre</th>
                <th className="p-3 text-left font-medium">Cantidad</th>
                <th className="p-3 text-left font-medium">Costo Unitario (Bs)</th>
                <th className="p-3 text-left font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {productosPreview.length > 0 ? (
                productosPreview.map((p, index) => (
                  <tr key={index} className="border-t border-gray-200">
                    <td className="p-3">{p.nombre}</td>
                    <td className="p-3">{p.cantidad}</td>
                    <td className="p-3">Bs {p.costo.toFixed(2)}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleRemoveFromPreview(index)}
                        className="bg-red-500 text-white p-1 rounded-md text-xs hover:bg-red-600 transition-colors"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" className="p-4 text-center text-gray-500">No hay productos en la vista previa.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {productosPreview.length > 0 && (
          <button
            onClick={() => handleFinalizePurchase(productosPreview, compraFecha, compraCodigo)}
            className="mt-4 w-full bg-green-600 text-white p-3 rounded-lg shadow-md hover:bg-green-700 transition-colors"
            disabled={loading || !compraFecha || !compraCodigo}
          >
            {loading ? 'Guardando...' : 'Guardar en Inventario'}
          </button>
        )}
      </div>
      <div className="lg:col-span-2 bg-pulperia-card-light p-6 rounded-2xl shadow-lg mt-8">
        <h2 className="text-xl font-bold mb-4">Inventario Actual de Productos</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 text-left font-medium rounded-tl-lg">Nombre</th>
                <th className="p-3 text-left font-medium">Cantidad</th>
                <th className="p-3 text-left font-medium">Costo (Bs)</th>
                <th className="p-3 text-left font-medium">Precio Venta (Bs)</th>
                <th className="p-3 text-left font-medium">Costo Total (Bs)</th>
                <th className="p-3 text-left font-medium">Fecha</th>
                <th className="p-3 text-left font-medium rounded-tr-lg">Acción</th>
              </tr>
            </thead>
            <tbody>
              {productos.length > 0 ? (
                productos.map(p => (
                  <tr key={p.id} className="border-t border-gray-200">
                    <td className="p-3">{p.nombre}</td>
                    <td className="p-3">{p.cantidad}</td>
                    <td className="p-3">Bs {p.costo.toFixed(2)}</td>
                    <td className="p-3">Bs {p.precioVenta.toFixed(2)}</td>
                    <td className="p-3">Bs {(p.cantidad * p.costo).toFixed(2)}</td>
                    <td className="p-3">{p.timestamp ? new Date(p.timestamp).toLocaleDateString() : 'N/A'}</td>
                    <td className="p-3">
                        <button onClick={() => handleDeleteProducto(p)} className="bg-red-500 text-white px-2 py-1 text-xs rounded-md hover:bg-red-600 transition-colors">Eliminar</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="p-4 text-center text-gray-500">No hay productos en el inventario.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Componente para la gestión de materiales
const Materiales = ({ materiales, handleAddMaterial, loading, handleDeleteMaterial }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div className="bg-pulperia-card-light p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Agregar Material</h2>
      <form onSubmit={handleAddMaterial}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input type="text" name="nombre" required className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Cantidad</label>
          <input type="number" name="cantidad" required min="1" className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Costo Unitario (Bs)</label>
          <input type="number" name="costo" required step="0.01" min="0" className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Código</label>
          <input type="text" name="codigo" required className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Fecha</label>
          <input type="date" name="fecha" required className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary" />
        </div>
        <button
          type="submit"
          className="w-full bg-pulperia-primary text-white p-3 rounded-lg shadow-md hover:bg-pulperia-primary-dark transition-colors"
          disabled={loading}
        >
          {loading ? 'Agregando...' : 'Agregar Material'}
        </button>
      </form>
    </div>
    <div className="bg-pulperia-card-light p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Inventario de Materiales</h2>
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-3 text-left font-medium rounded-tl-lg">Nombre</th>
              <th className="p-3 text-left font-medium">Cantidad</th>
              <th className="p-3 text-left font-medium">Costo (Bs)</th>
              <th className="p-3 text-left font-medium">Código</th>
              <th className="p-3 text-left font-medium rounded-tr-lg">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {materiales.length > 0 ? (
              materiales.map(m => (
                <tr key={m.id} className="border-t border-gray-200">
                  <td className="p-3">{m.nombre}</td>
                  <td className="p-3">{m.cantidad}</td>
                  <td className="p-3">Bs {m.costo.toFixed(2)}</td>
                  <td className="p-3">{m.codigo || 'N/A'}</td>
                  <td className="p-3">{m.timestamp ? new Date(m.timestamp).toLocaleDateString() : 'N/A'}</td>
                  <td className="p-3">
                      <button onClick={() => handleDeleteMaterial(m)} className="bg-red-500 text-white px-2 py-1 text-xs rounded-md hover:bg-red-600 transition-colors">Eliminar</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="p-4 text-center text-gray-500">No hay materiales en el inventario.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// Componente para la gestión de deudas
const Deudas = ({ deudas, handlePartialPayment, loading, handleDeleteDeuda }) => {
  const [paymentAmount, setPaymentAmount] = useState({});

  const handlePaymentSubmit = (id) => (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount[id]);
    if (!isNaN(amount) && amount > 0) {
      handlePartialPayment(id, amount);
      setPaymentAmount({ ...paymentAmount, [id]: '' });
    }
  };

  const clientesDeuda = [...new Set(deudas.filter(d => d.esVenta).map(d => d.deudor))].filter(d => d);

  return (
    <div className="bg-pulperia-card-light p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Listado de Deudas y Clientes</h2>
      {clientesDeuda.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Clientes con Deuda:</h3>
          <ul className="flex flex-wrap gap-2">
            {clientesDeuda.map(cliente => (
              <li key={cliente} className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full">{cliente}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-3 text-left font-medium rounded-tl-lg">Deudor</th>
              <th className="p-3 text-left font-medium">Monto (Bs)</th>
              <th className="p-3 text-left font-medium">Productos</th>
              <th className="p-3 text-left font-medium">Pagar</th>
              <th className="p-3 text-left font-medium rounded-tr-lg">Acción</th>
            </tr>
          </thead>
          <tbody>
            {deudas.filter(d => d.esVenta).length > 0 ? (
              deudas.filter(d => d.esVenta).map(d => (
                <tr key={d.id} className="border-t border-gray-200">
                  <td className="p-3">{d.deudor}</td>
                  <td className="p-3">Bs {d.monto.toFixed(2)}</td>
                  <td className="p-3">
                    {d.productosVendidos && Array.isArray(d.productosVendidos) ? (
                      <ul className="list-disc list-inside">
                        {d.productosVendidos.map((prod, index) => (
                          <li key={index}>{prod.nombre} ({prod.cantidad})</li>
                        ))}
                      </ul>
                    ) : (d.concepto || 'N/A')}
                  </td>
                  <td className="p-3">
                    <form onSubmit={handlePaymentSubmit(d.id)} className="flex items-center space-x-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={d.monto}
                        value={paymentAmount[d.id] || ''}
                        onChange={(e) => setPaymentAmount({ ...paymentAmount, [d.id]: e.target.value })}
                        placeholder="Monto"
                        className="w-24 p-1 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary text-sm"
                      />
                      <button
                        type="submit"
                        className="bg-green-600 text-white px-3 py-1 rounded-lg shadow-md hover:bg-green-700 transition-colors"
                        disabled={loading}
                      >
                        Pagar
                      </button>
                    </form>
                  </td>
                  <td className="p-3">
                      <button onClick={() => handleDeleteDeuda(d)} className="bg-red-500 text-white px-2 py-1 text-xs rounded-md hover:bg-red-600 transition-colors">Eliminar</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="p-4 text-center text-gray-500">No hay deudas registradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Componente para la gestión de capital
const Capital = ({ inyeccionesCapital, handleAddCapital, loading, handleDeleteCapital }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div className="bg-pulperia-card-light p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Inyección de Capital</h2>
      <p className="text-sm text-gray-500 mb-4">Agrega capital inicial a tu negocio.</p>
      <form onSubmit={handleAddCapital}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Monto (Bs)</label>
          <input type="number" name="monto" required step="0.01" min="0" className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input type="text" name="nombre" required className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Concepto</label>
          <input type="text" name="concepto" required className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Organización</label>
          <input type="text" name="organizacion" required className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Código</label>
          <input type="text" name="codigo" required className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Fecha</label>
          <input type="date" name="fecha" required className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary" />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          {loading ? 'Registrando...' : 'Registrar Capital'}
        </button>
      </form>
    </div>
    <div className="bg-pulperia-card-light p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Historial de Inyecciones de Capital</h2>
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 text-left font-medium">Fecha</th>
              <th className="p-2 text-left font-medium">Monto (Bs)</th>
              <th className="p-2 text-left font-medium">Nombre</th>
              <th className="p-2 text-left font-medium">Organización</th>
              <th className="p-2 text-left font-medium">Concepto</th>
              <th className="p-2 text-left font-medium rounded-tr-lg">Código</th>
            </tr>
          </thead>
          <tbody>
            {inyeccionesCapital.length > 0 ? (
              inyeccionesCapital.map(c => (
                <tr key={c.id} className="border-t border-gray-200">
                  <td className="p-3">{new Date(c.timestamp).toLocaleDateString()}</td>
                  <td className="p-3">Bs {c.monto.toFixed(2)}</td>
                  <td className="p-3">{c.nombre}</td>
                  <td className="p-3">{c.organizacion}</td>
                  <td className="p-3">{c.concepto}</td>
                  <td className="p-3">{c.codigo}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="p-4 text-center text-gray-500">No hay inyecciones de capital registradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// Componente para la gestión de ventas
const Ventas = ({ productos, productosBase, handleSellProduct, loading, suscritosNombres }) => {
  const [ventaItems, setVentaItems] = useState([{ producto: '', cantidad: 1, precioVenta: 0 }]);
  const [tipoVenta, setTipoVenta] = useState('efectivo');

  const addVentaItem = () => {
    setVentaItems([...ventaItems, { producto: '', cantidad: 1, precioVenta: 0 }]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...ventaItems];
    newItems[index][field] = value;
    if (field === 'producto') {
      const product = productos.find(p => p.nombre === value);
      if (product) {
        newItems[index].precioVenta = product.precioVenta;
      } else {
        newItems[index].precioVenta = 0;
      }
    }
    const cantidad = parseInt(newItems[index].cantidad, 10);
    newItems[index].cantidad = isNaN(cantidad) ? 1 : cantidad;
    newItems[index].precioVenta = parseFloat(newItems[index].precioVenta);
    setVentaItems(newItems);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSellProduct(e);
    setVentaItems([{ producto: '', cantidad: 1, precioVenta: 0 }]);
  };

  const getTotalPrice = () => {
    return ventaItems.reduce((total, item) => total + (item.precioVenta * item.cantidad), 0);
  };

  return (
    <div className="bg-pulperia-card-light p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Registrar Venta</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Fecha de la Venta</label>
          <input type="date" name="fechaVenta" required className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary" />
        </div>
        {ventaItems.map((item, index) => (
          <div key={index} className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Producto {index + 1}</label>
              <select
                name="producto_nombre"
                required
                className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary"
                value={item.producto}
                onChange={(e) => handleItemChange(index, 'producto', e.target.value)}
              >
                <option value="">Selecciona un producto</option>
                {productosBase.map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-1/4">
              <label className="block text-sm font-medium mb-1">Cantidad</label>
              <input
                type="number"
                name="producto_cantidad"
                required
                min="1"
                value={item.cantidad}
                onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary"
              />
            </div>
            <div className="w-full sm:w-1/4">
              <label className="block text-sm font-medium mb-1">Precio Venta Unitario (Bs)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="precioVenta"
                value={item.precioVenta}
                onChange={(e) => handleItemChange(index, 'precioVenta', e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-200"
              />
            </div>
            <div className="w-full sm:w-1/4">
              <label className="block text-sm font-medium mb-1">Precio Total (Bs)</label>
              <input
                type="text"
                value={(item.precioVenta * item.cantidad).toFixed(2)}
                readOnly
                className="w-full p-2 rounded-lg bg-gray-200"
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addVentaItem}
          className="w-full bg-gray-300 text-gray-800 p-2 rounded-lg shadow-md hover:bg-gray-400 transition-colors mb-4"
        >
          Agregar otro producto
        </button>
        <div className="mb-4 text-right">
          <p className="text-lg font-bold">Total de la Venta: Bs {getTotalPrice().toFixed(2)}</p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Tipo de Venta</label>
          <div className="flex space-x-4 mt-2">
            <label className="inline-flex items-center">
              <input type="radio" name="tipoVenta" value="efectivo" defaultChecked className="form-radio text-pulperia-primary" />
              <span className="ml-2">Efectivo</span>
            </label>
            <label className="inline-flex items-center">
              <input type="radio" name="tipoVenta" value="credito" className="form-radio text-pulperia-primary" />
              <span className="ml-2">Crédito</span>
            </label>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Deudor (solo si es crédito)</label>
          <input 
            type="text" 
            name="deudor" 
            placeholder="Nombre del deudor" 
            className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary"
            list="suscritos-sugeridos"
          />
          <datalist id="suscritos-sugeridos">
            {suscritosNombres.map((nombre, index) => (
              <option key={index} value={nombre} />
            ))}
          </datalist>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          {loading ? 'Registrando Venta...' : 'Registrar Venta'}
        </button>
      </form>
    </div>
  );
};

// Componente para la gestión de ganancias
const Ganancias = ({ ventas, productos }) => {
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
  return (
    <div className="bg-pulperia-card-light p-6 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Reporte de Ganancias</h2>
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">Ganancias por Mes</h3>
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 text-left font-medium rounded-tl-lg">Mes/Año</th>
                <th className="p-3 text-left font-medium">Ganancia Total (Bs)</th>
                <th className="p-3 text-left font-medium rounded-tr-lg">Código</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(gananciasMensuales).length > 0 ? (
                Object.keys(gananciasMensuales).map(mes => (
                  <tr key={mes} className="border-t border-gray-200">
                    <td className="p-3">{mes}</td>
                    <td className="p-3">Bs {gananciasMensuales[mes].toFixed(2)}</td>
                    <td className="p-3">{'Ingresos por amortizaciones 104'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" className="p-4 text-center text-gray-500">No hay datos de ganancias por mes.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <h3 className="text-xl font-bold mb-4">Detalle de Ganancias por Venta</h3>
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-3 text-left font-medium rounded-tl-lg">Fecha</th>
              <th className="p-3 text-left font-medium">Código</th>
              <th className="p-3 text-left font-medium">Productos Vendidos</th>
              <th className="p-3 text-left font-medium">Total Venta (Bs)</th>
              <th className="p-3 text-left font-medium">Ganancia (Bs)</th>
              <th className="p-3 text-left font-medium rounded-tr-lg">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {ventas.length > 0 ? (
              ventas.map(v => (
                <tr key={v.id} className="border-t border-gray-200">
                  <td className="p-3">{new Date(v.timestamp).toLocaleDateString()}</td>
                  <td className="p-3">{v.codigo || 'N/A'}</td>
                  <td className="p-3">
                    <ul className="list-disc list-inside">
                      {Array.isArray(v.productosVendidos) ? (
                        v.productosVendidos.map((prod, index) => (
                          <li key={index}>{prod.nombre} ({prod.cantidad})</li>
                        ))
                      ) : (
                        <li>{v.producto} ({v.cantidad})</li>
                      )}
                    </ul>
                  </td>
                  <td className="p-3">Bs {v.precioVentaTotal.toFixed(2)}</td>
                  <td className={`p-3 font-bold ${getGananciaPorVenta(v) >= 0 ? 'text-green-500' : 'text-red-500'}`}>Bs {getGananciaPorVenta(v).toFixed(2)}</td>
                  <td className="p-3">{v.tipo}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="p-4 text-center text-gray-500">No hay ventas registradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Componente para la gestión de gastos
const Gastos = ({ gastos, handleAddGasto, loading, handleDeleteGasto }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div className="bg-pulperia-card-light p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Registrar Gasto</h2>
      <p className="text-sm text-gray-500 mb-4">Para egresos operativos (ej. alquiler, servicios).</p>
      <form onSubmit={handleAddGasto}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Concepto del Gasto</label>
          <input type="text" name="concepto" required className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Monto (Bs)</label>
          <input type="number" name="monto" required step="0.01" min="0" className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Código</label>
          <input type="text" name="codigo" className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Fecha</label>
          <input type="date" name="fecha" className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary" />
        </div>
        <button
          type="submit"
          className="w-full bg-red-600 text-white p-3 rounded-lg shadow-md hover:bg-red-700 transition-colors"
          disabled={loading}
        >
          {loading ? 'Registrando Gasto...' : 'Registrar Gasto'}
        </button>
      </form>
    </div>
    <div className="bg-pulperia-card-light p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-bold mb-4">Gastos Registrados</h2>
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-3 text-left font-medium rounded-tl-lg">Fecha</th>
              <th className="p-3 text-left font-medium">Código</th>
              <th className="p-3 text-left font-medium">Concepto</th>
              <th className="p-3 text-left font-medium">Monto (Bs)</th>
              <th className="p-3 text-left font-medium rounded-tr-lg">Acción</th>
            </tr>
          </thead>
          <tbody>
            {gastos.length > 0 ? (
              gastos.map(g => (
                <tr key={g.id} className="border-t border-gray-200">
                  <td className="p-3">{g.timestamp ? new Date(g.timestamp).toLocaleDateString() : 'N/A'}</td>
                  <td className="p-3">{g.codigo || 'N/A'}</td>
                  <td className="p-3">{g.concepto}</td>
                  <td className="p-3">Bs {g.monto.toFixed(2)}</td>
                  <td className="p-3">
                      <button onClick={() => handleDeleteGasto(g)} className="bg-red-500 text-white px-2 py-1 text-xs rounded-md hover:bg-red-600 transition-colors">Eliminar</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="p-4 text-center text-gray-500">No hay gastos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// Componente para la gestión de Suscripciones
const Suscripciones = ({ suscripciones, handleAddSuscripcion, loading, handleDeleteSuscripcion }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-pulperia-card-light p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">Registrar Pago de Suscripción</h2>
            <form onSubmit={handleAddSuscripcion}>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Nombre Completo</label>
                    <input type="text" name="nombre" required className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Monto Pagado (Bs)</label>
                    <input type="number" name="montoPagado" required step="0.01" min="0" className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary" />
                </div>
                 <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Código</label>
                    <input type="text" name="codigo" required className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary" />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Fecha de Inscripción</label>
                    <input type="date" name="fechaInscripcion" required className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary" />
                </div>
                <button
                    type="submit"
                    className="w-full bg-pulperia-primary text-white p-3 rounded-lg shadow-md hover:bg-pulperia-primary-dark transition-colors"
                    disabled={loading}
                >
                    {loading ? 'Registrando...' : 'Registrar Pago'}
                </button>
            </form>
        </div>
        <div className="bg-pulperia-card-light p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">Listado de Suscripciones</h2>
            <div className="overflow-x-auto">
                <table className="w-full table-auto text-sm">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-3 text-left font-medium rounded-tl-lg">Nombre</th>
                            <th className="p-3 text-left font-medium">Monto (Bs)</th>
                            <th className="p-3 text-left font-medium">Código</th>
                            <th className="p-3 text-left font-medium rounded-tr-lg">Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suscripciones.length > 0 ? (
                            suscripciones.map(s => (
                                <tr key={s.id} className="border-t border-gray-200">
                                    <td className="p-3">{s.nombre}</td>
                                    <td className="p-3">Bs {s.montoPagado.toFixed(2)}</td>
                                    <td className="p-3">{s.codigo}</td>
                                    <td className="p-3">{new Date(s.fechaInscripcion).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        <button onClick={() => handleDeleteSuscripcion(s)} className="bg-red-500 text-white px-2 py-1 text-xs rounded-md hover:bg-red-600 transition-colors">Eliminar</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" className="p-4 text-center text-gray-500">No hay suscripciones registradas.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);


// Componente para los reportes
const Reportes = ({ isHistorical, capitalInicial, efectivo, valorInventario, valorMateriales, totalPorCobrar, totalActivos, valorNeto, resultadoDelPeriodo, productos, materiales, deudas, ventas, gastos, inyeccionesCapital, suscripciones }) => {
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

  return (
    <div id="report-content" className="bg-pulperia-card-light p-6 rounded-2xl shadow-lg print:p-0 print:shadow-none">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-xl font-bold">{isHistorical ? "Reporte Trimestral Guardado" : "Reporte Completo"}</h2>
        <button
          onClick={() => window.print()}
          className="bg-purple-600 text-white p-2 rounded-lg shadow-md hover:bg-purple-700 transition-colors"
        >
          Exportar/Imprimir
        </button>
      </div>
      <div className="prose max-w-none">
        <h3 className="text-lg font-bold">Resumen Financiero</h3>
        <table className="w-full my-4 text-sm">
          <tbody>
            <tr><td className="p-2 border-b border-gray-200">Capital Inicial</td><td className="p-2 border-b border-gray-200">Bs {capitalInicial.toFixed(2)}</td></tr>
            <tr><td className="p-2 border-b border-gray-200">Efectivo</td><td className="p-2 border-b border-gray-200">Bs {efectivo.toFixed(2)}</td></tr>
            <tr><td className="p-2 border-b border-gray-200">Valor de Inventario de Productos</td><td className="p-2 border-b border-gray-200">Bs {valorInventario.toFixed(2)}</td></tr>
            <tr><td className="p-2 border-b border-gray-200">Valor de Inventario de Materiales</td><td className="p-2 border-b border-gray-200">Bs {valorMateriales.toFixed(2)}</td></tr>
            <tr><td className="p-2 border-b border-gray-200">Total por Cobrar</td><td className="p-2 border-b border-gray-200">Bs {totalPorCobrar.toFixed(2)}</td></tr>
            <tr><td className="p-2 border-b border-gray-200 font-bold">Activos Totales</td><td className="p-2 border-b border-gray-200 font-bold">Bs {totalActivos.toFixed(2)}</td></tr>
          </tbody>
        </table>

        <h3 className="text-lg font-bold mt-8">Historial de Ganancias</h3>
        <table className="w-full my-4 text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 text-left font-medium">Mes/Año</th>
              <th className="p-2 text-left font-medium">Ganancia Total (Bs)</th>
              <th className="p-2 text-left font-medium rounded-tr-lg">Código</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(gananciasMensuales).length > 0 ? (
              Object.keys(gananciasMensuales).map(mes => (
                <tr key={mes} className="border-t border-gray-200">
                  <td className="p-3">{mes}</td>
                  <td className="p-3">Bs {gananciasMensuales[mes].toFixed(2)}</td>
                  <td className="p-3">{'Ingresos por amortizaciones 104'}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="3" className="p-4 text-center text-gray-500">No hay datos de ganancias por mes.</td></tr>
            )}
          </tbody>
        </table>
        
        <h3 className="text-lg font-bold mt-8">Suscritos</h3>
        <table className="w-full my-4 text-sm">
            <thead>
                <tr className="bg-gray-200">
                    <th className="p-3 text-left font-medium rounded-tl-lg">Nombre</th>
                    <th className="p-3 text-left font-medium">Monto Pagado (Bs)</th>
                    <th className="p-3 text-left font-medium">Código</th>
                    <th className="p-3 text-left font-medium rounded-tr-lg">Fecha de Inscripción</th>
                </tr>
            </thead>
            <tbody>
                {suscripciones.length > 0 ? (
                    suscripciones.map(s => (
                        <tr key={s.id} className="border-t border-gray-200">
                            <td className="p-3">{s.nombre}</td>
                            <td className="p-3">Bs {s.montoPagado.toFixed(2)}</td>
                            <td className="p-3">{s.codigo}</td>
                            <td className="p-3">{new Date(s.fechaInscripcion).toLocaleDateString()}</td>
                        </tr>
                    ))
                ) : (
                    <tr><td colSpan="4" className="p-4 text-center text-gray-500">No hay suscripciones registradas.</td></tr>
                )}
            </tbody>
        </table>

        <h3 className="text-lg font-bold mt-8">Historial de Inyecciones de Capital</h3>
        <table className="w-full my-4 text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 text-left font-medium">Fecha</th>
              <th className="p-2 text-left font-medium">Monto (Bs)</th>
              <th className="p-2 text-left font-medium">Nombre</th>
              <th className="p-2 text-left font-medium">Organización</th>
              <th className="p-2 text-left font-medium">Concepto</th>
              <th className="p-2 text-left font-medium rounded-tr-lg">Código</th>
            </tr>
          </thead>
          <tbody>
            {inyeccionesCapital.length > 0 ? (
              inyeccionesCapital.map(c => (
                <tr key={c.id} className="border-t border-gray-200">
                  <td className="p-3">{new Date(c.timestamp).toLocaleDateString()}</td>
                  <td className="p-3">Bs {c.monto.toFixed(2)}</td>
                  <td className="p-3">{c.nombre}</td>
                  <td className="p-3">{c.organizacion}</td>
                  <td className="p-3">{c.concepto}</td>
                  <td className="p-3">{c.codigo}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="p-4 text-center text-gray-500">No hay inyecciones de capital registradas.</td></tr>
            )}
          </tbody>
        </table>
        <h3 className="text-lg font-bold mt-8">Detalle de Inventario de Materiales</h3>
        <table className="w-full my-4 text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 text-left font-medium">Nombre</th>
              <th className="p-2 text-left font-medium">Cantidad</th>
              <th className="p-2 text-left font-medium">Costo (Bs)</th>
              <th className="p-2 text-left font-medium">Código</th>
              <th className="p-2 text-left font-medium rounded-tr-lg">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {materiales.length > 0 ? (
              materiales.map(m => (
                <tr key={m.id} className="border-t border-gray-200">
                  <td className="p-3">{m.nombre}</td>
                  <td className="p-3">{m.cantidad}</td>
                  <td className="p-3">Bs {m.costo.toFixed(2)}</td>
                  <td className="p-3">{m.codigo || 'N/A'}</td>
                  <td className="p-3">{m.timestamp ? new Date(m.timestamp).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="p-4 text-center text-gray-500">No hay materiales en el inventario.</td></tr>
            )}
          </tbody>
        </table>
        <h3 className="text-lg font-bold mt-8">Detalle de Inventario de Productos</h3>
        <table className="w-full my-4 text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 text-left font-medium rounded-tl-lg">Nombre</th>
              <th className="p-2 text-left font-medium">Cantidad</th>
              <th className="p-2 text-left font-medium">Costo (Bs)</th>
              <th className="p-2 text-left font-medium">Precio Venta (Bs)</th>
              <th className="p-2 text-left font-medium">Costo Total (Bs)</th>
              <th className="p-2 text-left font-medium">Fecha</th>
              <th className="p-2 text-left font-medium rounded-tr-lg">Código</th>
            </tr>
          </thead>
          <tbody>
            {productos.length > 0 ? (
              productos.map(p => (
                <tr key={p.id} className="border-t border-gray-200">
                  <td className="p-3">{p.nombre}</td>
                  <td className="p-3">{p.cantidad}</td>
                  <td className="p-3">Bs {p.costo.toFixed(2)}</td>
                  <td className="p-3">Bs {p.precioVenta.toFixed(2)}</td>
                  <td className="p-3">Bs {(p.cantidad * p.costo).toFixed(2)}</td>
                  <td className="p-3">{p.timestamp ? new Date(p.timestamp).toLocaleDateString() : 'N/A'}</td>
                  <td className="p-3">{p.codigoCompra || 'N/A'}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" className="p-4 text-center text-gray-500">No hay productos en el inventario.</td></tr>
            )}
          </tbody>
        </table>
        <h3 className="text-lg font-bold mt-8">Listado de Deudas</h3>
        <table className="w-full my-4 text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-3 text-left font-medium">Deudor</th>
              <th className="p-3 text-left font-medium">Monto (Bs)</th>
              <th className="p-3 text-left font-medium">Productos</th>
              <th className="p-3 text-left font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {deudas.filter(d => d.esVenta).length > 0 ? (
              deudas.filter(d => d.esVenta).map(d => (
                <tr key={d.id} className="border-t border-gray-200">
                  <td className="p-3">{d.deudor}</td>
                  <td className="p-3">Bs {d.monto.toFixed(2)}</td>
                  <td className="p-3">
                    {d.productosVendidos && Array.isArray(d.productosVendidos) ? (
                      <ul className="list-disc list-inside">
                        {d.productosVendidos.map((prod, index) => (
                          <li key={index}>{prod.nombre} ({prod.cantidad})</li>
                        ))}
                      </ul>
                    ) : (d.concepto || 'N/A')}
                  </td>
                  <td className="p-3">{new Date(d.timestamp).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="p-4 text-center text-gray-500">No hay deudas registradas.</td></tr>
            )}
          </tbody>
        </table>
        <h3 className="text-lg font-bold mt-8">Historial de Gastos</h3>
        <table className="w-full my-4 text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 text-left font-medium">Concepto</th>
              <th className="p-2 text-left font-medium">Monto (Bs)</th>
              <th className="p-2 text-left font-medium">Código</th>
              <th className="p-2 text-left font-medium rounded-tr-lg">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {gastos.length > 0 ? (
              gastos.map(g => (
                <tr key={g.id} className="border-t border-gray-200">
                  <td className="p-3">{g.concepto}</td>
                  <td className="p-3">Bs {g.monto.toFixed(2)}</td>
                  <td className="p-3">{g.codigo || 'N/A'}</td>
                  <td className="p-3">{g.timestamp ? new Date(g.timestamp).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="p-4 text-center text-gray-500">No hay gastos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Componente para la pantalla de Ajustes y Activación
const Ajustes = ({ isConfigured, profileData, quarterlyReports, handleRegister, handleReactivation, handleLogoUpload, onBack, onViewReport, loading, message, needsReactivation }) => {
    
    // Vista para la configuración inicial o reactivación
    if (!isConfigured || needsReactivation) {
        const [regName, setRegName] = useState(profileData?.name || '');
        const [regEmail, setRegEmail] = useState(profileData?.email || '');
        const [regCode, setRegCode] = useState('');

        const handleSubmit = (e) => {
            e.preventDefault();
            if (needsReactivation) {
                handleReactivation(regCode);
            } else {
                handleRegister(regName, regEmail, regCode);
            }
        };

        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-pulperia-bg-light">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
                    <h2 className="text-2xl font-bold mb-4">{needsReactivation ? "Reactivación Requerida" : "Activación Requerida"}</h2>
                    <p className="mb-4 text-sm text-gray-600">
                        {needsReactivation 
                            ? "Tu licencia de 3 meses ha expirado. Por favor, introduce el código de activación para continuar usando la app. Tus datos no se perderán."
                            : "Para usar la aplicación, por favor, introduce el código de activación y tus datos."
                        }
                    </p>
                    <form onSubmit={handleSubmit}>
                        {!needsReactivation && (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Tu Nombre</label>
                                    <input
                                        type="text"
                                        value={regName}
                                        onChange={(e) => setRegName(e.target.value)}
                                        required
                                        className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Tu Correo Electrónico</label>
                                    <input
                                        type="email"
                                        value={regEmail}
                                        onChange={(e) => setRegEmail(e.target.value)}
                                        required
                                        className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary"
                                    />
                                </div>
                            </>
                        )}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Código de Activación</label>
                            <input
                                type="password"
                                value={regCode}
                                onChange={(e) => setRegCode(e.target.value)}
                                required
                                className="w-full p-2 rounded-lg bg-gray-200 focus:outline-none focus:ring-2 focus:ring-pulperia-primary"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-pulperia-primary text-white p-3 rounded-lg shadow-md hover:bg-pulperia-primary-dark transition-colors"
                            disabled={loading}
                        >
                            {loading ? (needsReactivation ? 'Reactivando...' : 'Activando...') : (needsReactivation ? 'Reactivar Aplicación' : 'Activar Aplicación')}
                        </button>
                        {message && <p className="mt-4 text-sm text-red-500">{message}</p>}
                    </form>
                </div>
            </div>
        );
    }

    // Vista de Ajustes para usuarios ya configurados
    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
             <button
                onClick={onBack}
                className="self-start bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-md hover:bg-gray-300 transition-colors"
            >
                &larr; Volver al Resumen
            </button>
            <div className="bg-pulperia-card-light p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold mb-4">Datos del Usuario</h2>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <p className="w-full p-2 rounded-lg bg-gray-100">{profileData?.name || 'No disponible'}</p>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                    <p className="w-full p-2 rounded-lg bg-gray-100">{profileData?.email || 'No disponible'}</p>
                </div>
                 <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cambiar Logo</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pulperia-primary file:text-white hover:file:bg-pulperia-primary-dark"
                    />
                </div>
            </div>
            <div className="bg-pulperia-card-light p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold mb-4">Reportes Trimestrales Automáticos</h2>
                <p className="text-sm text-gray-600 mb-4">La aplicación guarda un reporte automáticamente cada 3 meses. Aquí puedes ver el historial.</p>
                <div className="overflow-x-auto">
                    <h3 className="text-lg font-semibold mb-2">Historial de Reportes</h3>
                    <table className="w-full table-auto text-sm">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="p-3 text-left font-medium rounded-tl-lg rounded-bl-lg">Trimestre del Reporte</th>
                                <th className="p-3 text-left font-medium rounded-tr-lg rounded-br-lg">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quarterlyReports.length > 0 ? (
                                quarterlyReports.map(report => (
                                    <tr key={report.id} className="border-t border-gray-200">
                                        <td className="p-3">{report.id}</td>
                                        <td className="p-3">
                                            <button onClick={() => onViewReport(report)} className="bg-blue-600 text-white px-3 py-1 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                                                Ver Reporte
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="2" className="p-4 text-center text-gray-500">No hay reportes guardados.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// Componente principal de la aplicación
const App = () => {
  // Estado de autenticación y datos del usuario
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [profileData, setProfileData] = useState(null);

  // Estado para la navegación y la visualización de la app
  const [view, setView] = useState('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [needsReactivation, setNeedsReactivation] = useState(false);
  const [logoUrl, setLogoUrl] = useState("https://googleusercontent.com/file_content/1");
  const [selectedReport, setSelectedReport] = useState(null);


  // Código de activación
  const activationCode = '120217';
  const myEmail = 'lisandroduranmendoza@gmail.com';


  // Estado para los datos financieros
  const [capitalInicial, setCapitalInicial] = useState(0);
  const [efectivo, setEfectivo] = useState(0);
  const [valorInventario, setValorInventario] = useState(0);
  const [valorMateriales, setValorMateriales] = useState(0);
  const [totalPorCobrar, setTotalPorCobrar] = useState(0);
  const [totalGastos, setTotalGastos] = useState(0);
  const [totalVentasIngresos, setTotalVentasIngresos] = useState(0);
  const [totalCostosDeVenta, setTotalCostosDeVenta] = useState(0);

  // Estado para las listas de productos, materiales y deudas
  const [productos, setProductos] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [deudas, setDeudas] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [inyeccionesCapital, setInyeccionesCapital] = useState([]);
  const [quarterlyReports, setQuarterlyReports] = useState([]);
  const [suscripciones, setSuscripciones] = useState([]);
  const [suscritosNombres, setSuscritosNombres] = useState([]);
  const [productosBase, setProductosBase] = useState([
    'Te Paris', 'Galletas', 'Cereales', 'Arroz 3/4', 'Fideo Famosa',
    'Azúcar blanca', 'Harina Pampa blanca', 'Lavandina', 'Jaboncillo',
    'Ace brillo', 'Mantequilla', 'Mermelada', 'Sal', 'Sardina',
    'Picadillo', 'Shampoo', 'Harry el limonero', 'Salsa soja',
    'Vinagre', 'Doña gusta'
  ]);

  // useEffect para inicializar Firebase y la autenticación
  useEffect(() => {
    try {
      const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
      const firebaseConfig = JSON.parse(typeof window.__firebase_config !== 'undefined' ? window.__firebase_config : '{}');

      if (Object.keys(firebaseConfig).length > 0) {
        const app = initializeApp(firebaseConfig);
        const firestoreDb = getFirestore(app);
        const firebaseAuth = getAuth(app);
        setDb(firestoreDb);
        setAuth(firebaseAuth);
        
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
          if (currentUser) {
            setUser(currentUser);
            setUserId(currentUser.uid);
            const userRef = doc(firestoreDb, `artifacts/${appId}/users/${currentUser.uid}/profile/info`);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setLogoUrl(data.logoUrl || "https://googleusercontent.com/file_content/1");
                if (!data.configured) {
                    setIsConfigured(false);
                    setView('configuracion');
                } else {
                    setIsConfigured(true);
                    // Check for reactivation
                    const activationDate = data.activationDate ? new Date(data.activationDate) : null;
                    if (activationDate) {
                        const expirationDate = new Date(activationDate);
                        expirationDate.setDate(expirationDate.getDate() + 90); // 90 days license
                        if (new Date() > expirationDate) {
                            setNeedsReactivation(true);
                            setView('configuracion');
                        } else {
                            setView('dashboard');
                        }
                    } else {
                        // If no activation date, force activation
                        setView('configuracion');
                    }
                }
            } else {
              await setDoc(userRef, { configured: false, logoUrl: "https://googleusercontent.com/file_content/1" });
              setIsConfigured(false);
              setView('configuracion');
            }
            setAuthReady(true);
          } else {
            if (typeof window.__initial_auth_token !== 'undefined') {
              await signInWithCustomToken(firebaseAuth, window.__initial_auth_token);
            } else {
              await signInAnonymously(firebaseAuth);
            }
          }
        });
        return () => unsubscribe();
      } else {
        setMessage('Error: Firebase configuration is missing.');
      }
    } catch (error) {
     console.error("Firebase initialization failed:", error);
     setMessage(`Error de inicialización de Firebase: ${error.message}`);
    }
  }, []);

  // useEffect para escuchar cambios en la base de datos y auto-guardar reportes
  useEffect(() => {
    if (!authReady || !userId || !db) return;
    
    const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';

    const profileRef = doc(db, `artifacts/${appId}/users/${userId}/profile/info`);
    const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileData(data);
        setCapitalInicial(data.capitalInicial || 0);
        setEfectivo(data.efectivo || 0);
        setIsConfigured(data.configured || false);
        setLogoUrl(data.logoUrl || "https://googleusercontent.com/file_content/1");
      }
    });
    
    const productosRef = collection(db, `artifacts/${appId}/users/${userId}/productos`);
    const unsubscribeProductos = onSnapshot(productosRef, (snapshot) => {
      const productosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProductos(productosData);
      const valor = productosData.reduce((sum, p) => sum + (p.cantidad * p.costo), 0);
      setValorInventario(valor);
    });
    
    const materialesRef = collection(db, `artifacts/${appId}/users/${userId}/materiales`);
    const unsubscribeMateriales = onSnapshot(materialesRef, (snapshot) => {
      const materialesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMateriales(materialesData);
      const valor = materialesData.reduce((sum, m) => sum + (m.cantidad * m.costo), 0);
      setValorMateriales(valor);
    });

    const deudasRef = collection(db, `artifacts/${appId}/users/${userId}/deudas`);
    const unsubscribeDeudas = onSnapshot(deudasRef, (snapshot) => {
      const deudasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDeudas(deudasData);
      const valor = deudasData.reduce((sum, d) => sum + d.monto, 0);
      setTotalPorCobrar(valor);
    });

    const ventasRef = collection(db, `artifacts/${appId}/users/${userId}/ventas`);
    const unsubscribeVentas = onSnapshot(ventasRef, (snapshot) => {
      const ventasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVentas(ventasData);
      const totalIngresos = ventasData.reduce((sum, v) => sum + (v.precioVentaTotal || 0), 0);
      const totalCostos = ventasData.reduce((sum, v) => {
        if (Array.isArray(v.productosVendidos)) {
          return sum + v.productosVendidos.reduce((subSum, p) => subSum + (p.costo * p.cantidad), 0);
        }
        return sum;
      }, 0);
      setTotalVentasIngresos(totalIngresos);
      setTotalCostosDeVenta(totalCostos);
    });

    const gastosRef = collection(db, `artifacts/${appId}/users/${userId}/gastos`);
    const unsubscribeGastos = onSnapshot(gastosRef, (snapshot) => {
      const gastosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGastos(gastosData);
      const valor = gastosData.reduce((sum, g) => sum + g.monto, 0);
      setTotalGastos(valor);
    });
    
    const capitalRef = collection(db, `artifacts/${appId}/users/${userId}/capital_injections`);
    const unsubscribeCapital = onSnapshot(capitalRef, (snapshot) => {
      const capitalData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInyeccionesCapital(capitalData);
    });

    const suscripcionesRef = collection(db, `artifacts/${appId}/users/${userId}/suscripciones`);
    const unsubscribeSuscripciones = onSnapshot(suscripcionesRef, (snapshot) => {
        const suscripcionesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSuscripciones(suscripcionesData);
        setSuscritosNombres([...new Set(suscripcionesData.map(s => s.nombre))]);
    });

    const reportsRef = collection(db, `artifacts/${appId}/users/${userId}/reportes_trimestrales`);
    const unsubscribeReports = onSnapshot(reportsRef, (snapshot) => {
        const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setQuarterlyReports(reportsData);

        // Auto-save logic
        if(isConfigured && !needsReactivation && profileData?.activationDate) {
            const activationDate = new Date(profileData.activationDate);
            const now = new Date();
            const oneYearFromActivation = new Date(activationDate);
            oneYearFromActivation.setFullYear(oneYearFromActivation.getFullYear() + 1);

            if (now < oneYearFromActivation) {
                const monthsPassed = (now.getFullYear() - activationDate.getFullYear()) * 12 + (now.getMonth() - activationDate.getMonth());
                const quartersPassed = Math.floor(monthsPassed / 3);

                if (quartersPassed > 0) {
                    for (let i = 1; i <= quartersPassed; i++) {
                        const reportDate = new Date(activationDate);
                        reportDate.setMonth(reportDate.getMonth() + 3 * i -1); 
                        
                        const reportYear = reportDate.getFullYear();
                        const reportQuarter = Math.floor((reportDate.getMonth()) / 3) + 1;
                        const reportId = `${reportYear}-Q${reportQuarter}`;

                        const reportExists = reportsData.some(report => report.id === reportId);
                        if (!reportExists) {
                            handleSaveQuarterlyReport(true, reportId);
                        }
                    }
                }
            }
        }
    });

    return () => {
      unsubscribeProfile();
      unsubscribeProductos();
      unsubscribeMateriales();
      unsubscribeDeudas();
      unsubscribeVentas();
      unsubscribeGastos();
      unsubscribeCapital();
      unsubscribeReports();
      unsubscribeSuscripciones();
    };
  }, [authReady, userId, db, isConfigured, needsReactivation, profileData]);

  const handleRegister = async (regName, regEmail, regCode) => {
    if (regCode !== activationCode) {
      setMessage("Código de activación incorrecto. Por favor, inténtalo de nuevo.");
      return;
    }
    
    setLoading(true);
    try {
        const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
        await setDoc(doc(db, `artifacts/${appId}/users/${userId}/profile/info`), {
            name: regName,
            email: regEmail,
            configured: true,
            activationDate: new Date().toISOString(), // Set activation date
        }, { merge: true });
        
        setIsConfigured(true);
        setNeedsReactivation(false);
        setView('dashboard');
        setMessage("Configuración guardada. ¡Bienvenido a la aplicación!");
    } catch (error) {
        setMessage("Error al guardar la configuración: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleReactivation = async (regCode) => {
    if (regCode !== activationCode) {
        setMessage("Código de activación incorrecto. Por favor, inténtalo de nuevo.");
        return;
    }
    setLoading(true);
    try {
        const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
        const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile/info`);
        await setDoc(userRef, {
            activationDate: new Date().toISOString() // Update activation date
        }, { merge: true });
        
        setNeedsReactivation(false);
        setView('dashboard');
        setMessage("Aplicación reactivada con éxito.");
    } catch (error) {
        setMessage("Error al reactivar: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result;
            const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
            const userRef = doc(db, `artifacts/${appId}/users/${userId}/profile/info`);
            try {
                await setDoc(userRef, { logoUrl: base64String }, { merge: true });
                setLogoUrl(base64String);
                setMessage("Logo actualizado con éxito.");
            } catch (error) {
                setMessage("Error al subir el logo.");
            }
        };
        reader.readAsDataURL(file);
    }
  };


  const handleLogin = async () => {
    try {
      setLoading(true);
      if (auth) {
        if (typeof window.__initial_auth_token !== 'undefined') {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      }
    } catch (error) {
      setMessage(`Error de inicio de sesión: ${error.message}`);
      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      setAuthReady(false);
      setUser(null);
      setUserId(null);
      setView('login');
      setMessage('Sesión cerrada.');
    }
  };

  const handleFinalizePurchase = async (productosPreview, compraFecha, compraCodigo) => {
    if (productosPreview.length === 0) {
      setMessage("No hay productos en la vista previa para guardar.");
      return;
    }
    if (!compraFecha) {
      setMessage("Por favor, selecciona una fecha para la compra.");
      return;
    }
    if (!compraCodigo) {
      setMessage("Por favor, introduce un código de compra.");
      return;
    }

    setLoading(true);
    let totalPurchaseCost = 0;
    const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';

    try {
      for (const newProduct of productosPreview) {
        const { nombre, cantidad, costo, precioVenta } = newProduct;
        const q = query(collection(db, `artifacts/${appId}/users/${userId}/productos`), where("nombre", "==", nombre));
        const querySnapshot = await getDocs(q);

        const purchaseCost = cantidad * costo;
        totalPurchaseCost += purchaseCost;

        if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0].ref;
          const currentData = querySnapshot.docs[0].data();
          await setDoc(docRef, {
            ...currentData,
            cantidad: currentData.cantidad + cantidad,
            costo,
            precioVenta,
            timestamp: compraFecha,
            codigoCompra: compraCodigo
          }, { merge: true });
        } else {
          await addDoc(collection(db, `artifacts/${appId}/users/${userId}/productos`), {
            nombre,
            cantidad,
            costo,
            precioVenta,
            timestamp: compraFecha,
            codigoCompra: compraCodigo
          });
        }
      }

      const nuevoEfectivo = efectivo - totalPurchaseCost;
      await setDoc(doc(db, `artifacts/${appId}/users/${userId}/profile/info`), {
        efectivo: nuevoEfectivo,
      }, { merge: true });
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/gastos`), {
        concepto: `Compra general de productos (Código: ${compraCodigo}, Fecha: ${compraFecha})`,
        monto: totalPurchaseCost,
        timestamp: compraFecha,
        codigo: compraCodigo
      });
      setMessage('Compra registrada con éxito y efectivo actualizado.');
    } catch (error) {
      setMessage('Error al registrar la compra.');
      console.error("Error finalizing purchase:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newMaterial = {
      nombre: formData.get('nombre'),
      cantidad: parseInt(formData.get('cantidad'), 10),
      costo: parseFloat(formData.get('costo')),
      timestamp: formData.get('fecha'),
      codigo: formData.get('codigo')
    };
    const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
    try {
      setLoading(true);
      const purchaseCost = newMaterial.cantidad * newMaterial.costo;
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/materiales`), newMaterial);
      const nuevoEfectivo = efectivo - purchaseCost;
      await setDoc(doc(db, `artifacts/${appId}/users/${userId}/profile/info`), {
        efectivo: nuevoEfectivo,
      }, { merge: true });
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/gastos`), {
        concepto: `Compra de materiales: ${newMaterial.nombre}`,
        monto: purchaseCost,
        timestamp: newMaterial.timestamp,
        codigo: newMaterial.codigo
      });
      setMessage('Material agregado con éxito.');
      e.target.reset();
    } catch (error) {
      setMessage('Error al agregar material.');
      console.error("Error adding material:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePartialPayment = async (debtId, amount) => {
    const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
    try {
      setLoading(true);
      const debtRef = doc(db, `artifacts/${appId}/users/${userId}/deudas`, debtId);
      const debtSnap = await getDoc(debtRef);
      if (debtSnap.exists()) {
        const currentMonto = debtSnap.data().monto;
        const newMonto = currentMonto - amount;
        const nuevoEfectivo = efectivo + amount;
        await setDoc(doc(db, `artifacts/${appId}/users/${userId}/profile/info`), {
          efectivo: nuevoEfectivo,
        }, { merge: true });
        if (newMonto <= 0) {
          await deleteDoc(debtRef);
          setMessage(`Deuda de Bs ${currentMonto.toFixed(2)} pagada completamente.`);
        } else {
          await setDoc(debtRef, { monto: newMonto }, { merge: true });
          setMessage(`Se pagó Bs ${amount.toFixed(2)}. Restante: Bs ${newMonto.toFixed(2)}`);
        }
      }
    } catch (error) {
      setMessage('Error al registrar el pago.');
      console.error("Error processing payment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSellProduct = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const tipoVenta = formData.get('tipoVenta');
    const deudor = tipoVenta === 'credito' ? formData.get('deudor') : null;
    const fechaVenta = formData.get('fechaVenta');
    let totalVenta = 0;
    const productosVendidos = [];
    const productosEnInventario = new Map(productos.map(p => [p.nombre, p]));
    const nombres = formData.getAll('producto_nombre');
    const cantidades = formData.getAll('producto_cantidad');
    const precios = formData.getAll('precioVenta');
    const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';

    for (let i = 0; i < nombres.length; i++) {
      const nombre = nombres[i];
      const cantidad = parseInt(cantidades[i], 10);
      const precioVenta = parseFloat(precios[i]);
      if (nombre && cantidad > 0) {
        const product = productosEnInventario.get(nombre);
        if (product && product.cantidad >= cantidad) {
          totalVenta += precioVenta * cantidad;
          productosVendidos.push({ nombre, cantidad, precioVenta, costo: product.costo });
          const docRef = doc(db, `artifacts/${appId}/users/${userId}/productos`, product.id);
          await setDoc(docRef, {
            ...product,
            cantidad: product.cantidad - cantidad
          }, { merge: true });
        } else {
          setMessage(`Error: No hay suficiente stock para ${nombre}.`);
          setLoading(false);
          return;
        }
      }
    }
    if (totalVenta === 0) {
      setMessage('Error: No se seleccionó ningún producto para la venta.');
      setLoading(false);
      return;
    }
    try {
      const esCredito = tipoVenta === 'credito' && deudor && deudor.trim() !== '';
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/ventas`), {
        productosVendidos,
        precioVentaTotal: totalVenta,
        gananciaTotal: productosVendidos.reduce((sum, item) => sum + (item.precioVenta - item.costo) * item.cantidad, 0),
        timestamp: fechaVenta || new Date().toISOString(),
        codigo: '104 Ingresos por amortizaciones',
        tipo: esCredito ? 'Crédito' : 'Efectivo',
        deudor: esCredito ? deudor : null
      });
      if (!esCredito) {
        const nuevoEfectivo = efectivo + totalVenta;
        await setDoc(doc(db, `artifacts/${appId}/users/${userId}/profile/info`), {
          efectivo: nuevoEfectivo,
        }, { merge: true });
        setMessage('Venta registrada y efectivo actualizado.');
      } else {
        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/deudas`), {
          deudor: deudor,
          monto: totalVenta,
          fechaVencimiento: '',
          timestamp: new Date().toISOString(),
          esVenta: true,
          productosVendidos
        });
        setMessage('Venta registrada como deuda.');
      }
      e.target.reset();
    } catch (error) {
      setMessage('Error al registrar la venta.');
      console.error("Error recording sale:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleAddCapital = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const monto = parseFloat(formData.get('monto'));
    const nombre = formData.get('nombre');
    const concepto = formData.get('concepto');
    const organizacion = formData.get('organizacion');
    const fecha = formData.get('fecha');
    const codigo = formData.get('codigo');
    const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
    try {
      setLoading(true);
      const nuevoCapital = capitalInicial + monto;
      const nuevoEfectivo = efectivo + monto;
      await setDoc(doc(db, `artifacts/${appId}/users/${userId}/profile/info`), {
        capitalInicial: nuevoCapital,
        efectivo: nuevoEfectivo,
      }, { merge: true });
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/capital_injections`), {
        monto,
        nombre,
        concepto,
        organizacion,
        timestamp: fecha || new Date().toISOString(),
        codigo
      });
      setMessage('Inyección de capital registrada con éxito.');
      e.target.reset();
    } catch (error) {
      setMessage('Error al registrar la inyección de capital.');
      console.error("Error recording capital injection:", error);
    } finally {
      setLoading(false);
    }
  };


  const handleAddGasto = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newGasto = {
      concepto: formData.get('concepto'),
      monto: parseFloat(formData.get('monto')),
      timestamp: formData.get('fecha') || new Date().toISOString(),
      codigo: formData.get('codigo')
    };
    const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
    try {
      setLoading(true);
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/gastos`), newGasto);
      const nuevoEfectivo = efectivo - newGasto.monto;
      await setDoc(doc(db, `artifacts/${appId}/users/${userId}/profile/info`), {
        efectivo: nuevoEfectivo,
      }, { merge: true });
      setMessage('Gasto registrado con éxito y efectivo actualizado.');
      e.target.reset();
    } catch (error) {
      setMessage('Error al registrar gasto.');
      console.error("Error adding expense:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuscripcion = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newSubscription = {
        nombre: formData.get('nombre'),
        montoPagado: parseFloat(formData.get('montoPagado')),
        codigo: formData.get('codigo'),
        fechaInscripcion: formData.get('fechaInscripcion') || new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
    };
    const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
    try {
        setLoading(true);
        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/suscripciones`), newSubscription);

        const nuevoEfectivo = efectivo + newSubscription.montoPagado;
        await setDoc(doc(db, `artifacts/${appId}/users/${userId}/profile/info`), {
            efectivo: nuevoEfectivo,
        }, { merge: true });

        setMessage('Suscripción registrada con éxito y efectivo actualizado.');
        e.target.reset();
    } catch (error) {
        setMessage('Error al registrar la suscripción.');
        console.error("Error adding subscription:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteItem = async (collectionName, item) => {
    setLoading(true);
    const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
    try {
        const itemRef = doc(db, `artifacts/${appId}/users/${userId}/${collectionName}`, item.id);
        const profileRef = doc(db, `artifacts/${appId}/users/${userId}/profile/info`);

        switch (collectionName) {
            case 'suscripciones':
                await setDoc(profileRef, { efectivo: efectivo - item.montoPagado }, { merge: true });
                break;
            case 'gastos':
                await setDoc(profileRef, { efectivo: efectivo + item.monto }, { merge: true });
                break;
            case 'capital_injections':
                await setDoc(profileRef, {
                    efectivo: efectivo - item.monto,
                    capitalInicial: capitalInicial - item.monto
                }, { merge: true });
                break;
            default:
                break;
        }

        await deleteDoc(itemRef);
        setMessage('Registro eliminado con éxito.');
    } catch (error) {
        setMessage('Error al eliminar el registro.');
        console.error("Error deleting item:", error);
    } finally {
        setLoading(false);
    }
};

  const handleSaveQuarterlyReport = async (isSilent = false, reportId) => {
    if (!isSilent) setLoading(true);
    const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
    
    const reportData = {
        capitalInicial, efectivo, valorInventario, valorMateriales, totalPorCobrar, totalGastos,
        totalVentasIngresos, totalCostosDeVenta, productos, materiales, deudas, ventas, gastos,
        inyeccionesCapital, suscripciones, createdAt: new Date().toISOString()
    };

    try {
        const reportRef = doc(db, `artifacts/${appId}/users/${userId}/reportes_trimestrales`, reportId);
        await setDoc(reportRef, reportData);
        if (!isSilent) setMessage(`Reporte para ${reportId} guardado con éxito.`);
    } catch (error) {
        if (!isSilent) setMessage('Error al guardar el reporte trimestral.');
        console.error("Error saving quarterly report:", error);
    } finally {
        if (!isSilent) setLoading(false);
    }
  };

  const handleViewReport = (reportData) => {
    setSelectedReport(reportData);
    setView('viewReport');
  };

  // Nuevos cálculos de resumen financiero
  const totalActivos = efectivo + valorInventario + valorMateriales + totalPorCobrar;
  const valorNeto = capitalInicial + (totalVentasIngresos - totalCostosDeVenta - totalGastos);
  const resultadoDelPeriodo = totalVentasIngresos - totalCostosDeVenta - totalGastos;

  const renderView = () => {
    if (!authReady) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
            <h1 className="text-3xl font-bold mb-4">Cargando...</h1>
            <p>Iniciando la aplicación.</p>
          </div>
        </div>
      );
    }
    if (view === 'login') {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-pulperia-bg-light text-pulperia-text-light">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
            <img src={logoUrl} alt="Logo" className="w-32 h-32 mx-auto mb-4 rounded-full object-cover" />
            <h1 className="text-3xl font-bold text-gray-900">Ministerio Heme Aquí</h1>
            <p className="text-lg font-semibold text-gray-600 mb-6">PULPERIA COMUNITARIA BENIGNO</p>
            <button
              onClick={handleLogin}
              className="w-full bg-pulperia-primary text-white p-3 rounded-lg shadow-md hover:bg-pulperia-primary-dark transition-colors"
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
            {message && <p className="mt-4 text-sm text-red-500">{message}</p>}
          </div>
        </div>
      );
    }

    if (view === 'configuracion' || needsReactivation) {
      return <Ajustes 
                isConfigured={isConfigured} 
                profileData={profileData}
                handleRegister={handleRegister} 
                handleReactivation={handleReactivation}
                quarterlyReports={quarterlyReports}
                onBack={() => setView('dashboard')}
                onViewReport={handleViewReport}
                loading={loading} 
                message={message} 
                needsReactivation={needsReactivation}
                handleLogoUpload={handleLogoUpload}
             />;
    }
    
    if (view === 'viewReport') {
        return (
            <div className="min-h-screen bg-pulperia-bg-light text-pulperia-text-light">
                <main className="container mx-auto p-4 sm:p-8">
                    <button onClick={() => setView('configuracion')}  className="mb-8 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-md hover:bg-gray-300 transition-colors no-print">
                        &larr; Volver a Ajustes
                    </button>
                    <Reportes 
                        isHistorical={true}
                        capitalInicial={selectedReport.capitalInicial}
                        efectivo={selectedReport.efectivo}
                        valorInventario={selectedReport.valorInventario}
                        valorMateriales={selectedReport.valorMateriales}
                        totalPorCobrar={selectedReport.totalPorCobrar}
                        totalActivos={selectedReport.efectivo + selectedReport.valorInventario + selectedReport.valorMateriales + selectedReport.totalPorCobrar}
                        productos={selectedReport.productos}
                        materiales={selectedReport.materiales}
                        deudas={selectedReport.deudas}
                        ventas={selectedReport.ventas}
                        gastos={selectedReport.gastos}
                        inyeccionesCapital={selectedReport.inyeccionesCapital}
                        suscripciones={selectedReport.suscripciones}
                    />
                </main>
            </div>
        );
    }


    return (
      <div className="min-h-screen bg-pulperia-bg-light text-pulperia-text-light">
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm shadow-sm no-print">
            <div className="container mx-auto flex justify-between items-center p-4">
                <div className="flex items-center space-x-4">
                <img src={logoUrl} alt="Logo" className="w-12 h-12 rounded-full shadow-lg object-cover" />
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-pulperia-accent">Ministerio Heme Aquí</h1>
                    <p className="text-sm font-semibold text-gray-500">PULPERIA COMUNITARIA BENIGNO</p>
                </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition-colors"
                >
                    Salir
                </button>
            </div>
        </header>
        
        <main className="container mx-auto p-4 sm:p-8">
          <div className="flex flex-wrap gap-2 mb-8 justify-center sm:justify-start no-print">
            <NavButton text="Resumen" onClick={() => setView('dashboard')} currentView={view} target="dashboard" />
            <NavButton text="Inventario" onClick={() => setView('inventario')} currentView={view} target="inventario" />
            <NavButton text="Materiales" onClick={() => setView('materiales')} currentView={view} target="materiales" />
            <NavButton text="Suscripciones" onClick={() => setView('suscripciones')} currentView={view} target="suscripciones" />
            <NavButton text="Deudas" onClick={() => setView('deudas')} currentView={view} target="deudas" />
            <NavButton text="Capital" onClick={() => setView('capital')} currentView={view} target="capital" />
            <NavButton text="Ventas" onClick={() => setView('ventas')} currentView={view} target="ventas" />
            <NavButton text="Ganancias" onClick={() => setView('ganancias')} currentView={view} target="ganancias" />
            <NavButton text="Gastos" onClick={() => setView('gastos')} currentView={view} target="gastos" />
            <NavButton text="Reportes" onClick={() => setView('reportes')} currentView={view} target="reportes" />
            <NavButton text="Ajustes" onClick={() => setView('configuracion')} currentView={view} target="configuracion" />
          </div>
          <div className="no-print">
            {message && <div className="p-3 mb-4 rounded-lg bg-green-200 text-green-800 shadow-md">{message}</div>}
          </div>
          
          {/* Vistas condicionales */}
          {view === 'dashboard' && <Dashboard efectivo={efectivo} totalActivos={totalActivos} totalPorCobrar={totalPorCobrar} valorInventario={valorInventario + valorMateriales} />}
          {view === 'inventario' && <Inventario productos={productos} productosBase={productosBase} setProductosBase={setProductosBase} loading={loading} handleFinalizePurchase={handleFinalizePurchase} handleDeleteProducto={(p) => handleDeleteItem('productos', p)} />}
          {view === 'materiales' && <Materiales materiales={materiales} handleAddMaterial={handleAddMaterial} loading={loading} handleDeleteMaterial={(m) => handleDeleteItem('materiales', m)} />}
          {view === 'deudas' && <Deudas deudas={deudas} handlePartialPayment={handlePartialPayment} loading={loading} handleDeleteDeuda={(d) => handleDeleteItem('deudas', d)} />}
          {view === 'capital' && <Capital inyeccionesCapital={inyeccionesCapital} handleAddCapital={handleAddCapital} loading={loading} handleDeleteCapital={(c) => handleDeleteItem('capital_injections', c)} />}
          {view === 'ventas' && <Ventas productos={productos} productosBase={productosBase} handleSellProduct={handleSellProduct} loading={loading} suscritosNombres={suscritosNombres} />}
          {view === 'ganancias' && <Ganancias ventas={ventas} productos={productos} />}
          {view === 'gastos' && <Gastos gastos={gastos} handleAddGasto={handleAddGasto} loading={loading} handleDeleteGasto={(g) => handleDeleteItem('gastos', g)} />}
          {view === 'suscripciones' && <Suscripciones suscripciones={suscripciones} handleAddSuscripcion={handleAddSuscripcion} loading={loading} handleDeleteSuscripcion={(s) => handleDeleteItem('suscripciones', s)} />}
          {view === 'reportes' && <Reportes isHistorical={false} capitalInicial={capitalInicial} efectivo={efectivo} valorInventario={valorInventario} valorMateriales={valorMateriales} totalPorCobrar={totalPorCobrar} totalActivos={totalActivos} valorNeto={valorNeto} resultadoDelPeriodo={resultadoDelPeriodo} productos={productos} materiales={materiales} deudas={deudas} ventas={ventas} gastos={gastos} inyeccionesCapital={inyeccionesCapital} suscripciones={suscripciones} />}
        </main>
      </div>
    );
  };
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .bg-pulperia-bg-light { background-color: #f7f9f3; }
        .text-pulperia-text-light { color: #2e3d31; }
        .bg-pulperia-card-light { background-color: #ffffff; }
        .bg-pulperia-primary { background-color: #6c9a75; }
        .hover\\:bg-pulperia-primary-dark:hover { background-color: #5b8764; }
        .text-pulperia-accent { color: #6c9a75; }
        .text-pulperia-primary { color: #6c9a75; }
        .form-radio { color: #6c9a75; }
        @media print {
            .no-print {
                display: none !important;
            }
            body {
                background-color: #fff !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            main {
                padding: 0 !important;
                margin: 0 !important;
            }
            #report-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 1rem;
                box-shadow: none !important;
                border: none !important;
            }
        }
      `}</style>
      <div>
        {renderView()}
      </div>
    </>
  );
};
export default App;
