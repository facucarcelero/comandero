// Configuración de Chart.js para reportes

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartOptions
} from 'chart.js';

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

// Colores del tema
export const chartColors = {
  primary: '#007bff',
  secondary: '#6c757d',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  light: '#f8f9fa',
  dark: '#343a40',
  colors: [
    '#007bff',
    '#28a745',
    '#ffc107',
    '#dc3545',
    '#17a2b8',
    '#6f42c1',
    '#e83e8c',
    '#fd7e14',
    '#20c997',
    '#6c757d'
  ]
};

// Configuración por defecto para gráficos
export const defaultChartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 20
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: 'white',
      bodyColor: 'white',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      cornerRadius: 6,
      displayColors: true,
      callbacks: {
        label: function(context) {
          const label = context.dataset.label || '';
          const value = context.parsed.y || context.parsed;
          return `${label}: ${formatCurrency(value)}`;
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: '#6c757d'
      }
    },
    y: {
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      },
      ticks: {
        color: '#6c757d',
        callback: function(value) {
          return formatCurrency(Number(value));
        }
      }
    }
  }
};

// Función para formatear moneda (importada desde format.ts)
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Configuración para gráfico de barras de ventas por fecha
export const getVentasPorFechaConfig = (data: any[]) => {
  return {
    type: 'bar' as const,
    data: {
      labels: data.map(item => item.fecha),
      datasets: [
        {
          label: 'Ventas',
          data: data.map(item => item.total_ventas),
          backgroundColor: chartColors.colors[0],
          borderColor: chartColors.colors[0],
          borderWidth: 1
        }
      ]
    },
    options: {
      ...defaultChartOptions,
      plugins: {
        ...defaultChartOptions.plugins,
        title: {
          display: true,
          text: 'Ventas por Fecha',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      }
    }
  };
};

// Configuración para gráfico de barras de ventas por categoría
export const getVentasPorCategoriaConfig = (data: any[]) => {
  return {
    type: 'bar' as const,
    data: {
      labels: data.map(item => item.categoria),
      datasets: [
        {
          label: 'Ventas',
          data: data.map(item => item.total_ventas),
          backgroundColor: chartColors.colors.slice(0, data.length),
          borderColor: chartColors.colors.slice(0, data.length),
          borderWidth: 1
        }
      ]
    },
    options: {
      ...defaultChartOptions,
      plugins: {
        ...defaultChartOptions.plugins,
        title: {
          display: true,
          text: 'Ventas por Categoría',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      }
    }
  };
};

// Configuración para gráfico de líneas de tendencia de ventas
export const getTendenciaVentasConfig = (data: any[]) => {
  return {
    type: 'line' as const,
    data: {
      labels: data.map(item => item.fecha),
      datasets: [
        {
          label: 'Ventas',
          data: data.map(item => item.total_ventas),
          borderColor: chartColors.success,
          backgroundColor: chartColors.success + '20',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: chartColors.success,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6
        }
      ]
    },
    options: {
      ...defaultChartOptions,
      plugins: {
        ...defaultChartOptions.plugins,
        title: {
          display: true,
          text: 'Tendencia de Ventas',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      }
    }
  };
};

// Configuración para gráfico de dona de métodos de pago
export const getMetodosPagoConfig = (data: any[]) => {
  return {
    type: 'doughnut' as const,
    data: {
      labels: data.map(item => item.metodo),
      datasets: [
        {
          data: data.map(item => item.total),
          backgroundColor: chartColors.colors.slice(0, data.length),
          borderColor: '#fff',
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            usePointStyle: true,
            padding: 20
          }
        },
        title: {
          display: true,
          text: 'Métodos de Pago',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          cornerRadius: 6,
          displayColors: true,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
            }
          }
        }
      }
    }
  };
};

// Configuración para gráfico de barras horizontales de productos más vendidos
export const getProductosMasVendidosConfig = (data: any[]) => {
  return {
    type: 'bar' as const,
    data: {
      labels: data.map(item => item.nombre),
      datasets: [
        {
          label: 'Cantidad Vendida',
          data: data.map(item => item.cantidad_vendida),
          backgroundColor: chartColors.colors.slice(0, data.length),
          borderColor: chartColors.colors.slice(0, data.length),
          borderWidth: 1
        }
      ]
    },
    options: {
      indexAxis: 'y' as const,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Productos Más Vendidos',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          cornerRadius: 6,
          displayColors: true,
          callbacks: {
            label: function(context) {
              const value = context.parsed.x;
              return `Cantidad: ${value} unidades`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            color: '#6c757d'
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            color: '#6c757d'
          }
        }
      }
    }
  };
};

// Configuración para gráfico de comparación de períodos
export const getComparacionPeriodosConfig = (data: any[]) => {
  return {
    type: 'bar' as const,
    data: {
      labels: data.map(item => item.periodo),
      datasets: [
        {
          label: 'Ventas',
          data: data.map(item => item.total_ventas),
          backgroundColor: chartColors.primary,
          borderColor: chartColors.primary,
          borderWidth: 1
        },
        {
          label: 'Órdenes',
          data: data.map(item => item.total_ordenes),
          backgroundColor: chartColors.success,
          borderColor: chartColors.success,
          borderWidth: 1
        }
      ]
    },
    options: {
      ...defaultChartOptions,
      plugins: {
        ...defaultChartOptions.plugins,
        title: {
          display: true,
          text: 'Comparación de Períodos',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      }
    }
  };
};

// Función para generar colores aleatorios
export const generateRandomColors = (count: number): string[] => {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const hue = (i * 360) / count;
    colors.push(`hsl(${hue}, 70%, 50%)`);
  }
  return colors;
};

// Función para crear configuración personalizada
export const createCustomChartConfig = (
  type: 'bar' | 'line' | 'doughnut' | 'pie',
  data: any,
  options: any = {}
) => {
  const baseConfig = {
    type,
    data,
    options: {
      ...defaultChartOptions,
      ...options
    }
  };

  return baseConfig;
};
