import React from 'react';
import { usePedidoSelectors } from '../store/usePedidoStore';
import { formatCurrency, formatDate } from '../lib/format';

interface TicketPreviewProps {
  ordenData?: any;
  tipo?: 'kitchen' | 'ticket' | 'cierre';
}

const TicketPreview: React.FC<TicketPreviewProps> = ({ 
  ordenData, 
  tipo = 'ticket' 
}) => {
  const { items, mesa, cliente, subtotal, iva, total } = usePedidoSelectors();
  const data = ordenData || { items, mesa, cliente, subtotal, iva, total };

  const renderKitchenTicket = () => (
    <div className="ticket-preview kitchen-ticket">
      <div className="text-center mb-3">
        <h4 className="fw-bold">COCINA</h4>
        <div className="border-bottom pb-2"></div>
      </div>
      
      <div className="mb-3">
        <div className="row">
          <div className="col-6">
            <strong>Orden:</strong> #{data.id || 'N/A'}
          </div>
          <div className="col-6">
            <strong>Mesa:</strong> {data.mesa || 'S/N'}
          </div>
        </div>
        <div className="row">
          <div className="col-6">
            <strong>Cliente:</strong> {data.cliente || 'S/N'}
          </div>
          <div className="col-6">
            <strong>Fecha:</strong> {formatDate(data.fecha || new Date())}
          </div>
        </div>
      </div>

      <div className="border-bottom mb-3"></div>

      {data.items?.map((item: any, index: number) => (
        <div key={index} className="mb-2">
          <div className="d-flex justify-content-between">
            <span className="fw-bold">{item.cantidad}x {item.nombre}</span>
            <span>${item.precio.toLocaleString()} c/u</span>
          </div>
          {item.observaciones && (
            <div className="text-muted small">
              Obs: {item.observaciones}
            </div>
          )}
        </div>
      ))}

      <div className="border-bottom mb-3"></div>
      
      <div className="text-end">
        <strong>Total: ${data.total?.toLocaleString()}</strong>
      </div>
      
      <div className="text-center mt-3">
        <em>¡Buen provecho!</em>
      </div>
    </div>
  );

  const renderTicket = () => (
    <div className="ticket-preview ticket">
      <div className="text-center mb-3">
        <h4 className="fw-bold">MI RESTAURANTE</h4>
        <div>Dirección del restaurante</div>
        <div>Tel: (123) 456-7890</div>
        <div>RUC: 123.456.789</div>
        <div className="border-bottom pb-2 mt-2"></div>
      </div>
      
      <div className="mb-3">
        <div className="row">
          <div className="col-6">
            <strong>Ticket:</strong> #{data.id || 'N/A'}
          </div>
          <div className="col-6">
            <strong>Fecha:</strong> {formatDate(data.fecha || new Date())}
          </div>
        </div>
        <div className="row">
          <div className="col-6">
            <strong>Mesa:</strong> {data.mesa || 'S/N'}
          </div>
          {data.cliente && (
            <div className="col-6">
              <strong>Cliente:</strong> {data.cliente}
            </div>
          )}
        </div>
      </div>

      <div className="border-bottom mb-3"></div>

      {data.items?.map((item: any, index: number) => (
        <div key={index} className="mb-2">
          <div className="d-flex justify-content-between">
            <span>{item.cantidad}x {item.nombre}</span>
            <span>${(item.cantidad * item.precio).toLocaleString()}</span>
          </div>
          {item.observaciones && (
            <div className="text-muted small">
              Obs: {item.observaciones}
            </div>
          )}
        </div>
      ))}

      <div className="border-bottom mb-3"></div>
      
      <div className="text-end">
        <div>Subtotal: ${data.subtotal?.toLocaleString()}</div>
        <div>IVA: ${data.iva?.toLocaleString()}</div>
        <div className="fw-bold">TOTAL: ${data.total?.toLocaleString()}</div>
      </div>

      {data.pagos && data.pagos.length > 0 && (
        <div className="mt-3">
          <div className="border-bottom mb-2"></div>
          <div><strong>PAGOS:</strong></div>
          {data.pagos.map((pago: any, index: number) => (
            <div key={index} className="d-flex justify-content-between">
              <span>{pago.metodo.toUpperCase()}:</span>
              <span>${pago.monto.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {data.observaciones && (
        <div className="mt-3">
          <div><strong>Observaciones:</strong></div>
          <div>{data.observaciones}</div>
        </div>
      )}
      
      <div className="text-center mt-3">
        <em>¡Gracias por su compra!</em>
        <div>Vuelva pronto</div>
      </div>
    </div>
  );

  const renderCierreCaja = () => (
    <div className="ticket-preview cierre-caja">
      <div className="text-center mb-3">
        <h4 className="fw-bold">CIERRE DE CAJA</h4>
        <div className="border-bottom pb-2"></div>
      </div>
      
      <div className="mb-3">
        <div><strong>Responsable:</strong> {data.responsable}</div>
        <div><strong>Apertura:</strong> {formatDate(data.fecha_apertura)}</div>
        <div><strong>Cierre:</strong> {formatDate(data.fecha_cierre)}</div>
      </div>

      <div className="border-bottom mb-3"></div>
      
      <div>
        <div className="d-flex justify-content-between">
          <span>Monto Inicial:</span>
          <span>${data.monto_inicial?.toLocaleString()}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span>Total Ventas:</span>
          <span>${data.total_ventas?.toLocaleString()}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span>Total Pagos:</span>
          <span>${data.total_pagos?.toLocaleString()}</span>
        </div>
        <div className="d-flex justify-content-between fw-bold">
          <span>Monto Final:</span>
          <span>${data.monto_final?.toLocaleString()}</span>
        </div>
      </div>

      <div className="border-bottom mb-3 mt-3"></div>
      
      <div>
        <div className="d-flex justify-content-between">
          <span>Total Órdenes:</span>
          <span>{data.total_ordenes}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span>Fecha:</span>
          <span>{formatDate(new Date())}</span>
        </div>
      </div>
      
      <div className="text-center mt-3">
        <em>Caja cerrada correctamente</em>
      </div>
    </div>
  );

  return (
    <div className="ticket-preview-container">
      {tipo === 'kitchen' && renderKitchenTicket()}
      {tipo === 'ticket' && renderTicket()}
      {tipo === 'cierre' && renderCierreCaja()}
    </div>
  );
};

export default TicketPreview;
