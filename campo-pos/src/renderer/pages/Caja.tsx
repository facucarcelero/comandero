import React, { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatDate, formatTime } from '../lib/format';
import { api } from '../lib/api';
import Swal from 'sweetalert2';



const CajaPage: React.FC = () => {
  // Usar el store centralizado
  const { cash, openCash, closeCash, config, resumen, loadResumenDia } = useAppStore(state => ({
    cash: state.cash,
    openCash: state.openCash,
    closeCash: state.closeCash,
    config: state.config,
    resumen: state.resumen,
    loadResumenDia: state.loadResumenDia
  }));

  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [showCerrarModal, setShowCerrarModal] = useState(false);
  const [showHistorialModal, setShowHistorialModal] = useState(false);
  const [historialCajas, setHistorialCajas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    monto_inicial: 0,
    responsable: '',
    monto_final: 0,
    observaciones: ''
  });

  const [efectivoReal, setEfectivoReal] = useState({
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0
  });

  // Cargar resumen del día cuando la caja está abierta
  useEffect(() => {
    if (cash && cash.estado === 'abierta') {
      loadResumenDia();
    }
  }, [cash, loadResumenDia]);



  const loadHistorialCajas = async () => {
    try {
      setIsLoading(true);
      // Cargar historial de cajas de los últimos 30 días
      const fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - 30);
      
      const historial = await api.getHistorialCajas(
        fechaInicio.toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      );
      
      setHistorialCajas(historial || []);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbrirCaja = useCallback(async () => {
    if (!formData.responsable.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'El nombre del responsable es obligatorio',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (formData.monto_inicial < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Monto inválido',
        text: 'El monto inicial no puede ser negativo',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    try {
      await openCash({
        responsable: formData.responsable,
        monto_inicial: formData.monto_inicial,
        fecha_apertura: new Date().toISOString()
      });

      Swal.fire({
        icon: 'success',
        title: 'Caja abierta',
        text: 'La caja se ha abierto correctamente',
        confirmButtonText: 'Entendido'
      });

      setShowAbrirModal(false);
      setFormData({ monto_inicial: 0, responsable: '', monto_final: 0, observaciones: '' });
    } catch (error) {
      console.error('Error al abrir caja:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo abrir la caja',
        confirmButtonText: 'Entendido'
      });
    }
  }, [formData, openCash]);

  const handleCerrarCaja = useCallback(async () => {
    if (!cash) return;

    // Validar que se hayan llenado los campos de efectivo real
    if (efectivoReal.efectivo < 0 || efectivoReal.tarjeta < 0 || efectivoReal.transferencia < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Montos inválidos',
        text: 'Los montos no pueden ser negativos',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    try {
      await closeCash({
        monto_final: calcularTotalReal()
      });

      Swal.fire({
        icon: 'success',
        title: 'Caja cerrada',
        text: 'La caja se ha cerrado correctamente',
        confirmButtonText: 'Entendido'
      });

      setShowCerrarModal(false);
      setFormData({ monto_inicial: 0, responsable: '', monto_final: 0, observaciones: '' });
      // El resumen se limpia automáticamente por el store
    } catch (error) {
      console.error('Error al cerrar caja:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cerrar la caja',
        confirmButtonText: 'Entendido'
      });
    }
  }, [cash, formData, closeCash, resumen]);

  const handleImprimirResumen = async () => {
    if (!cash || !resumen) return;
    
    try {
      await api.printResumenCaja({
        caja: cash,
        resumen: resumen,
        fecha: new Date().toISOString()
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Resumen impreso',
        text: 'El resumen de caja se ha enviado a la impresora',
        confirmButtonText: 'Entendido'
      });
    } catch (error) {
      console.error('Error al imprimir:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo imprimir el resumen',
        confirmButtonText: 'Entendido'
      });
    }
  };

  const calcularDiferencia = () => {
    if (!cash || !resumen) return 0;
    const montoEsperado = cash.monto_inicial + resumen.ventas_efectivo;
    return efectivoReal.efectivo - montoEsperado;
  };

  const calcularTotalReal = () => {
    return efectivoReal.efectivo + efectivoReal.tarjeta + efectivoReal.transferencia;
  };

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                <i className="bi bi-cash-register me-2"></i>
                Gestión de Caja
              </h2>
              <p className="text-muted mb-0">Control de apertura y cierre de caja</p>
            </div>
            <div className="d-flex gap-2">
              {!cash && (
                <button
                  className="btn btn-success"
                  onClick={() => setShowAbrirModal(true)}
                >
                  <i className="bi bi-unlock me-2"></i>
                  Abrir Caja
                </button>
              )}
              {cash && cash.estado === 'abierta' && (
                <>
                  <button
                    className="btn btn-outline-primary"
                    onClick={handleImprimirResumen}
                    disabled={!resumen}
                  >
                    <i className="bi bi-printer me-2"></i>
                    Imprimir Resumen
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => setShowCerrarModal(true)}
                  >
                    <i className="bi bi-lock me-2"></i>
                    Cerrar Caja
                  </button>
                </>
              )}
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  setShowHistorialModal(true);
                  loadHistorialCajas();
                }}
              >
                <i className="bi bi-clock-history me-2"></i>
                Historial
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Estado de Caja */}
        <div className="col-lg-4 mb-4">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center">
              <i className="bi bi-cash-register me-2"></i>
              <h5 className="mb-0">Estado de Caja</h5>
            </div>
            <div className="card-body">
              {cash && cash.estado === 'abierta' ? (
                <>
                  <div className="alert alert-success d-flex align-items-center mb-3">
                    <i className="bi bi-check-circle me-2"></i>
                    <strong>Caja Abierta</strong>
                  </div>
                  
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label fw-bold">Responsable:</label>
                      <p className="mb-0">{cash.responsable}</p>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold">Monto Inicial:</label>
                      <p className="mb-0 text-success fw-bold">
                        {formatCurrency(cash.monto_inicial, config.currency)}
                      </p>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold">Fecha Apertura:</label>
                      <p className="mb-0">{formatDate(cash.fecha_apertura)}</p>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold">Hora Apertura:</label>
                      <p className="mb-0">{formatTime(cash.fecha_apertura)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-lock text-muted" style={{ fontSize: '3rem' }}></i>
                  <h5 className="mt-3 text-muted">Caja Cerrada</h5>
                  <p className="text-muted">No hay caja abierta en este momento</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resumen del Día */}
        <div className="col-lg-8 mb-4">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center">
              <i className="bi bi-graph-up me-2"></i>
              <h5 className="mb-0">Resumen del Día</h5>
              {cash && cash.estado === 'abierta' && (
                <button
                  className="btn btn-sm btn-outline-primary ms-auto"
                  onClick={loadResumenDia}
                  disabled={isLoading}
                >
                  <i className={`bi bi-arrow-clockwise ${isLoading ? 'spinner-border spinner-border-sm' : ''}`}></i>
                </button>
              )}
            </div>
            <div className="card-body">
              {cash && cash.estado === 'abierta' && resumen ? (
                <div className="row g-3">
                  {/* Ventas Totales */}
                  <div className="col-md-6">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <i className="bi bi-currency-dollar text-success" style={{ fontSize: '2rem' }}></i>
                        <h4 className="mt-2 text-success">
                          {formatCurrency(resumen.total_ventas, config.currency)}
                        </h4>
                        <p className="mb-0 text-muted">Total Ventas</p>
                      </div>
                    </div>
                  </div>

                  {/* Órdenes Totales */}
                  <div className="col-md-6">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <i className="bi bi-receipt text-primary" style={{ fontSize: '2rem' }}></i>
                        <h4 className="mt-2 text-primary">{resumen.total_ordenes}</h4>
                        <p className="mb-0 text-muted">Total Órdenes</p>
                      </div>
                    </div>
                  </div>

                  {/* Métodos de Pago */}
                  <div className="col-12">
                    <h6 className="mb-3">Métodos de Pago</h6>
                    <div className="row g-2">
                      <div className="col-4">
                        <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                          <span className="text-muted">Efectivo:</span>
                          <strong className="text-success">
                            {formatCurrency(resumen.ventas_efectivo, config.currency)}
                          </strong>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                          <span className="text-muted">Tarjeta:</span>
                          <strong className="text-primary">
                            {formatCurrency(resumen.ventas_tarjeta, config.currency)}
                          </strong>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                          <span className="text-muted">Transferencia:</span>
                          <strong className="text-info">
                            {formatCurrency(resumen.ventas_transferencia, config.currency)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Estado de Órdenes */}
                  <div className="col-12">
                    <h6 className="mb-3">Estado de Órdenes</h6>
                    <div className="row g-2">
                      <div className="col-3">
                        <div className="text-center p-2 bg-warning bg-opacity-25 rounded">
                          <div className="fw-bold text-warning">{resumen.ordenes_pendientes}</div>
                          <small className="text-muted">Pendientes</small>
                        </div>
                      </div>
                      <div className="col-3">
                        <div className="text-center p-2 bg-info bg-opacity-25 rounded">
                          <div className="fw-bold text-info">{resumen.ordenes_preparando}</div>
                          <small className="text-muted">Preparando</small>
                        </div>
                      </div>
                      <div className="col-3">
                        <div className="text-center p-2 bg-success bg-opacity-25 rounded">
                          <div className="fw-bold text-success">{resumen.ordenes_entregadas}</div>
                          <small className="text-muted">Entregadas</small>
                        </div>
                      </div>
                      <div className="col-3">
                        <div className="text-center p-2 bg-danger bg-opacity-25 rounded">
                          <div className="fw-bold text-danger">{resumen.ordenes_canceladas}</div>
                          <small className="text-muted">Canceladas</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : cash && cash.estado === 'abierta' ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2 text-muted">Cargando resumen...</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-graph-up text-muted" style={{ fontSize: '3rem' }}></i>
                  <h5 className="mt-3 text-muted">Sin Datos</h5>
                  <p className="text-muted">Abre la caja para ver el resumen del día</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Abrir Caja */}
      {showAbrirModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-unlock me-2"></i>
                  Abrir Caja
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAbrirModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Responsable *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.responsable}
                    onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                    placeholder="Nombre del responsable"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Monto Inicial</label>
                  <div className="input-group">
                    <span className="input-group-text">{config.currencySymbol}</span>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.monto_inicial}
                      onChange={(e) => setFormData({ ...formData, monto_inicial: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAbrirModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleAbrirCaja}
                >
                  <i className="bi bi-unlock me-2"></i>
                  Abrir Caja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cerrar Caja */}
      {showCerrarModal && cash && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-lock me-2"></i>
                  Cerrar Caja
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCerrarModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info py-2">
                  <div className="row g-2">
                    <div className="col-6">
                      <small className="text-muted">Monto inicial:</small>
                      <div className="fw-bold text-success">{formatCurrency(cash.monto_inicial, config.currency)}</div>
                    </div>
                    <div className="col-6">
                      <small className="text-muted">Total ventas:</small>
                      <div className="fw-bold text-primary">{formatCurrency(resumen?.total_ventas || 0, config.currency)}</div>
                    </div>
                    <div className="col-6">
                      <small className="text-muted">Monto esperado:</small>
                      <div className="fw-bold text-info">{formatCurrency((cash.monto_inicial + (resumen?.total_ventas || 0)), config.currency)}</div>
                    </div>
                    <div className="col-6">
                      <small className="text-muted">Total órdenes:</small>
                      <div className="fw-bold">{resumen?.total_ordenes || 0}</div>
                    </div>
                  </div>
                  
                  {resumen && (resumen.ventas_efectivo > 0 || resumen.ventas_tarjeta > 0 || resumen.ventas_transferencia > 0) && (
                    <div className="mt-2 pt-2 border-top">
                      <small className="text-muted">Ventas por método:</small>
                      <div className="row g-1 mt-1">
                        {resumen.ventas_efectivo > 0 && (
                          <div className="col-4">
                            <small className="text-success">💵 {formatCurrency(resumen.ventas_efectivo, config.currency)}</small>
                          </div>
                        )}
                        {resumen.ventas_tarjeta > 0 && (
                          <div className="col-4">
                            <small className="text-primary">💳 {formatCurrency(resumen.ventas_tarjeta, config.currency)}</small>
                          </div>
                        )}
                        {resumen.ventas_transferencia > 0 && (
                          <div className="col-4">
                            <small className="text-info">📱 {formatCurrency(resumen.ventas_transferencia, config.currency)}</small>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">Control de Efectivo Real *</label>
                  <p className="text-muted small mb-2">Ingresa el monto real que tienes de cada método de pago</p>
                  
                  <div className="row g-2">
                    {resumen && resumen.ventas_efectivo > 0 && (
                      <div className="col-md-6">
                        <label className="form-label small">💵 Efectivo Real:</label>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text">{config.currencySymbol}</span>
                          <input
                            type="number"
                            className="form-control"
                            value={efectivoReal.efectivo}
                            onChange={(e) => setEfectivoReal({ ...efectivoReal, efectivo: parseFloat(e.target.value) || 0 })}
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <small className="text-muted">
                          Esperado: {formatCurrency(cash.monto_inicial + resumen.ventas_efectivo, config.currency)}
                          {efectivoReal.efectivo > 0 && (
                            <span className={`ms-1 fw-bold ${calcularDiferencia() >= 0 ? 'text-success' : 'text-danger'}`}>
                              ({calcularDiferencia() > 0 ? '+' : ''}{formatCurrency(calcularDiferencia(), config.currency)})
                            </span>
                          )}
                        </small>
                      </div>
                    )}
                    
                    {resumen && resumen.ventas_tarjeta > 0 && (
                      <div className="col-md-6">
                        <label className="form-label small">💳 Tarjeta Real:</label>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text">{config.currencySymbol}</span>
                          <input
                            type="number"
                            className="form-control"
                            value={efectivoReal.tarjeta}
                            onChange={(e) => setEfectivoReal({ ...efectivoReal, tarjeta: parseFloat(e.target.value) || 0 })}
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <small className="text-muted">
                          Esperado: {formatCurrency(resumen.ventas_tarjeta, config.currency)}
                        </small>
                      </div>
                    )}
                    
                    {resumen && resumen.ventas_transferencia > 0 && (
                      <div className="col-md-6">
                        <label className="form-label small">📱 Transferencia Real:</label>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text">{config.currencySymbol}</span>
                          <input
                            type="number"
                            className="form-control"
                            value={efectivoReal.transferencia}
                            onChange={(e) => setEfectivoReal({ ...efectivoReal, transferencia: parseFloat(e.target.value) || 0 })}
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        <small className="text-muted">
                          Esperado: {formatCurrency(resumen.ventas_transferencia, config.currency)}
                        </small>
                      </div>
                    )}
                  </div>
                  
                  <div className="alert alert-info py-2 mt-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong>Total Real:</strong>
                      <strong className="text-primary">{formatCurrency(calcularTotalReal(), config.currency)}</strong>
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label small">Observaciones</label>
                  <textarea
                    className="form-control form-control-sm"
                    rows={2}
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    placeholder="Observaciones sobre el cierre de caja..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCerrarModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleCerrarCaja}
                >
                  <i className="bi bi-lock me-2"></i>
                  Cerrar Caja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historial */}
      {showHistorialModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-clock-history me-2"></i>
                  Historial de Cajas
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowHistorialModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-2 text-muted">Cargando historial...</p>
                  </div>
                ) : historialCajas.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Responsable</th>
                          <th>Monto Inicial</th>
                          <th>Total Ventas</th>
                          <th>Monto Final</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historialCajas.map((caja) => (
                          <tr key={caja.id}>
                            <td>{formatDate(caja.fecha_apertura)}</td>
                            <td>{caja.responsable}</td>
                            <td className="text-success">
                              {formatCurrency(caja.monto_inicial, config.currency)}
                            </td>
                            <td className="text-primary">
                              {formatCurrency(caja.total_ventas || 0, config.currency)}
                            </td>
                            <td className="text-info">
                              {formatCurrency(caja.monto_final || 0, config.currency)}
                            </td>
                            <td>
                              <span className={`badge ${caja.estado === 'abierta' ? 'bg-success' : 'bg-secondary'}`}>
                                {caja.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="bi bi-inbox text-muted" style={{ fontSize: '3rem' }}></i>
                    <h5 className="mt-3 text-muted">Sin Historial</h5>
                    <p className="text-muted">No hay registros de cajas anteriores</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowHistorialModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CajaPage;