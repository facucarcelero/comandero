import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Producto } from '../types/global';
import { formatCurrency } from '../lib/format';
import Swal from 'sweetalert2';

const Inventario: React.FC = () => {
  console.log('📦 Inventario component rendering...');
  
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [filtros, setFiltros] = useState({
    categoria: '',
    busqueda: '',
    soloActivos: true
  });
  const [mostrandoCategorias, setMostrandoCategorias] = useState<boolean>(true);

  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    precio: 0,
    stock: 0,
    activo: true
  });

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
    try {
      setIsLoading(true);
      const data = await api.getProductos();
      setProductos(data);
      
      // Extraer categorías únicas
      const categoriasUnicas = [...new Set(data.map(p => p.categoria))].filter(Boolean);
      setCategorias(categoriasUnicas);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los productos',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoriaClick = (categoria: string) => {
    setFiltros(prev => ({ ...prev, categoria }));
    setMostrandoCategorias(false);
  };

  const handleVolverCategorias = () => {
    setMostrandoCategorias(true);
    setFiltros(prev => ({ ...prev, categoria: '', busqueda: '' }));
  };

  const handleNuevaCategoria = async () => {
    const { value: nombreCategoria } = await Swal.fire({
      title: 'Nueva Categoría',
      text: 'Ingrese el nombre de la nueva categoría:',
      input: 'text',
      inputLabel: 'Nombre de la categoría:',
      inputPlaceholder: 'Ej: Bebidas, Comidas, etc.',
      inputValidator: (value) => {
        if (!value || value.trim().length < 2) {
          return 'Debe ingresar un nombre de al menos 2 caracteres';
        }
        if (categorias.includes(value.trim())) {
          return 'Esta categoría ya existe';
        }
      },
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745'
    });

    if (nombreCategoria) {
      // Agregar la nueva categoría a la lista
      const nuevaCategoria = nombreCategoria.trim();
      setCategorias(prev => [...prev, nuevaCategoria]);
      
      // Si estamos en el modal de crear producto, seleccionar la nueva categoría
      if (showModal) {
        setFormData(prev => ({ ...prev, categoria: nuevaCategoria }));
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Categoría creada',
        text: `La categoría "${nuevaCategoria}" ha sido agregada y está lista para usar.`,
        confirmButtonText: 'Entendido'
      });
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setFormData({
      nombre: '',
      categoria: '',
      precio: 0,
      stock: 0,
      activo: true
    });
    setShowModal(true);
  };

  const handleEditProduct = (producto: Producto) => {
    setEditingProduct(producto);
    setFormData({
      nombre: producto.nombre,
      categoria: producto.categoria,
      precio: producto.precio,
      stock: producto.stock,
      activo: producto.activo
    });
    setShowModal(true);
  };

  const handleSaveProduct = async () => {
    try {
      if (!formData.nombre.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Campo requerido',
          text: 'El nombre del producto es obligatorio',
          confirmButtonText: 'Entendido'
        });
        return;
      }

      if (formData.precio <= 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Precio inválido',
          text: 'El precio debe ser mayor a 0',
          confirmButtonText: 'Entendido'
        });
        return;
      }

      if (formData.stock < 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Stock inválido',
          text: 'El stock no puede ser negativo',
          confirmButtonText: 'Entendido'
        });
        return;
      }

      if (editingProduct) {
        await api.updateProducto(editingProduct.id!, formData);
        Swal.fire({
          icon: 'success',
          title: 'Producto actualizado',
          text: 'El producto se ha actualizado correctamente',
          confirmButtonText: 'Entendido'
        });
      } else {
        await api.createProducto(formData);
        Swal.fire({
          icon: 'success',
          title: 'Producto creado',
          text: 'El producto se ha creado correctamente',
          confirmButtonText: 'Entendido'
        });
      }

      setShowModal(false);
      loadProductos();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar el producto',
        confirmButtonText: 'Entendido'
      });
    }
  };

  const handleDeleteProduct = async (producto: Producto) => {
    const result = await Swal.fire({
      title: '¿Eliminar producto?',
      text: `¿Está seguro de eliminar "${producto.nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    });

    if (result.isConfirmed) {
      try {
        await api.deleteProducto(producto.id!);
        Swal.fire({
          icon: 'success',
          title: 'Producto eliminado',
          text: 'El producto se ha eliminado correctamente',
          confirmButtonText: 'Entendido'
        });
        loadProductos();
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el producto',
          confirmButtonText: 'Entendido'
        });
      }
    }
  };

  const handleImportProducts = async () => {
    try {
      const result = await api.dialog.openFile({
        title: 'Importar productos',
        filters: [
          { name: 'JSON', extensions: ['json'] },
          { name: 'CSV', extensions: ['csv'] }
        ]
      });

      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        
        // Leer el archivo
        const fs = require('fs');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const productosData = JSON.parse(fileContent);
        
        // Validar que sea un array de productos
        if (Array.isArray(productosData)) {
          const importados = await api.importProductos(productosData);
          
          Swal.fire({
            icon: 'success',
            title: 'Productos importados',
            text: `Se importaron ${importados} productos correctamente`,
            confirmButtonText: 'Entendido'
          });
          
          // Recargar la lista de productos
          loadProductos();
        } else {
          throw new Error('El archivo debe contener un array de productos');
        }
      }
    } catch (error) {
      console.error('Error al importar productos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo importar los productos',
        confirmButtonText: 'Entendido'
      });
    }
  };

  const handleExportProducts = async () => {
    try {
      const result = await api.dialog.saveFile({
        title: 'Exportar productos',
        defaultPath: `productos-${new Date().toISOString().split('T')[0]}.json`,
        filters: [
          { name: 'JSON', extensions: ['json'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        // Exportar productos a JSON
        const productosData = productos.map(p => ({
          nombre: p.nombre,
          categoria: p.categoria,
          precio: p.precio,
          stock: p.stock,
          activo: p.activo
        }));

        const fs = require('fs');
        fs.writeFileSync(result.filePath, JSON.stringify(productosData, null, 2));
        
        Swal.fire({
          icon: 'success',
          title: 'Productos exportados',
          text: `Se exportaron ${productosData.length} productos correctamente`,
          confirmButtonText: 'Entendido'
        });
      }
    } catch (error) {
      console.error('Error al exportar productos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo exportar los productos',
        confirmButtonText: 'Entendido'
      });
    }
  };

  // Filtrar productos
  const productosFiltrados = productos.filter(producto => {
    const matchesCategoria = !filtros.categoria || producto.categoria === filtros.categoria;
    const matchesBusqueda = !filtros.busqueda || 
      producto.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase());
    const matchesActivo = !filtros.soloActivos || producto.activo;
    
    return matchesCategoria && matchesBusqueda && matchesActivo;
  });

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
            <h1>Inventario</h1>
            <p className="text-muted mb-0">Gestión de productos</p>
          </div>
          <div>
            {mostrandoCategorias && (
              <button
                className="btn btn-outline-success me-2"
                onClick={handleNuevaCategoria}
              >
                <i className="bi bi-tag me-2"></i>
                Nueva Categoría
              </button>
            )}
            <button
              className="btn btn-outline-primary me-2"
              onClick={handleImportProducts}
            >
              <i className="bi bi-upload me-2"></i>
              Importar
            </button>
            <button
              className="btn btn-outline-secondary me-2"
              onClick={handleExportProducts}
            >
              <i className="bi bi-download me-2"></i>
              Exportar
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateProduct}
            >
              <i className="bi bi-plus me-2"></i>
              Nuevo Producto
            </button>
          </div>
        </div>
      </div>

      {mostrandoCategorias ? (
        // Vista de categorías
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-tags me-2"></i>
              Categorías de Productos
            </h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {categorias.map(categoria => {
                const productosEnCategoria = productos.filter(p => p.categoria === categoria);
                return (
                  <div key={categoria} className="col-md-6 col-lg-4">
                    <div
                      className="card h-100 cursor-pointer"
                      onClick={() => handleCategoriaClick(categoria)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="card-body text-center">
                        <i className="bi bi-tag text-success" style={{ fontSize: '2rem' }}></i>
                        <h6 className="card-title mt-2">{categoria}</h6>
                        <p className="card-text text-muted">
                          {productosEnCategoria.length} productos
                        </p>
                        <span className="badge bg-success">
                          {productosEnCategoria.length} items
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        // Vista de productos
        <>
          {/* Filtros */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-funnel me-2"></i>
                Filtros - {filtros.categoria || 'Todas las categorías'}
              </h5>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={handleVolverCategorias}
              >
                <i className="bi bi-arrow-left me-1"></i>
                Volver a categorías
              </button>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Buscar</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nombre del producto..."
                    value={filtros.busqueda}
                    onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Estado</label>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="soloActivos"
                      checked={filtros.soloActivos}
                      onChange={(e) => setFiltros({ ...filtros, soloActivos: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="soloActivos">
                      Solo productos activos
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tabla de productos */}
      {!mostrandoCategorias && (
        <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map(producto => (
                  <tr key={producto.id}>
                    <td>
                      <div>
                        <div className="fw-bold">{producto.nombre}</div>
                        <small className="text-muted">
                          ID: {producto.id}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-secondary">
                        {producto.categoria}
                      </span>
                    </td>
                    <td>
                      <span className="fw-bold text-success">
                        {formatCurrency(producto.precio)}
                      </span>
                    </td>
                    <td>
                      <span className={`fw-bold ${producto.stock <= 0 ? 'text-danger' : 'text-primary'}`}>
                        {producto.stock}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${producto.activo ? 'bg-success' : 'bg-danger'}`}>
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group" role="group">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => handleEditProduct(producto)}
                          title="Editar"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDeleteProduct(producto)}
                          title="Eliminar"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {productosFiltrados.length === 0 && (
            <div className="text-center text-muted py-4">
              <i className="bi bi-box-seam display-4 mb-3"></i>
              <h5>No se encontraron productos</h5>
              <p>Intenta con otros filtros o crea un nuevo producto</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Modal de producto */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Nombre *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Nombre del producto"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Categoría</label>
                    <div className="input-group">
                      <select
                        className="form-select"
                        value={formData.categoria}
                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      >
                        <option value="">Seleccionar categoría</option>
                        {categorias.map(categoria => (
                          <option key={categoria} value={categoria}>
                            {categoria}
                          </option>
                        ))}
                      </select>
                      <button
                        className="btn btn-outline-success"
                        type="button"
                        onClick={handleNuevaCategoria}
                        title="Crear nueva categoría"
                      >
                        <i className="bi bi-plus"></i>
                      </button>
                    </div>
                    <small className="form-text text-muted">
                      Selecciona una categoría existente o crea una nueva
                    </small>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Precio *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.precio}
                      onChange={(e) => setFormData({ ...formData, precio: Number(e.target.value) })}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Stock</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Estado</label>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="activo"
                        checked={formData.activo}
                        onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      />
                      <label className="form-check-label" htmlFor="activo">
                        Activo
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveProduct}
                >
                  {editingProduct ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;
