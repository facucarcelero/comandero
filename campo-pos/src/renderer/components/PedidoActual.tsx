import React, { useEffect } from 'react';
import { usePedidoSelectors, usePedidoActions } from '../store/usePedidoStore';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../lib/format';

interface PedidoActualProps {
  onImprimirComanda?: () => void;
  onPagar?: () => void;
}

const PedidoActual: React.FC<PedidoActualProps> = ({ onImprimirComanda, onPagar }) => {
  const { items, mesa, cliente, observaciones, subtotal, iva, total, itemCount } = usePedidoSelectors();
  const { removeItem, updateItemQuantity, updateItemObservations, setMesa, setCliente, setObservaciones, clearPedido, recalculateTotals } = usePedidoActions();
  
  // Obtener configuración del IVA del store centralizado
  const { config, cash } = useAppStore(state => ({
    config: state.config,
    cash: state.cash
  }));

  // Recalcular totales cuando cambie el IVA
  useEffect(() => {
    if (items.length > 0) {
      recalculateTotals(config.vatRate);
    }
  }, [config.vatRate, items.length, recalculateTotals]);

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(index);
    } else {
      updateItemQuantity(index, newQuantity);
    }
  };

  const handleObservationsChange = (index: number, observations: string) => {
    updateItemObservations(index, observations);
  };

  if (items.length === 0) {
    return (
      <div className="pedido-actual">
        <div className="text-center text-muted py-5">
          <i className="bi bi-cart-x display-4 mb-3"></i>
          <h5>No hay items en el pedido</h5>
          <p className="mb-0">Agrega productos desde el catálogo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pedido-actual">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          <i className="bi bi-cart me-2"></i>
          Pedido Actual
        </h5>
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={clearPedido}
          title="Limpiar pedido"
        >
          <i className="bi bi-trash"></i>
        </button>
      </div>

      {/* Información del pedido */}
      <div className="mb-3">
        <div className="row g-2">
          <div className="col-6">
            <label className="form-label form-label-sm">Mesa <small className="text-muted">(opcional)</small></label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Número de mesa (opcional)"
              value={mesa}
              onChange={(e) => setMesa(e.target.value)}
            />
          </div>
          <div className="col-6">
            <label className="form-label form-label-sm">Cliente</label>
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
          <label className="form-label form-label-sm">Observaciones</label>
          <textarea
            className="form-control form-control-sm"
            placeholder="Observaciones del pedido..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      {/* Items del pedido */}
      <div className="pedido-items">
        {items.map((item, index) => (
          <div key={index} className="pedido-item">
            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="mb-1">{item.nombre}</h6>
                  <small className="text-muted">
                    ${item.precio.toLocaleString()} c/u
                  </small>
                </div>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => removeItem(index)}
                  title="Eliminar item"
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>

              {/* Controles de cantidad */}
              <div className="d-flex align-items-center mt-2">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => handleQuantityChange(index, item.cantidad - 1)}
                >
                  <i className="bi bi-dash"></i>
                </button>
                <span className="mx-2 fw-bold">{item.cantidad}</span>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => handleQuantityChange(index, item.cantidad + 1)}
                >
                  <i className="bi bi-plus"></i>
                </button>
                <div className="ms-auto">
                  <span className="fw-bold text-success">
                    ${item.subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Observaciones */}
              <div className="mt-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Observaciones..."
                  value={item.observaciones}
                  onChange={(e) => handleObservationsChange(index, e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totales */}
      <div className="pedido-totales">
        <div className="total-line">
          <span>Items ({itemCount}):</span>
          <span>${subtotal.toLocaleString()}</span>
        </div>
        <div className="total-line">
          <span>IVA ({Math.round(config.vatRate * 100)}%):</span>
          <span>${iva.toLocaleString()}</span>
        </div>
        <div className="total-line total-final">
          <span>TOTAL:</span>
          <span>${total.toLocaleString()}</span>
        </div>
      </div>

      {/* Botones de acción */}
      {items.length > 0 && (
        <div className="mt-3">
          {cash?.estado !== 'abierta' && (
            <div className="alert alert-warning mb-3 py-2">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <small>Debe abrir la caja para procesar pedidos y pagos</small>
            </div>
          )}
          <div className="d-grid gap-2">
            <button
              className="btn btn-outline-primary"
              onClick={onImprimirComanda}
              disabled={cash?.estado !== 'abierta'}
              title={cash?.estado !== 'abierta' ? 'Debe abrir la caja para imprimir comandas' : ''}
            >
              <i className="bi bi-printer me-2"></i>
              Imprimir Comanda
            </button>
            <button
              className="btn btn-success"
              onClick={onPagar}
              disabled={cash?.estado !== 'abierta'}
              title={cash?.estado !== 'abierta' ? 'Debe abrir la caja para procesar pagos' : ''}
            >
              <i className="bi bi-credit-card me-2"></i>
              Procesar Pago
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidoActual;
