import React from 'react';
import { usePedidoSelectors, usePedidoActions } from '../store/usePedidoStore';
import { formatCurrency } from '../lib/format';

const PedidoActual: React.FC = () => {
  const { items, mesa, cliente, subtotal, iva, total, itemCount } = usePedidoSelectors();
  const { removeItem, updateItemQuantity, updateItemObservations, clearPedido } = usePedidoActions();

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
            <small className="text-muted">Mesa:</small>
            <div className="fw-bold">{mesa || 'S/N'}</div>
          </div>
          <div className="col-6">
            <small className="text-muted">Cliente:</small>
            <div className="fw-bold">{cliente || 'General'}</div>
          </div>
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
          <span>IVA (19%):</span>
          <span>${iva.toLocaleString()}</span>
        </div>
        <div className="total-line total-final">
          <span>TOTAL:</span>
          <span>${total.toLocaleString()}</span>
        </div>
      </div>


    </div>
  );
};

export default PedidoActual;
