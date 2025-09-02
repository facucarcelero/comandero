import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { api } from '../lib/api';
import { formatCurrency, formatDate, getToday, getYesterday, getWeekAgo } from '../lib/format';
import Swal from 'sweetalert2';

// Interfaces para los datos de reportes
interface VentaPorFecha {
  fecha: string;
  total_ventas: number;
  total_ordenes: number;
}

interface VentaPorCategoria {
  categoria: string;
  total_ventas: number;
  cantidad_vendida: number;
}

interface ProductoMasVendido {
  nombre: string;
  categoria: string;
  cantidad_vendida: number;
  total_ventas: number;
}

interface MetodoPago {
  metodo: string;
  total: number;
}

interface DatosReporte {
  ventasPorFecha: VentaPorFecha[];
  ventasPorCategoria: VentaPorCategoria[];
  productosMasVendidos: ProductoMasVendido[];
  metodosPago: MetodoPago[];
  resumen?: any;
}

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Reportes: React.FC = () => {
  const [filtros, setFiltros] = useState({
    fecha_inicio: getToday(),
    fecha_fin: getToday(),
    tipo_reporte: 'ventas'
  });
  
  const [datos, setDatos] = useState<DatosReporte>({
    ventasPorFecha: [],
    ventasPorCategoria: [],
    productosMasVendidos: [],
    metodosPago: []
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [resumen, setResumen] = useState<any>(null);

  useEffect(() => {
    loadReportes();
  }, [filtros]);

  const loadReportes = async () => {
    try {
      setIsLoading(true);
      
      // Simular datos para el demo (en producción vendrían de la API)
      const ventasPorFecha = [
        { fecha: '2024-01-01', total_ventas: 150000, total_ordenes: 12 },
        { fecha: '2024-01-02', total_ventas: 200000, total_ordenes: 15 },
        { fecha: '2024-01-03', total_ventas: 180000, total_ordenes: 14 },
        { fecha: '2024-01-04', total_ventas: 220000, total_ordenes: 18 },
        { fecha: '2024-01-05', total_ventas: 190000, total_ordenes: 16 }
      ];

      const ventasPorCategoria = [
        { categoria: 'Hamburguesas', total_ventas: 450000, cantidad_vendida: 25 },
        { categoria: 'Bebidas', total_ventas: 120000, cantidad_vendida: 40 },
        { categoria: 'Acompañamientos', total_ventas: 80000, cantidad_vendida: 20 },
        { categoria: 'Ensaladas', total_ventas: 60000, cantidad_vendida: 8 }
      ];

      const productosMasVendidos = [
        { nombre: 'Hamburguesa Clásica', categoria: 'Hamburguesas', cantidad_vendida: 15, total_ventas: 225000 },
        { nombre: 'Coca Cola', categoria: 'Bebidas', cantidad_vendida: 25, total_ventas: 75000 },
        { nombre: 'Papas Fritas', categoria: 'Acompañamientos', cantidad_vendida: 18, total_ventas: 90000 },
        { nombre: 'Hamburguesa Especial', categoria: 'Hamburguesas', cantidad_vendida: 10, total_ventas: 180000 },
        { nombre: 'Agua', categoria: 'Bebidas', cantidad_vendida: 15, total_ventas: 30000 }
      ];

      const metodosPago = [
        { metodo: 'efectivo', total: 400000 },
        { metodo: 'tarjeta', total: 300000 },
        { metodo: 'transferencia', total: 100000 }
      ];

      setDatos({
        ventasPorFecha,
        ventasPorCategoria,
        productosMasVendidos,
        metodosPago
      });

      // Calcular resumen
      const totalVentas = ventasPorFecha.reduce((sum, item) => sum + item.total_ventas, 0);
      const totalOrdenes = ventasPorFecha.reduce((sum, item) => sum + item.total_ordenes, 0);
      const promedioOrden = totalOrdenes > 0 ? totalVentas / totalOrdenes : 0;

      setResumen({
        total_ventas: totalVentas,
        total_ordenes: totalOrdenes,
        promedio_orden: promedioOrden,
        total_categorias: ventasPorCategoria.length,
        total_productos: productosMasVendidos.length
      });

    } catch (error) {
      console.error('Error al cargar reportes:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los reportes',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportar = async () => {
    try {
      const result = await api.saveFileDialog({
        title: 'Exportar reporte',
        defaultPath: `reporte-${filtros.fecha_inicio}-${filtros.fecha_fin}.pdf`,
        filters: [
          { name: 'PDF', extensions: ['pdf'] },
          { name: 'Excel', extensions: ['xlsx'] },
          { name: 'CSV', extensions: ['csv'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        // Exportar reporte a JSON
        const reporteData = {
          fecha: new Date().toISOString(),
          periodo: filtros.tipo_reporte,
          resumen: resumen,
          ventasPorDia: datos.ventasPorFecha,
          productosMasVendidos: datos.productosMasVendidos,
          ventasPorCategoria: datos.ventasPorCategoria,
          metodosPago: datos.metodosPago
        };

        // Escribir el archivo directamente
        const fs = require('fs');
        fs.writeFileSync(result.filePath, JSON.stringify(reporteData, null, 2));
        
        Swal.fire({
          icon: 'success',
          title: 'Reporte exportado',
          text: 'El reporte se ha exportado correctamente',
          confirmButtonText: 'Entendido'
        });
      }
    } catch (error) {
      console.error('Error al exportar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo exportar el reporte',
        confirmButtonText: 'Entendido'
      });
    }
  };

  const handleImprimir = async () => {
    try {
      const reporteData = {
        fecha_inicio: filtros.fecha_inicio,
        fecha_fin: filtros.fecha_fin,
        total_ventas: resumen?.total_ventas || 0,
        total_ordenes: resumen?.total_ordenes || 0,
        promedio_orden: resumen?.promedio_orden || 0,
        top_productos: datos.productosMasVendidos.slice(0, 5),
        ventas_categoria: datos.ventasPorCategoria
      };

      // Imprimir reporte de ventas
      const printSuccess = await api.printReporteVentas(reporteData);
      
      if (printSuccess) {
        Swal.fire({
          icon: 'success',
          title: 'Reporte impreso',
          text: 'El reporte se ha enviado a la impresora correctamente',
          confirmButtonText: 'Entendido'
        });
      } else {
        throw new Error('No se pudo imprimir el reporte');
      }
    } catch (error) {
      console.error('Error al imprimir:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo imprimir el reporte',
        confirmButtonText: 'Entendido'
      });
    }
  };

  // Configuración de gráficos
  const ventasPorFechaConfig = {
    type: 'bar' as const,
    data: {
      labels: datos.ventasPorFecha.map(item => formatDate(item.fecha)),
      datasets: [
        {
          label: 'Ventas',
          data: datos.ventasPorFecha.map(item => item.total_ventas),
          backgroundColor: 'rgba(0, 123, 255, 0.8)',
          borderColor: 'rgba(0, 123, 255, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Ventas por Fecha'
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              return `Ventas: ${formatCurrency(context.parsed.y)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: any) {
              return formatCurrency(value);
            }
          }
        }
      }
    }
  };

  const ventasPorCategoriaConfig = {
    type: 'doughnut' as const,
    data: {
      labels: datos.ventasPorCategoria.map(item => item.categoria),
      datasets: [
        {
          data: datos.ventasPorCategoria.map(item => item.total_ventas),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Ventas por Categoría'
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
            }
          }
        }
      }
    }
  };

  const productosMasVendidosConfig = {
    type: 'bar' as const,
    data: {
      labels: datos.productosMasVendidos.map(item => item.nombre),
      datasets: [
        {
          label: 'Cantidad Vendida',
          data: datos.productosMasVendidos.map(item => item.cantidad_vendida),
          backgroundColor: 'rgba(40, 167, 69, 0.8)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      indexAxis: 'y' as const,
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Productos Más Vendidos'
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              return `Cantidad: ${context.parsed.x} unidades`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true
        }
      }
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1>Reportes</h1>
            <p className="text-muted mb-0">Análisis de ventas y estadísticas</p>
          </div>
          <div>
            <button
              className="btn btn-outline-primary me-2"
              onClick={handleExportar}
            >
              <i className="bi bi-download me-2"></i>
              Exportar
            </button>
            <button
              className="btn btn-outline-secondary me-2"
              onClick={handleImprimir}
            >
              <i className="bi bi-printer me-2"></i>
              Imprimir
            </button>
            <button
              className="btn btn-primary"
              onClick={loadReportes}
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
              <label className="form-label">Fecha Inicio</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fecha_inicio}
                onChange={(e) => setFiltros({ ...filtros, fecha_inicio: e.target.value })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Fecha Fin</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fecha_fin}
                onChange={(e) => setFiltros({ ...filtros, fecha_fin: e.target.value })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Tipo de Reporte</label>
              <select
                className="form-select"
                value={filtros.tipo_reporte}
                onChange={(e) => setFiltros({ ...filtros, tipo_reporte: e.target.value })}
              >
                <option value="ventas">Ventas</option>
                <option value="productos">Productos</option>
                <option value="caja">Caja</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Períodos Rápidos</label>
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setFiltros({ ...filtros, fecha_inicio: getToday(), fecha_fin: getToday() })}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setFiltros({ ...filtros, fecha_inicio: getYesterday(), fecha_fin: getYesterday() })}
                >
                  Ayer
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setFiltros({ ...filtros, fecha_inicio: getWeekAgo(), fecha_fin: getToday() })}
                >
                  7 días
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen */}
      {resumen && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className="bi bi-currency-dollar display-4 text-success mb-2"></i>
                <h5 className="card-title">Total Ventas</h5>
                <h3 className="text-success">{formatCurrency(resumen.total_ventas)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className="bi bi-receipt display-4 text-primary mb-2"></i>
                <h5 className="card-title">Total Órdenes</h5>
                <h3 className="text-primary">{resumen.total_ordenes}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className="bi bi-graph-up display-4 text-info mb-2"></i>
                <h5 className="card-title">Promedio por Orden</h5>
                <h3 className="text-info">{formatCurrency(resumen.promedio_orden)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center">
              <div className="card-body">
                <i className="bi bi-box-seam display-4 text-warning mb-2"></i>
                <h5 className="card-title">Productos Vendidos</h5>
                <h3 className="text-warning">{resumen.total_productos}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="row">
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Ventas por Fecha</h5>
              <div style={{ height: '300px' }}>
                <Bar {...ventasPorFechaConfig} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">Ventas por Categoría</h5>
              <div style={{ height: '300px' }}>
                <Doughnut {...ventasPorCategoriaConfig} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Productos Más Vendidos</h5>
              <div style={{ height: '400px' }}>
                <Bar {...productosMasVendidosConfig} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de productos más vendidos */}
      <div className="card mt-4">
        <div className="card-header">
          <h5 className="mb-0">Detalle de Productos Más Vendidos</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Cantidad Vendida</th>
                  <th>Total Ventas</th>
                </tr>
              </thead>
              <tbody>
                {datos.productosMasVendidos.map((producto, index) => (
                  <tr key={index}>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="badge bg-primary me-2">#{index + 1}</span>
                        {producto.nombre}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-secondary">{producto.categoria}</span>
                    </td>
                    <td>
                      <span className="fw-bold text-primary">{producto.cantidad_vendida}</span>
                    </td>
                    <td>
                      <span className="fw-bold text-success">
                        {formatCurrency(producto.total_ventas)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="position-fixed top-50 start-50 translate-middle">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reportes;
