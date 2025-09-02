import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePedidoSelectors } from '../store/usePedidoStore';
import { api } from '../lib/api';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { itemCount, total } = usePedidoSelectors();
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkCajaStatus();
  }, []);

  const checkCajaStatus = async () => {
    try {
      console.log('Verificando estado de caja...');
      console.log('API disponible:', !!window.api);
      console.log('window.api:', window.api);
      
      if (!window.api) {
        console.error('❌ window.api no está disponible');
        setError('API no disponible');
        return;
      }
      
      const estado = await api.getEstadoCaja();
      console.log('Estado de caja:', estado);
      setCajaAbierta(!!estado);
    } catch (error) {
      console.error('Error al verificar estado de caja:', error);
      setError('Error al conectar con la base de datos');
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className={`alert ${cajaAbierta ? 'alert-success' : 'alert-danger'} mb-0 py-2`}>
            <i className={`bi ${cajaAbierta ? 'bi-unlock' : 'bi-lock'} me-2`}></i>
            <small>
              {cajaAbierta ? 'Caja Abierta' : 'Caja Cerrada'}
            </small>
          </div>
        </div>

        {/* Error de conexión */}
        {error && (
          <div className="px-3 mb-3">
            <div className="alert alert-warning mb-0 py-2">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <small>{error}</small>
            </div>
          </div>
        )}

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
                  <span className="fw-bold">{itemCount}</span>
                </div>
                <div className="d-flex justify-content-between text-white">
                  <span>Total:</span>
                  <span className="fw-bold text-success">
                    ${total.toLocaleString()}
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
