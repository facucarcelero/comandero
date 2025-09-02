import React, { useState, useEffect } from 'react';
import { usePedidoSelectors, usePedidoActions, useCreateOrden, useValidatePedido } from '../store/usePedidoStore';
import { api } from '../lib/api';
import type { Producto } from '../types/global';
import PedidoActual from '../components/PedidoActual';
import Swal from 'sweetalert2';

const Inicio: React.FC = () => {
  console.log('🏠 Inicio component rendering...');
  
  const { items, mesa, cliente, observaciones, total, hasItems } = usePedidoSelectors();
  const { addItem, setMesa, setCliente, setObservaciones, clearPedido, setLoading, setError } = usePedidoActions();
  const createOrden = useCreateOrden();
  const validatePedido = useValidatePedido();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [cajaAbierta, setCajaAbierta] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [productosData, estadoCaja] = await Promise.all([
        api.getProductos({ activo: true }),
        api.getEstadoCaja()
      ]);
      
      setProductos(productosData);
      setCajaAbierta(!!estadoCaja);
      
      // Extraer categorías únicas
      const categoriasUnicas = [...new Set(productosData.map(p => p.categoria))].filter(Boolean);
      setCategorias(categoriasUnicas);
      
      if (categoriasUnicas.length > 0) {
        setCategoriaSeleccionada(categoriasUnicas[0]);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductoClick = (producto: Producto) => {
    if (!cajaAbierta) {
      Swal.fire({
        icon: 'warning',
        title: 'Caja cerrada',
        text: 'Debe abrir la caja antes de tomar pedidos',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (producto.stock <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin stock',
        text: 'Este producto no tiene stock disponible',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    addItem(producto);
  };

  const handleImprimirComanda = async () => {
    if (!hasItems) {
      Swal.fire({
        icon: 'warning',
        title: 'Pedido vacío',
        text: 'Debe agregar items al pedido antes de imprimir',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const validation = validatePedido();
    if (!validation.isValid) {
      Swal.fire({
        icon: 'error',
        title: 'Pedido incompleto',
        text: validation.errors.join(', '),
        confirmButtonText: 'Entendido'
      });
      return;
    }

    try {
      setLoading(true);
      const orden = createOrden();
      const ordenCreada = await api.createOrden(orden);
      
      // Imprimir comanda de cocina
      const printSuccess = await api.printKitchenTicket(ordenCreada);
      
      if (printSuccess) {
        Swal.fire({
          icon: 'success',
          title: 'Comanda enviada',
          text: 'La comanda se ha enviado a cocina correctamente',
          confirmButtonText: 'Entendido'
        });
        
        // Limpiar pedido después de imprimir
        clearPedido();
      } else {
        throw new Error('Error al imprimir la comanda');
      }
    } catch (error) {
      console.error('Error al imprimir comanda:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo imprimir la comanda',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCobrar = async () => {
    if (!hasItems) {
      Swal.fire({
        icon: 'warning',
        title: 'Pedido vacío',
        text: 'Debe agregar items al pedido antes de cobrar',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const validation = validatePedido();
    if (!validation.isValid) {
      Swal.fire({
        icon: 'error',
        title: 'Pedido incompleto',
        text: validation.errors.join(', '),
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Mostrar modal de pago
    const { value: metodoPago } = await Swal.fire({
      title: 'Método de Pago',
      input: 'select',
      inputOptions: {
        efectivo: 'Efectivo',
        tarjeta: 'Tarjeta',
        transferencia: 'Transferencia'
      },
      inputPlaceholder: 'Seleccione método de pago',
      showCancelButton: true,
      confirmButtonText: 'Cobrar',
      cancelButtonText: 'Cancelar'
    });

    if (!metodoPago) return;

    try {
      setLoading(true);
      const orden = createOrden();
      const ordenCreada = await api.createOrden(orden);
      
      // Agregar pago
      await api.addPago({
        orden_id: ordenCreada.id!,
        metodo: metodoPago,
        monto: total
      });

      // Imprimir ticket
      const ordenCompleta = await api.getOrden(ordenCreada.id!);
      const printSuccess = await api.printTicket(ordenCompleta!);
      
      if (printSuccess) {
        Swal.fire({
          icon: 'success',
          title: 'Pago procesado',
          text: 'El pago se ha procesado correctamente',
          confirmButtonText: 'Entendido'
        });
        
        // Limpiar pedido después del pago
        clearPedido();
      } else {
        throw new Error('Error al imprimir el ticket');
      }
    } catch (error) {
      console.error('Error al procesar pago:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo procesar el pago',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos
  const productosFiltrados = productos.filter(producto => {
    const matchesCategoria = !categoriaSeleccionada || producto.categoria === categoriaSeleccionada;
    const matchesBusqueda = !busqueda || producto.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchesCategoria && matchesBusqueda && producto.activo;
  });

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="row">
      {/* Columna izquierda - Productos */}
      <div className="col-lg-8">
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="bi bi-grid me-2"></i>
              Productos
            </h5>
          </div>
          <div className="card-body">
            {/* Filtros */}
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Categoría</label>
                <select
                  className="form-select"
                  value={categoriaSeleccionada}
                  onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map(categoria => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Buscar producto</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombre del producto..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            </div>

            {/* Grid de productos */}
            <div className="productos-grid">
              {productosFiltrados.map(producto => (
                <div
                  key={producto.id}
                  className={`producto-card ${producto.stock <= 0 ? 'disabled' : ''}`}
                  onClick={() => handleProductoClick(producto)}
                >
                  <div className="producto-nombre">{producto.nombre}</div>
                  <div className="producto-precio">${producto.precio.toLocaleString()}</div>
                  <div className="producto-categoria">{producto.categoria}</div>
                  <div className={`producto-stock ${producto.stock <= 0 ? 'text-danger' : ''}`}>
                    Stock: {producto.stock}
                  </div>
                </div>
              ))}
            </div>

            {productosFiltrados.length === 0 && (
              <div className="text-center text-muted py-4">
                <i className="bi bi-search display-4 mb-3"></i>
                <h5>No se encontraron productos</h5>
                <p>Intenta con otros filtros de búsqueda</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Columna derecha - Pedido actual */}
      <div className="col-lg-4">
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="bi bi-cart me-2"></i>
              Pedido Actual
            </h5>
          </div>
          <div className="card-body">
            {/* Información del pedido */}
            <div className="mb-3">
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label">Mesa</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Número de mesa"
                    value={mesa}
                    onChange={(e) => setMesa(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">Cliente</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Nombre del cliente"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-2">
                <label className="form-label">Observaciones</label>
                <textarea
                  className="form-control form-control-sm"
                  rows={2}
                  placeholder="Observaciones del pedido..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>
            </div>

            {/* Componente del pedido actual */}
            <PedidoActual />

            {/* Botones de acción */}
            {hasItems && (
              <div className="d-grid gap-2 mt-3">
                <button
                  className="btn btn-primary"
                  onClick={handleImprimirComanda}
                  disabled={!cajaAbierta}
                >
                  <i className="bi bi-printer me-2"></i>
                  Imprimir Comanda
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleCobrar}
                  disabled={!cajaAbierta}
                >
                  <i className="bi bi-credit-card me-2"></i>
                  Cobrar
                </button>
              </div>
            )}

            {!cajaAbierta && (
              <div className="alert alert-warning mt-3">
                <i className="bi bi-exclamation-triangle me-2"></i>
                La caja está cerrada. Abra la caja para tomar pedidos.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inicio;
