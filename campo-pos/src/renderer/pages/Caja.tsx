import React, { useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency, formatDate } from '../lib/format';
import Swal from 'sweetalert2';

const CajaPage: React.FC = () => {
  // Usar el store centralizado
  const { cash, openCash, closeCash } = useAppStore(state => ({
    cash: state.cash,
    openCash: state.openCash,
    closeCash: state.closeCash
  }));

  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [showCerrarModal, setShowCerrarModal] = useState(false);
  const [formData, setFormData] = useState({
    monto_inicial: 0,
    responsable: '',
    monto_final: 0
  });

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
        monto_inicial: formData.monto_inicial
      });

      Swal.fire({
        icon: 'success',
        title: 'Caja abierta',
        text: 'La caja se ha abierto correctamente',
        confirmButtonText: 'Entendido'
      });

      setShowAbrirModal(false);
      setFormData({ monto_inicial: 0, responsable: '', monto_final: 0 });
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
      title: '¿Cerrar caja?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar caja',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    });

    if (result.isConfirmed) {
      try {
        await closeCash({
          monto_final: formData.monto_final
        });

        Swal.fire({
          icon: 'success',
          title: 'Caja cerrada',
          text: 'La caja se ha cerrado correctamente',
          confirmButtonText: 'Entendido'
        });

        setShowCerrarModal(false);
        setFormData({ monto_inicial: 0, responsable: '', monto_final: 0 });
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
  }, [formData, closeCash]);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h4 className="mb-0">
                  <i className="bi bi-cash-stack me-2"></i>
                  Gestión de Caja
                </h4>
                <p className="text-muted mb-0">Control de apertura y cierre de caja</p>
              </div>
            </div>
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
              {cash?.estado === 'abierta' ? (
                <div>
                  <div className="alert alert-success mb-3">
                    <i className="bi bi-unlock me-2"></i>
                    <strong>Caja Abierta</strong>
                  </div>
                  
                  <div className="row">
                    <div className="col-6">
                      <p><strong>Responsable:</strong></p>
                      <p>{cash.responsable}</p>
                    </div>
                    <div className="col-6">
                      <p><strong>Monto Inicial:</strong></p>
                      <p className="text-success fw-bold">
                        {formatCurrency(cash.monto_inicial)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-6">
                      <p><strong>Fecha Apertura:</strong></p>
                      <p>{formatDate(cash.fecha_apertura)}</p>
                    </div>
                    <div className="col-6">
                      <p><strong>Hora Apertura:</strong></p>
                      <p>{new Date(cash.fecha_apertura).toLocaleTimeString()}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <button
                      className="btn btn-danger"
                      onClick={() => setShowCerrarModal(true)}
                    >
                      <i className="bi bi-lock me-2"></i>
                      Cerrar Caja
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="alert alert-danger mb-3">
                    <i className="bi bi-lock me-2"></i>
                    <strong>Caja Cerrada</strong>
                  </div>
                  
                  <p className="text-muted">
                    La caja está cerrada. Para realizar operaciones, debe abrirla primero.
                  </p>
                  
                  <button
                    className="btn btn-primary"
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
              {cash?.estado === 'abierta' ? (
                <div>
                  <div className="row">
                    <div className="col-6">
                      <p><strong>Monto Inicial:</strong></p>
                      <p className="text-success fw-bold fs-4">
                        {formatCurrency(cash.monto_inicial)}
                      </p>
                    </div>
                    <div className="col-6">
                      <p><strong>Estado:</strong></p>
                      <p className="text-primary fw-bold fs-4">
                        {cash.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-graph-down display-4 mb-3"></i>
                  <h5>Sin datos</h5>
                  <p>Abra la caja para ver el resumen del día</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para abrir caja */}
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
                  <label className="form-label">Responsable</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.responsable}
                    onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                    placeholder="Nombre del responsable"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Monto Inicial</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.monto_inicial}
                    onChange={(e) => setFormData({...formData, monto_inicial: parseFloat(e.target.value) || 0})}
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
                  className="btn btn-primary"
                  onClick={handleAbrirCaja}
                >
                  Abrir Caja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para cerrar caja */}
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
                <div className="mb-3">
                  <label className="form-label">Monto Final</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.monto_final}
                    onChange={(e) => setFormData({...formData, monto_final: parseFloat(e.target.value) || 0})}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                {cash && (
                  <div className="alert alert-info">
                    <p><strong>Monto Inicial:</strong> {formatCurrency(cash.monto_inicial)}</p>
                    <p><strong>Diferencia:</strong> 
                      <span className={formData.monto_final >= cash.monto_inicial ? 'text-success' : 'text-danger'}>
                        {formatCurrency(formData.monto_final - cash.monto_inicial)}
                      </span>
                    </p>
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