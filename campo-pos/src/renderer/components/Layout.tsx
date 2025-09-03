import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { startSyncService } from '../lib/syncService';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // Usar el store centralizado
  const cashStatus = useAppStore(state => state.cash?.estado || 'cerrada');
  const isLoading = useAppStore(state => state.isLoading);
  const config = useAppStore(state => state.config);

  // Iniciar servicio de sincronización una sola vez
  useEffect(() => {
    startSyncService();
  }, []);

  const menuItems = [
    {
      path: '/',
      icon: 'bi-house-door',
      label: 'Inicio',
      description: 'Comandero'
    },
    {
      path: '/inventario',
      icon: 'bi-box-seam',
      label: 'Inventario',
      description: 'Productos'
    },
    {
      path: '/pedidos',
      icon: 'bi-receipt',
      label: 'Pedidos',
      description: 'Historial'
    },
    {
      path: '/caja',
      icon: 'bi-cash-stack',
      label: 'Caja',
      description: 'Gestión'
    },
    {
      path: '/reportes',
      icon: 'bi-graph-up',
      label: 'Reportes',
      description: 'Estadísticas'
    },
    {
      path: '/config',
      icon: 'bi-gear',
      label: 'Configuración',
      description: 'Ajustes'
    }
  ];

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <nav className="sidebar">
        <div className="p-3">
          <h4 className="text-white mb-0">
            <i className="bi bi-cash-register me-2"></i>
            Campo POS
          </h4>
          <small className="text-muted">
            Sistema de Punto de Venta
          </small>
        </div>

        {/* Estado de caja */}
        <div className="px-3 mb-3">
          <div className={`alert ${cashStatus === 'abierta' ? 'alert-success' : 'alert-danger'} mb-0 py-2`}>
            <i className={`bi ${cashStatus === 'abierta' ? 'bi-unlock' : 'bi-lock'} me-2`}></i>
            <small>
              {cashStatus === 'abierta' ? 'Caja Abierta' : 'Caja Cerrada'}
            </small>
          </div>
        </div>

        {/* Información de configuración */}
        <div className="px-3 mb-3">
          <div className="alert alert-info mb-0 py-2">
            <i className="bi bi-percent me-2"></i>
            <small>IVA: {Math.round(config.vatRate * 100)}%</small>
          </div>
        </div>

        {/* Navegación */}
        <div className="nav-menu">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <i className={item.icon}></i>
              <div>
                <div>{item.label}</div>
                <small className="text-muted">{item.description}</small>
              </div>
            </Link>
          ))}
        </div>

        {/* Información del pedido actual */}
        {location.pathname === '/' && (
          <div className="mt-auto p-3">
            <div className="card bg-dark border-secondary">
              <div className="card-body p-3">
                <h6 className="card-title text-white mb-2">
                  <i className="bi bi-cart me-2"></i>
                  Pedido Actual
                </h6>
                <div className="d-flex justify-content-between text-white">
                  <span>Items:</span>
                  <span className="fw-bold">0</span>
                </div>
                <div className="d-flex justify-content-between text-white">
                  <span>Total:</span>
                  <span className="fw-bold text-success">
                    $0
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Contenido principal */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;