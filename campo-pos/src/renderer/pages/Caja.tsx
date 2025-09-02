import React, { useState, useEffect } from 'react';
import { api, Caja } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/format';
import Swal from 'sweetalert2';

const CajaPage: React.FC = () => {
  const [cajaActual, setCajaActual] = useState<Caja | null>(null);
  const [resumenDia, setResumenDia] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [showCerrarModal, setShowCerrarModal] = useState(false);
  const [formData, setFormData] = useState({
    monto_inicial: 0,
    responsable: '',
    monto_final: 0
  });

  useEffect(() => {
    loadCajaData();
  }, []);

  const loadCajaData = async () => {
    try {
      setIsLoading(true);
      const [estadoCaja, resumen] = await Promise.all([
        api.getEstadoCaja(),
        api.getResumenCaja()
      ]);
      
      setCajaActual(estadoCaja);
      setResumenDia(resumen);
    } catch (error) {
      console.error('Error al cargar datos de caja:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los datos de caja',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbrirCaja = async () => {
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
      await api.abrirCaja({
        monto_inicial: formData.monto_inicial,
        responsable: formData.responsable
      });

      Swal.fire({
        icon: 'success',
        title: 'Caja abierta',
        text: 'La caja se ha abierto correctamente',
        confirmButtonText: 'Entendido'
      });

      setShowAbrirModal(false);
      setFormData({ monto_inicial: 0, responsable: '', monto_final: 0 });
      loadCajaData();
    } catch (error) {
      console.error('Error al abrir caja:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo abrir la caja',
        confirmButtonText: 'Entendido'
      });
    }
  };

  const handleCerrarCaja = async () => {
    if (formData.monto_final < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Monto inválido',
        text: 'El monto final no puede ser negativo',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Cerrar caja',
      text: `¿Está seguro de cerrar la caja con un monto final de ${formatCurrency(formData.monto_final)}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    });

    if (result.isConfirmed) {
      try {
        await api.cerrarCaja({
          monto_final: formData.monto_final
        });

        // Imprimir cierre de caja
        const cajaData = {
          ...cajaActual,
          fecha_cierre: new Date().toISOString(),
          monto_final: formData.monto_final,
          total_ventas: resumenDia?.total_ventas || 0,
          total_pagos: resumenDia?.total_pagos || 0,
          total_ordenes: resumenDia?.total_ordenes || 0
        };

        await api.printCierreCaja(cajaData);

        Swal.fire({
          icon: 'success',
          title: 'Caja cerrada',
          text: 'La caja se ha cerrado correctamente y se ha impreso el reporte',
          confirmButtonText: 'Entendido'
        });

        setShowCerrarModal(false);
        setFormData({ monto_inicial: 0, responsable: '', monto_final: 0 });
        loadCajaData();
      } catch (error) {
        console.error('Error al cerrar caja:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cerrar la caja',
          confirmButtonText: 'Entendido'
        });
      }
    }
  };

  const calcularDiferencia = () => {
    if (!cajaActual || !resumenDia) return 0;
    const montoEsperado = cajaActual.monto_inicial + (resumenDia.total_ventas || 0);
    return (formData.monto_final || 0) - montoEsperado;
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
            <h1>Gestión de Caja</h1>
            <p className="text-muted mb-0">Control de apertura y cierre de caja</p>
          </div>
          <div>
            <button
              className="btn btn-primary"
              onClick={loadCajaData}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Estado de caja */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-cash-stack me-2"></i>
                Estado de Caja
              </h5>
            </div>
            <div className="card-body">
              {cajaActual ? (
                <div>
                  <div className={`alert ${cajaActual.estado === 'abierta' ? 'alert-success' : 'alert-danger'} mb-3`}>
                    <i className={`bi ${cajaActual.estado === 'abierta' ? 'bi-unlock' : 'bi-lock'} me-2`}></i>
                    <strong>
                      {cajaActual.estado === 'abierta' ? 'Caja Abierta' : 'Caja Cerrada'}
                    </strong>
                  </div>

                  <div className="row g-3">
                    <div className="col-6">
                      <div className="text-center p-3 bg-light rounded">
                        <div className="text-muted small">Responsable</div>
                        <div className="fw-bold">{cajaActual.responsable}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-3 bg-light rounded">
                        <div className="text-muted small">Monto Inicial</div>
                        <div className="fw-bold text-success">
                          {formatCurrency(cajaActual.monto_inicial)}
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-3 bg-light rounded">
                        <div className="text-muted small">Fecha Apertura</div>
                        <div className="fw-bold">
                          {formatDate(cajaActual.fecha_apertura)}
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-3 bg-light rounded">
                        <div className="text-muted small">Hora Apertura</div>
                        <div className="fw-bold">
                          {new Date(cajaActual.fecha_apertura).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {cajaActual.estado === 'abierta' && (
                    <div className="mt-3">
                      <button
                        className="btn btn-danger w-100"
                        onClick={() => setShowCerrarModal(true)}
                      >
                        <i className="bi bi-lock me-2"></i>
                        Cerrar Caja
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-cash-stack display-4 text-muted mb-3"></i>
                  <h5>No hay caja abierta</h5>
                  <p className="text-muted">Abra la caja para comenzar a operar</p>
                  <button
                    className="btn btn-success"
                    onClick={() => setShowAbrirModal(true)}
                  >
                    <i className="bi bi-unlock me-2"></i>
                    Abrir Caja
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resumen del día */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-graph-up me-2"></i>
                Resumen del Día
              </h5>
            </div>
            <div className="card-body">
              {resumenDia ? (
                <div className="row g-3">
                  <div className="col-6">
                    <div className="text-center p-3 bg-light rounded">
                      <div className="text-muted small">Total Ventas</div>
                      <div className="fw-bold text-success">
                        {formatCurrency(resumenDia.total_ventas || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-3 bg-light rounded">
                      <div className="text-muted small">Total Órdenes</div>
                      <div className="fw-bold text-primary">
                        {resumenDia.total_ordenes || 0}
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-3 bg-light rounded">
                      <div className="text-muted small">Total Pagos</div>
                      <div className="fw-bold text-info">
                        {formatCurrency(resumenDia.total_pagos || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center p-3 bg-light rounded">
                      <div className="text-muted small">Promedio por Orden</div>
                      <div className="fw-bold text-warning">
                        {formatCurrency(
                          resumenDia.total_ordenes > 0 
                            ? (resumenDia.total_ventas || 0) / resumenDia.total_ordenes 
                            : 0
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-graph-up display-4 mb-3"></i>
                  <h5>Sin datos del día</h5>
                  <p>No hay información de ventas para hoy</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal abrir caja */}
      {showAbrirModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Abrir Caja</h5>
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
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Monto Inicial</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.monto_inicial}
                    onChange={(e) => setFormData({ ...formData, monto_inicial: Number(e.target.value) })}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
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
                  Abrir Caja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal cerrar caja */}
      {showCerrarModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cerrar Caja</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCerrarModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {cajaActual && resumenDia && (
                  <div className="mb-3">
                    <div className="row g-2">
                      <div className="col-6">
                        <div className="text-center p-2 bg-light rounded">
                          <div className="text-muted small">Monto Inicial</div>
                          <div className="fw-bold">{formatCurrency(cajaActual.monto_inicial)}</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="text-center p-2 bg-light rounded">
                          <div className="text-muted small">Total Ventas</div>
                          <div className="fw-bold">{formatCurrency(resumenDia.total_ventas || 0)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-center mt-2">
                      <div className="text-muted small">Monto Esperado</div>
                      <div className="fw-bold text-primary">
                        {formatCurrency(cajaActual.monto_inicial + (resumenDia.total_ventas || 0))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Monto Final *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.monto_final}
                    onChange={(e) => setFormData({ ...formData, monto_final: Number(e.target.value) })}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                {cajaActual && resumenDia && (
                  <div className="alert alert-info">
                    <div className="d-flex justify-content-between">
                      <span>Diferencia:</span>
                      <span className={`fw-bold ${calcularDiferencia() >= 0 ? 'text-success' : 'text-danger'}`}>
                        {calcularDiferencia() >= 0 ? '+' : ''}{formatCurrency(calcularDiferencia())}
                      </span>
                    </div>
                  </div>
                )}
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
                  Cerrar Caja
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
