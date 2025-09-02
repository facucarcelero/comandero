import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/format';
import Swal from 'sweetalert2';

const Config: React.FC = () => {
  const [activeTab, setActiveTab] = useState('empresa');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<any>({});

  // Configuraciones por sección
  const [empresaConfig, setEmpresaConfig] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    ruc: ''
  });

  const [fiscalConfig, setFiscalConfig] = useState({
    iva_porcentaje: 19,
    moneda: 'COP',
    moneda_simbolo: '$'
  });

  const [impresoraConfig, setImpresoraConfig] = useState({
    tipo: 'usb',
    puerto: '',
    ancho: 58,
    test_print: true
  });

  const [appConfig, setAppConfig] = useState({
    tema: 'light',
    idioma: 'es',
    auto_backup: true,
    backup_interval: 24
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const allSettings = await api.getAllSettings();
      setSettings(allSettings);

      // Cargar configuraciones específicas
      setEmpresaConfig({
        nombre: allSettings.empresa_nombre || '',
        direccion: allSettings.empresa_direccion || '',
        telefono: allSettings.empresa_telefono || '',
        email: allSettings.empresa_email || '',
        ruc: allSettings.empresa_ruc || ''
      });

      setFiscalConfig({
        iva_porcentaje: allSettings.iva_porcentaje || 19,
        moneda: allSettings.moneda || 'COP',
        moneda_simbolo: allSettings.moneda_simbolo || '$'
      });

      setImpresoraConfig({
        tipo: allSettings.impresora_tipo || 'usb',
        puerto: allSettings.impresora_puerto || '',
        ancho: allSettings.impresora_ancho || 58,
        test_print: allSettings.impresora_test_print || false
      });

      setAppConfig({
        tema: allSettings.tema || 'light',
        idioma: allSettings.idioma || 'es',
        auto_backup: allSettings.auto_backup !== false,
        backup_interval: allSettings.backup_interval || 24
      });
    } catch (error) {
      console.error('Error al cargar configuraciones:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las configuraciones',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEmpresa = async () => {
    try {
      setIsLoading(true);
      await api.setSetting('empresa_nombre', empresaConfig.nombre);
      await api.setSetting('empresa_direccion', empresaConfig.direccion);
      await api.setSetting('empresa_telefono', empresaConfig.telefono);
      await api.setSetting('empresa_email', empresaConfig.email);
      await api.setSetting('empresa_ruc', empresaConfig.ruc);

      Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: 'La información de la empresa se ha guardado correctamente',
        confirmButtonText: 'Entendido'
      });
    } catch (error) {
      console.error('Error al guardar configuración de empresa:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar la configuración',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFiscal = async () => {
    try {
      setIsLoading(true);
      await api.setSetting('iva_porcentaje', fiscalConfig.iva_porcentaje);
      await api.setSetting('moneda', fiscalConfig.moneda);
      await api.setSetting('moneda_simbolo', fiscalConfig.moneda_simbolo);

      Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: 'La configuración fiscal se ha guardado correctamente',
        confirmButtonText: 'Entendido'
      });
    } catch (error) {
      console.error('Error al guardar configuración fiscal:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar la configuración',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveImpresora = async () => {
    try {
      setIsLoading(true);
      await api.setSetting('impresora_tipo', impresoraConfig.tipo);
      await api.setSetting('impresora_puerto', impresoraConfig.puerto);
      await api.setSetting('impresora_ancho', impresoraConfig.ancho);
      await api.setSetting('impresora_test_print', impresoraConfig.test_print);

      Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: 'La configuración de la impresora se ha guardado correctamente',
        confirmButtonText: 'Entendido'
      });
    } catch (error) {
      console.error('Error al guardar configuración de impresora:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar la configuración',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestImpresora = async () => {
    try {
      setIsLoading(true);
      const success = await api.testImpresora();
      
      if (success) {
        Swal.fire({
          icon: 'success',
          title: 'Test exitoso',
          text: 'La impresora está funcionando correctamente',
          confirmButtonText: 'Entendido'
        });
      } else {
        throw new Error('Error en el test');
      }
    } catch (error) {
      console.error('Error en test de impresora:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo realizar el test de la impresora',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApp = async () => {
    try {
      setIsLoading(true);
      await api.setSetting('tema', appConfig.tema);
      await api.setSetting('idioma', appConfig.idioma);
      await api.setSetting('auto_backup', appConfig.auto_backup);
      await api.setSetting('backup_interval', appConfig.backup_interval);

      Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: 'La configuración de la aplicación se ha guardado correctamente',
        confirmButtonText: 'Entendido'
      });
    } catch (error) {
      console.error('Error al guardar configuración de app:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar la configuración',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupExport = async () => {
    try {
      const result = await api.saveFileDialog({
        title: 'Exportar backup',
        defaultPath: `backup-${new Date().toISOString().split('T')[0]}.json`,
        filters: [
          { name: 'JSON', extensions: ['json'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        setIsLoading(true);
        const exportResult = await api.exportData(result.filePath);
        
        if (exportResult.success) {
          Swal.fire({
            icon: 'success',
            title: 'Backup exportado',
            text: 'El backup se ha exportado correctamente',
            confirmButtonText: 'Entendido'
          });
        } else {
          throw new Error(exportResult.error);
        }
      }
    } catch (error) {
      console.error('Error al exportar backup:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo exportar el backup',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupImport = async () => {
    try {
      const result = await api.openFileDialog({
        title: 'Importar backup',
        filters: [
          { name: 'JSON', extensions: ['json'] }
        ],
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        
        const confirmResult = await Swal.fire({
          title: 'Importar backup',
          text: '¿Está seguro de importar este backup? Esto sobrescribirá los datos actuales.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, importar',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#dc3545'
        });

        if (confirmResult.isConfirmed) {
          setIsLoading(true);
          const importResult = await api.importData(filePath);
          
          if (importResult.success) {
            Swal.fire({
              icon: 'success',
              title: 'Backup importado',
              text: 'El backup se ha importado correctamente',
              confirmButtonText: 'Entendido'
            });
            loadSettings();
          } else {
            throw new Error(importResult.error);
          }
        }
      }
    } catch (error) {
      console.error('Error al importar backup:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo importar el backup',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'empresa', label: 'Empresa', icon: 'bi-building' },
    { id: 'fiscal', label: 'Fiscal', icon: 'bi-calculator' },
    { id: 'impresora', label: 'Impresora', icon: 'bi-printer' },
    { id: 'app', label: 'Aplicación', icon: 'bi-gear' },
    { id: 'backup', label: 'Backup', icon: 'bi-cloud-arrow-down' }
  ];

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
            <h1>Configuración</h1>
            <p className="text-muted mb-0">Ajustes del sistema</p>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Navegación de pestañas */}
        <div className="col-lg-3">
          <div className="card">
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`list-group-item list-group-item-action d-flex align-items-center ${
                      activeTab === tab.id ? 'active' : ''
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <i className={`${tab.icon} me-2`}></i>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido de las pestañas */}
        <div className="col-lg-9">
          {/* Empresa */}
          {activeTab === 'empresa' && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-building me-2"></i>
                  Información de la Empresa
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Nombre de la Empresa *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={empresaConfig.nombre}
                      onChange={(e) => setEmpresaConfig({ ...empresaConfig, nombre: e.target.value })}
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Dirección</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={empresaConfig.direccion}
                      onChange={(e) => setEmpresaConfig({ ...empresaConfig, direccion: e.target.value })}
                      placeholder="Dirección de la empresa"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="text"
                      className="form-control"
                      value={empresaConfig.telefono}
                      onChange={(e) => setEmpresaConfig({ ...empresaConfig, telefono: e.target.value })}
                      placeholder="Número de teléfono"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={empresaConfig.email}
                      onChange={(e) => setEmpresaConfig({ ...empresaConfig, email: e.target.value })}
                      placeholder="Correo electrónico"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">RUC</label>
                    <input
                      type="text"
                      className="form-control"
                      value={empresaConfig.ruc}
                      onChange={(e) => setEmpresaConfig({ ...empresaConfig, ruc: e.target.value })}
                      placeholder="Número de RUC"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveEmpresa}
                  >
                    <i className="bi bi-check me-2"></i>
                    Guardar Configuración
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fiscal */}
          {activeTab === 'fiscal' && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-calculator me-2"></i>
                  Configuración Fiscal
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Porcentaje de IVA</label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        value={fiscalConfig.iva_porcentaje}
                        onChange={(e) => setFiscalConfig({ ...fiscalConfig, iva_porcentaje: Number(e.target.value) })}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <span className="input-group-text">%</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Moneda</label>
                    <select
                      className="form-select"
                      value={fiscalConfig.moneda}
                      onChange={(e) => setFiscalConfig({ ...fiscalConfig, moneda: e.target.value })}
                    >
                      <option value="COP">Peso Colombiano (COP)</option>
                      <option value="USD">Dólar Americano (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Símbolo de Moneda</label>
                    <input
                      type="text"
                      className="form-control"
                      value={fiscalConfig.moneda_simbolo}
                      onChange={(e) => setFiscalConfig({ ...fiscalConfig, moneda_simbolo: e.target.value })}
                      placeholder="$"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveFiscal}
                  >
                    <i className="bi bi-check me-2"></i>
                    Guardar Configuración
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Impresora */}
          {activeTab === 'impresora' && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-printer me-2"></i>
                  Configuración de Impresora
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Tipo de Impresora</label>
                    <select
                      className="form-select"
                      value={impresoraConfig.tipo}
                      onChange={(e) => setImpresoraConfig({ ...impresoraConfig, tipo: e.target.value })}
                    >
                      <option value="usb">USB</option>
                      <option value="ethernet">Ethernet/Red</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Puerto/IP</label>
                    <input
                      type="text"
                      className="form-control"
                      value={impresoraConfig.puerto}
                      onChange={(e) => setImpresoraConfig({ ...impresoraConfig, puerto: e.target.value })}
                      placeholder={impresoraConfig.tipo === 'usb' ? 'Puerto USB' : 'IP de la impresora'}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Ancho de Papel</label>
                    <select
                      className="form-select"
                      value={impresoraConfig.ancho}
                      onChange={(e) => setImpresoraConfig({ ...impresoraConfig, ancho: Number(e.target.value) })}
                    >
                      <option value={58}>58mm</option>
                      <option value={80}>80mm</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Test de Impresión</label>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="testPrint"
                        checked={impresoraConfig.test_print}
                        onChange={(e) => setImpresoraConfig({ ...impresoraConfig, test_print: e.target.checked })}
                      />
                      <label className="form-check-label" htmlFor="testPrint">
                        Habilitar test automático
                      </label>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <button
                    className="btn btn-primary me-2"
                    onClick={handleSaveImpresora}
                  >
                    <i className="bi bi-check me-2"></i>
                    Guardar Configuración
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handleTestImpresora}
                  >
                    <i className="bi bi-printer me-2"></i>
                    Test de Impresión
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Aplicación */}
          {activeTab === 'app' && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-gear me-2"></i>
                  Configuración de la Aplicación
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Tema</label>
                    <select
                      className="form-select"
                      value={appConfig.tema}
                      onChange={(e) => setAppConfig({ ...appConfig, tema: e.target.value })}
                    >
                      <option value="light">Claro</option>
                      <option value="dark">Oscuro</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Idioma</label>
                    <select
                      className="form-select"
                      value={appConfig.idioma}
                      onChange={(e) => setAppConfig({ ...appConfig, idioma: e.target.value })}
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="autoBackup"
                        checked={appConfig.auto_backup}
                        onChange={(e) => setAppConfig({ ...appConfig, auto_backup: e.target.checked })}
                      />
                      <label className="form-check-label" htmlFor="autoBackup">
                        Backup automático
                      </label>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Intervalo de Backup (horas)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={appConfig.backup_interval}
                      onChange={(e) => setAppConfig({ ...appConfig, backup_interval: Number(e.target.value) })}
                      min="1"
                      max="168"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveApp}
                  >
                    <i className="bi bi-check me-2"></i>
                    Guardar Configuración
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Backup */}
          {activeTab === 'backup' && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-cloud-arrow-down me-2"></i>
                  Gestión de Backup
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12">
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      Los backups incluyen todos los datos: productos, órdenes, configuraciones y reportes.
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-body text-center">
                        <i className="bi bi-upload display-4 text-primary mb-3"></i>
                        <h5>Exportar Backup</h5>
                        <p className="text-muted">Crear una copia de seguridad de todos los datos</p>
                        <button
                          className="btn btn-primary"
                          onClick={handleBackupExport}
                        >
                          <i className="bi bi-download me-2"></i>
                          Exportar
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-body text-center">
                        <i className="bi bi-download display-4 text-success mb-3"></i>
                        <h5>Importar Backup</h5>
                        <p className="text-muted">Restaurar datos desde un archivo de backup</p>
                        <button
                          className="btn btn-success"
                          onClick={handleBackupImport}
                        >
                          <i className="bi bi-upload me-2"></i>
                          Importar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Config;
