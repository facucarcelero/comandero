import React, { useState, useEffect } from 'react';
import { api, Orden } from '../lib/api';
import { formatCurrency, formatDate, formatStatus } from '../lib/format';
import Swal from 'sweetalert2';

const Pedidos: React.FC = () => {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    estado: '',
    fecha_desde: '',
    fecha_hasta: '',
    mesa: ''
  });
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<Orden | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadOrdenes();
  }, []);

  const loadOrdenes = async () => {
    try {
      setIsLoading(true);
      const data = await api.getOrdenes(filtros);
      setOrdenes(data);
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las órdenes',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrdenes();
  }, [filtros]);

  const handleVerDetalle = async (orden: Orden) => {
    try {
      const ordenCompleta = await api.getOrden(orden.id!);
      setOrdenSeleccionada(ordenCompleta);
      setShowModal(true);
    } catch (error) {
      console.error('Error al cargar detalle de orden:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar el detalle de la orden',
        confirmButtonText: 'Entendido'
      });
    }
  };

  const handleCambiarEstado = async (orden: Orden, nuevoEstado: string) => {
    const result = await Swal.fire({
      title: 'Cambiar estado',
      text: `¿Cambiar el estado de la orden #${orden.id} a "${formatStatus(nuevoEstado)}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.updateEstadoOrden(orden.id!, nuevoEstado);
        Swal.fire({
          icon: 'success',
          title: 'Estado actualizado',
          text: 'El estado de la orden se ha actualizado correctamente',
          confirmButtonText: 'Entendido'
        });
        loadOrdenes();
      } catch (error) {
        console.error('Error al actualizar estado:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el estado de la orden',
          confirmButtonText: 'Entendido'
        });
      }
    }
  };

  const handleReimprimirTicket = async (orden: Orden) => {
    try {
      const ordenCompleta = await api.getOrden(orden.id!);
      const success = await api.printTicket(ordenCompleta!);
      
      if (success) {
        Swal.fire({
          icon: 'success',
          title: 'Ticket reimpreso',
          text: 'El ticket se ha reimpreso correctamente',
          confirmButtonText: 'Entendido'
        });
      } else {
        throw new Error('Error al imprimir');
      }
    } catch (error) {
      console.error('Error al reimprimir ticket:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo reimprimir el ticket',
        confirmButtonText: 'Entendido'
      });
    }
  };

  const handleReimprimirComanda = async (orden: Orden) => {
    try {
      const ordenCompleta = await api.getOrden(orden.id!);
      const success = await api.printKitchenTicket(ordenCompleta!);
      
      if (success) {
        Swal.fire({
          icon: 'success',
          title: 'Comanda reimpresa',
          text: 'La comanda se ha reimpreso correctamente',
          confirmButtonText: 'Entendido'
        });
      } else {
        throw new Error('Error al imprimir');
      }
    } catch (error) {
      console.error('Error al reimprimir comanda:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo reimprimir la comanda',
        confirmButtonText: 'Entendido'
      });
    }
  };

  const getEstadoBadgeClass = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-warning';
      case 'completado':
        return 'bg-success';
      case 'cancelado':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  const getFechaHoy = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getFechaAyer = () => {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    return ayer.toISOString().split('T')[0];
  };

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
    <div>
      {/* Header */}
      <div className="header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1>Pedidos</h1>
            <p className="text-muted mb-0">Historial de órdenes</p>
          </div>
          <div>
            <button
              className="btn btn-primary"
              onClick={loadOrdenes}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Estado</label>
              <select
                className="form-select"
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Fecha desde</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fecha_desde}
                onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Fecha hasta</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fecha_hasta}
                onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Mesa</label>
              <input
                type="text"
                className="form-control"
                placeholder="Número de mesa"
                value={filtros.mesa}
                onChange={(e) => setFiltros({ ...filtros, mesa: e.target.value })}
              />
            </div>
          </div>
          <div className="row g-2 mt-2">
            <div className="col-auto">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => setFiltros({ ...filtros, fecha_desde: getFechaHoy(), fecha_hasta: getFechaHoy() })}
              >
                Hoy
              </button>
            </div>
            <div className="col-auto">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => setFiltros({ ...filtros, fecha_desde: getFechaAyer(), fecha_hasta: getFechaAyer() })}
              >
                Ayer
              </button>
            </div>
            <div className="col-auto">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setFiltros({ estado: '', fecha_desde: '', fecha_hasta: '', mesa: '' })}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de órdenes */}
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Mesa</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ordenes.map(orden => (
                  <tr key={orden.id}>
                    <td>
                      <span className="fw-bold">#{orden.id}</span>
                    </td>
                    <td>
                      <div>
                        <div>{formatDate(orden.fecha!)}</div>
                        <small className="text-muted">
                          {new Date(orden.fecha!).toLocaleTimeString()}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-info">
                        {orden.mesa || 'S/N'}
                      </span>
                    </td>
                    <td>{orden.cliente || 'Cliente general'}</td>
                    <td>
                      <span className={`badge ${getEstadoBadgeClass(orden.estado)}`}>
                        {formatStatus(orden.estado)}
                      </span>
                    </td>
                    <td>
                      <span className="fw-bold text-success">
                        {formatCurrency(orden.total)}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => handleVerDetalle(orden)}
                          title="Ver detalle"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        {orden.estado === 'pendiente' && (
                          <button
                            className="btn btn-outline-success btn-sm"
                            onClick={() => handleCambiarEstado(orden, 'completado')}
                            title="Marcar como completado"
                          >
                            <i className="bi bi-check"></i>
                          </button>
                        )}
                        {orden.estado === 'pendiente' && (
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleCambiarEstado(orden, 'cancelado')}
                            title="Cancelar orden"
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => handleReimprimirTicket(orden)}
                          title="Reimprimir ticket"
                        >
                          <i className="bi bi-printer"></i>
                        </button>
                        <button
                          className="btn btn-outline-warning btn-sm"
                          onClick={() => handleReimprimirComanda(orden)}
                          title="Reimprimir comanda"
                        >
                          <i className="bi bi-receipt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {ordenes.length === 0 && (
            <div className="text-center text-muted py-4">
              <i className="bi bi-receipt display-4 mb-3"></i>
              <h5>No se encontraron órdenes</h5>
              <p>Intenta con otros filtros de búsqueda</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalle de orden */}
      {showModal && ordenSeleccionada && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Detalle de Orden #{ordenSeleccionada.id}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Fecha:</strong> {formatDate(ordenSeleccionada.fecha!)}
                  </div>
                  <div className="col-md-6">
                    <strong>Mesa:</strong> {ordenSeleccionada.mesa || 'S/N'}
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Cliente:</strong> {ordenSeleccionada.cliente || 'Cliente general'}
                  </div>
                  <div className="col-md-6">
                    <strong>Estado:</strong> 
                    <span className={`badge ${getEstadoBadgeClass(ordenSeleccionada.estado)} ms-2`}>
                      {formatStatus(ordenSeleccionada.estado)}
                    </span>
                  </div>
                </div>

                {ordenSeleccionada.observaciones && (
                  <div className="mb-3">
                    <strong>Observaciones:</strong>
                    <p className="mt-1">{ordenSeleccionada.observaciones}</p>
                  </div>
                )}

                <h6>Items del pedido:</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordenSeleccionada.items?.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div>{item.nombre}</div>
                            {item.observaciones && (
                              <small className="text-muted">
                                Obs: {item.observaciones}
                              </small>
                            )}
                          </td>
                          <td>{item.cantidad}</td>
                          <td>{formatCurrency(item.precio)}</td>
                          <td>{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="row mt-3">
                  <div className="col-md-6">
                    <div className="d-flex justify-content-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(ordenSeleccionada.subtotal)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>IVA:</span>
                      <span>{formatCurrency(ordenSeleccionada.iva)}</span>
                    </div>
                    <div className="d-flex justify-content-between fw-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(ordenSeleccionada.total)}</span>
                    </div>
                  </div>
                </div>

                {ordenSeleccionada.pagos && ordenSeleccionada.pagos.length > 0 && (
                  <div className="mt-3">
                    <h6>Pagos:</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Método</th>
                            <th>Monto</th>
                            <th>Fecha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ordenSeleccionada.pagos.map((pago, index) => (
                            <tr key={index}>
                              <td>{pago.metodo.toUpperCase()}</td>
                              <td>{formatCurrency(pago.monto)}</td>
                              <td>{formatDate(pago.fecha!)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleReimprimirTicket(ordenSeleccionada)}
                >
                  <i className="bi bi-printer me-2"></i>
                  Reimprimir Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pedidos;
