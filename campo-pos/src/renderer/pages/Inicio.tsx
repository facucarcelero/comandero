import React, { useState, useEffect } from 'react';
import { usePedidoSelectors, usePedidoActions, useCreateOrden, useValidatePedido } from '../store/usePedidoStore';
import { useAppStore } from '../store/useAppStore';
import { api, METODOS_PAGO } from '../lib/api';
import type { Producto } from '../types/global';
import PedidoActual from '../components/PedidoActual';
import Swal from 'sweetalert2';

const Inicio: React.FC = () => {
  
  const { total, hasItems } = usePedidoSelectors();
  const { addItem, clearPedido, setLoading } = usePedidoActions();
  const createOrden = useCreateOrden();
  const validatePedido = useValidatePedido();

  // Usar el store centralizado solo para obtener datos
  const { products, cash, config, forceSync } = useAppStore(state => ({
    products: state.products,
    cash: state.cash,
    config: state.config,
    forceSync: state.forceSync
  }));

  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');
  const [mostrandoCategorias, setMostrandoCategorias] = useState<boolean>(true);

  // Extraer categorías únicas cuando cambien los productos
  useEffect(() => {
    const categoriasUnicas = [...new Set(products.map(p => p.categoria))].filter(Boolean);
    setCategorias(categoriasUnicas);
    if (categoriasUnicas.length > 0 && !categoriaSeleccionada) {
      setCategoriaSeleccionada('Todas las categorías');
    }
  }, [products, categoriaSeleccionada]);

  const handleCategoriaClick = (categoria: string) => {
    setCategoriaSeleccionada(categoria);
    setMostrandoCategorias(false);
    setBusqueda(''); // Limpiar búsqueda al cambiar categoría
  };

  const handleVolverCategorias = () => {
    setMostrandoCategorias(true);
    setCategoriaSeleccionada('');
    setBusqueda('');
  };

  const handleProductoClick = (producto: Producto) => {
    if (cash?.estado !== 'abierta') {
      Swal.fire({
        icon: 'warning',
        title: 'Caja cerrada',
        text: 'Debe abrir la caja antes de agregar productos',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (producto.id) {
      addItem({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        categoria: producto.categoria
      });
    }
  };

  const handleImprimirComanda = async () => {
    if (!hasItems) {
      Swal.fire({
        icon: 'warning',
        title: 'Pedido vacío',
        text: 'Debe agregar al menos un producto al pedido',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const validation = validatePedido();
    if (!validation.isValid) {
      Swal.fire({
        icon: 'error',
        title: 'Pedido incompleto',
        text: validation.errors.join('\n'),
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
        // Recargar datos para actualizar stock
        await forceSync();
      } else {
        throw new Error('Error al imprimir la comanda');
      }
    } catch (error) {
      console.error('Error al imprimir comanda:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo enviar la comanda a cocina',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePagar = async () => {
    if (!hasItems) {
      Swal.fire({
        icon: 'warning',
        title: 'Pedido vacío',
        text: 'Debe agregar al menos un producto al pedido',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const validation = validatePedido();
    if (!validation.isValid) {
      Swal.fire({
        icon: 'error',
        title: 'Pedido incompleto',
        text: validation.errors.join('\n'),
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const { value: metodoPago } = await Swal.fire({
      title: 'Seleccionar método de pago',
      input: 'select',
      inputOptions: Object.fromEntries(
        Object.entries(METODOS_PAGO).map(([, value]) => [value, value])
      ),
      inputValidator: (value) => {
        if (!value) {
          return 'Debe seleccionar un método de pago';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Procesar pago',
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
        // Recargar datos para actualizar stock
        await forceSync();
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
  const productosFiltrados = products.filter(producto => {
    const matchesCategoria = categoriaSeleccionada === 'Todas las categorías' || producto.categoria === categoriaSeleccionada;
    const matchesBusqueda = !busqueda || producto.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchesCategoria && matchesBusqueda && producto.activo;
  });

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Panel de productos */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-grid me-2"></i>
                {mostrandoCategorias ? 'Categorías' : `Productos - ${categoriaSeleccionada} (${productosFiltrados.length})`}
              </h5>
              {!mostrandoCategorias && (
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleVolverCategorias}
                >
                  <i className="bi bi-arrow-left me-1"></i>
                  Volver a categorías
                </button>
              )}
            </div>
            <div className="card-body">
              {mostrandoCategorias ? (
                // Vista de categorías
                <div className="row g-3">
                  {categorias.map(categoria => {
                    const productosEnCategoria = products.filter(p => p.categoria === categoria);
                    return (
                      <div key={categoria} className="col-md-6 col-lg-4">
                        <div
                          className="card h-100 cursor-pointer"
                          onClick={() => handleCategoriaClick(categoria)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="card-body text-center">
                            <i className="bi bi-tag text-success" style={{ fontSize: '2rem' }}></i>
                            <h6 className="card-title mt-2">{categoria}</h6>
                            <p className="card-text text-muted">
                              {productosEnCategoria.length} productos
                            </p>
                            <span className="badge bg-success">
                              {productosEnCategoria.length} items
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Vista de productos
                <>
                  {/* Filtros */}
                  <div className="row mb-3">
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
                  <div className="row g-3">
                    {productosFiltrados.map(producto => (
                      <div key={producto.id} className="col-md-4 col-lg-3">
                        <div
                          className={`card h-100 ${producto.stock <= 0 ? 'opacity-50' : 'cursor-pointer'}`}
                          onClick={() => handleProductoClick(producto)}
                          style={{ cursor: producto.stock > 0 ? 'pointer' : 'not-allowed' }}
                        >
                          <div className="card-body text-center">
                            <h6 className="card-title">{producto.nombre}</h6>
                            <p className="card-text text-success fw-bold">
                              {config.currencySymbol}{producto.precio.toLocaleString()}
                            </p>
                            <small className="text-muted">
                              {producto.categoria}
                            </small>
                            <br />
                            <small className="text-muted">
                              Stock: {producto.stock}
                            </small>
                          </div>
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
                </>
              )}
            </div>
          </div>
        </div>

        {/* Panel de pedido actual */}
        <div className="col-lg-4">
          <PedidoActual 
            onImprimirComanda={handleImprimirComanda}
            onPagar={handlePagar}
          />
        </div>
      </div>
    </div>
  );
};

export default Inicio;