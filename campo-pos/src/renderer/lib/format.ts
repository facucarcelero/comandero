// Utilidades de formateo para la aplicación

export const formatCurrency = (amount: number, currency = 'ARS'): string => {
  // Mapear símbolos a códigos de moneda
  const currencyMap: Record<string, string> = {
    '$': 'ARS',
    'ARS': 'ARS',
    'USD': 'USD',
    'COP': 'COP'
  };
  
  const currencyCode = currencyMap[currency] || currency;
  
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatNumber = (number: number): string => {
  return new Intl.NumberFormat('es-AR').format(number);
};

export const formatDate = (date: string | Date): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Fecha inválida';
  return d.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateOnly = (date: string | Date): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Fecha inválida';
  return d.toLocaleDateString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatTime = (date: string | Date): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Hora inválida';
  return d.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateTime = (date: string | Date): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Fecha inválida';
  return d.toLocaleString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const formatRelativeTime = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'hace un momento';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `hace ${days} día${days > 1 ? 's' : ''}`;
  }
};

export const formatPhone = (phone: string): string => {
  // Formatear número de teléfono colombiano
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

export const formatRUC = (ruc: string): string => {
  // Formatear RUC colombiano
  const cleaned = ruc.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  }
  return ruc;
};

export const formatPercentage = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

export const formatOrderNumber = (id: number): string => {
  return `#${id.toString().padStart(6, '0')}`;
};

export const formatTableNumber = (mesa: string | number): string => {
  if (typeof mesa === 'number') {
    return `Mesa ${mesa}`;
  }
  return mesa || 'S/N';
};

export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pendiente: 'Pendiente',
    preparando: 'Preparando',
    entregada: 'Entregada',
    cancelada: 'Cancelada',
    abierta: 'Abierta',
    cerrada: 'Cerrada'
  };
  
  return statusMap[status] || status;
};

export const formatPaymentMethod = (method: string): string => {
  const methodMap: Record<string, string> = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia'
  };
  
  return methodMap[method] || method;
};

export const formatPrinterType = (type: string): string => {
  const typeMap: Record<string, string> = {
    usb: 'USB',
    ethernet: 'Ethernet'
  };
  
  return typeMap[type] || type;
};

export const formatPrinterWidth = (width: number): string => {
  return `${width}mm`;
};

// Utilidades de validación
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

export const isValidRUC = (ruc: string): boolean => {
  const rucRegex = /^[0-9]{9}$/;
  return rucRegex.test(ruc.replace(/\D/g, ''));
};

export const isValidPrice = (price: number): boolean => {
  return price >= 0 && !isNaN(price);
};

export const isValidStock = (stock: number): boolean => {
  return Number.isInteger(stock) && stock >= 0;
};

// Utilidades de cálculo
export const calculateIVA = (subtotal: number, ivaPercentage: number): number => {
  return Math.round(subtotal * (ivaPercentage / 100));
};

export const calculateTotal = (subtotal: number, iva: number): number => {
  return subtotal + iva;
};

export const calculateSubtotal = (items: Array<{ cantidad: number; precio: number }>): number => {
  return items.reduce((total, item) => total + (item.cantidad * item.precio), 0);
};

export const calculateItemSubtotal = (cantidad: number, precio: number): number => {
  return cantidad * precio;
};

// Utilidades de texto
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 5);
  return `${timestamp.slice(-6)}${random}`.toUpperCase();
};

// Utilidades de fecha
export const getToday = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getYesterday = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

export const getWeekAgo = (): string => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return weekAgo.toISOString().split('T')[0];
};

export const getMonthAgo = (): string => {
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  return monthAgo.toISOString().split('T')[0];
};

export const isToday = (date: string | Date): boolean => {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

export const isYesterday = (date: string | Date): boolean => {
  const d = new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toDateString() === yesterday.toDateString();
};
