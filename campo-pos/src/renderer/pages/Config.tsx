import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api';
import { formatCurrency } from '../lib/format';
import Swal from 'sweetalert2';

const Config: React.FC = () => {
  const [activeTab, setActiveTab] = useState('empresa');
  const [isLoading, setIsLoading] = useState(false);
  const [, setSettings] = useState<any>({});
  
  // Usar el store centralizado
  const { config, setVAT, setCurrency } = useAppStore(state => ({
    config: state.config,
    setVAT: state.setVAT,
    setCurrency: state.setCurrency
  }));

  // Configuraciones por sección
  const [empresaConfig, setEmpresaConfig] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    ruc: ''
  });

  const [fiscalConfig, setFiscalConfig] = useState({
    iva_porcentaje: Math.round(config.vatRate * 100),
    moneda: config.currency,
    moneda_simbolo: config.currencySymbol
  });

  const [impresoraConfig, setImpresoraConfig] = useState({
    puerto: '',
    test_print: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  // Actualizar fiscalConfig cuando cambie el config del store
  useEffect(() => {
    setFiscalConfig({
      iva_porcentaje: Math.round(config.vatRate * 100),
      moneda: config.currency,
      moneda_simbolo: config.currencySymbol
    });
  }, [config]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const allSettings = await api.getAllSettings();
      
      const settingsMap = allSettings.reduce((acc: any, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as any);

      setSettings(settingsMap);
      
      // Configurar valores por defecto
      setEmpresaConfig({
        nombre: settingsMap.empresa_nombre || '',
        direccion: settingsMap.empresa_direccion || '',
        telefono: settingsMap.empresa_telefono || '',
        email: settingsMap.empresa_email || '',
        ruc: settingsMap.empresa_ruc || ''
      });

      setImpresoraConfig({
        puerto: settingsMap.impresora_puerto || '',
        test_print: settingsMap.impresora_test_print !== false
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

  const handleSaveEmpresa = useCallback(async () => {
    try {
      setIsLoading(true);
      
      await Promise.all([
        api.setSetting('empresa_nombre', empresaConfig.nombre),
        api.setSetting('empresa_direccion', empresaConfig.direccion),
        api.setSetting('empresa_telefono', empresaConfig.telefono),
        api.setSetting('empresa_email', empresaConfig.email),
        api.setSetting('empresa_ruc', empresaConfig.ruc)
      ]);
      
      Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: 'La configuración de empresa se ha guardado correctamente',
        confirmButtonText: 'Entendido'
      });
    } catch (error) {
      console.error('Error al guardar configuración de empresa:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar la configuración de empresa',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setIsLoading(false);
    }
  }, [empresaConfig]);

  const handleSaveFiscal = useCallback(async () => {
    // Validar IVA
    if (fiscalConfig.iva_porcentaje < 0 || fiscalConfig.iva_porcentaje > 100) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El porcentaje de IVA debe estar entre 0 y 100',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Actualizar IVA usando el store
      await setVAT(fiscalConfig.iva_porcentaje / 100);
      
      // Actualizar moneda usando el store
      await setCurrency(fiscalConfig.moneda, fiscalConfig.moneda_simbolo);

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
        text: 'No se pudo guardar la configuración fiscal',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setIsLoading(false);
    }
  }, [fiscalConfig, setVAT, setCurrency]);

  const handleSaveImpresora = useCallback(async () => {
    try {
      setIsLoading(true);
      
      await Promise.all([
        api.setSetting('impresora_puerto', impresoraConfig.puerto),
        api.setSetting('impresora_test_print', impresoraConfig.test_print)
      ]);
      
      Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: 'La configuración de impresora se ha guardado correctamente',
        confirmButtonText: 'Entendido'
      });
    } catch (error) {
      console.error('Error al guardar configuración de impresora:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar la configuración de impresora',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setIsLoading(false);
    }
  }, [impresoraConfig]);

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="bi bi-gear me-2"></i>
                Configuración del Sistema
              </h4>
            </div>
            <div className="card-body">
              {/* Navegación por pestañas */}
              <ul className="nav nav-tabs mb-4">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'empresa' ? 'active' : ''}`}
                    onClick={() => setActiveTab('empresa')}
                    style={{ 
                      backgroundColor: activeTab === 'empresa' ? '#0d6efd' : '#f8f9fa',
                      color: activeTab === 'empresa' ? '#fff' : '#000',
                      border: '1px solid #dee2e6',
                      borderBottom: activeTab === 'empresa' ? '1px solid #0d6efd' : '1px solid #dee2e6'
                    }}
                  >
                    <i className="bi bi-building me-2"></i>
                    Empresa
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'fiscal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('fiscal')}
                    style={{ 
                      backgroundColor: activeTab === 'fiscal' ? '#0d6efd' : '#f8f9fa',
                      color: activeTab === 'fiscal' ? '#fff' : '#000',
                      border: '1px solid #dee2e6',
                      borderBottom: activeTab === 'fiscal' ? '1px solid #0d6efd' : '1px solid #dee2e6'
                    }}
                  >
                    <i className="bi bi-calculator me-2"></i>
                    Configuración Fiscal
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'impresora' ? 'active' : ''}`}
                    onClick={() => setActiveTab('impresora')}
                    style={{ 
                      backgroundColor: activeTab === 'impresora' ? '#0d6efd' : '#f8f9fa',
                      color: activeTab === 'impresora' ? '#fff' : '#000',
                      border: '1px solid #dee2e6',
                      borderBottom: activeTab === 'impresora' ? '1px solid #0d6efd' : '1px solid #dee2e6'
                    }}
                  >
                    <i className="bi bi-printer me-2"></i>
                    Impresora
                  </button>
                </li>
              </ul>

              {/* Contenido de pestañas */}
              {activeTab === 'empresa' && (
                <div className="row">
                  <div className="col-md-6">
                    <h5>Información de la Empresa</h5>
                    <div className="mb-3">
                      <label className="form-label">Nombre de la Empresa</label>
                      <input
                        type="text"
                        className="form-control"
                        value={empresaConfig.nombre}
                        onChange={(e) => setEmpresaConfig({...empresaConfig, nombre: e.target.value})}
                        placeholder="Ingrese el nombre de la empresa"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Dirección</label>
                      <input
                        type="text"
                        className="form-control"
                        value={empresaConfig.direccion}
                        onChange={(e) => setEmpresaConfig({...empresaConfig, direccion: e.target.value})}
                        placeholder="Ingrese la dirección"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Teléfono</label>
                      <input
                        type="text"
                        className="form-control"
                        value={empresaConfig.telefono}
                        onChange={(e) => setEmpresaConfig({...empresaConfig, telefono: e.target.value})}
                        placeholder="Ingrese el teléfono"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={empresaConfig.email}
                        onChange={(e) => setEmpresaConfig({...empresaConfig, email: e.target.value})}
                        placeholder="Ingrese el email"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">RUC</label>
                      <input
                        type="text"
                        className="form-control"
                        value={empresaConfig.ruc}
                        onChange={(e) => setEmpresaConfig({...empresaConfig, ruc: e.target.value})}
                        placeholder="Ingrese el RUC"
                      />
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveEmpresa}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          Guardar Configuración
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'fiscal' && (
                <div className="row">
                  <div className="col-md-6">
                    <h5>Configuración Fiscal</h5>
                    <div className="mb-3">
                      <label className="form-label">Porcentaje de IVA</label>
                      <input
                        type="number"
                        className="form-control"
                        min="0"
                        max="100"
                        value={fiscalConfig.iva_porcentaje}
                        onChange={(e) => setFiscalConfig({...fiscalConfig, iva_porcentaje: parseInt(e.target.value) || 0})}
                        placeholder="Ingrese el porcentaje de IVA"
                      />
                      <div className="form-text">
                        El porcentaje de IVA debe estar entre 0 y 100
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Moneda</label>
                      <select
                        className="form-select"
                        value={fiscalConfig.moneda}
                        onChange={(e) => setFiscalConfig({...fiscalConfig, moneda: e.target.value})}
                      >
                        <option value="ARS">Peso Argentino (ARS)</option>
                        <option value="USD">Dólar Americano (USD)</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Símbolo de Moneda</label>
                      <input
                        type="text"
                        className="form-control"
                        value={fiscalConfig.moneda_simbolo}
                        onChange={(e) => setFiscalConfig({...fiscalConfig, moneda_simbolo: e.target.value})}
                        placeholder="Ingrese el símbolo de la moneda"
                      />
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveFiscal}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          Guardar Configuración
                        </>
                      )}
                    </button>
                  </div>
                  <div className="col-md-6">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6 className="card-title">Vista Previa</h6>
                        <p className="card-text">
                          <strong>IVA:</strong> {fiscalConfig.iva_porcentaje}%
                        </p>
                        <p className="card-text">
                          <strong>Moneda:</strong> {fiscalConfig.moneda}
                        </p>
                        <p className="card-text">
                          <strong>Símbolo:</strong> {fiscalConfig.moneda_simbolo}
                        </p>
                        <p className="card-text">
                          <strong>Ejemplo:</strong> {formatCurrency(1000, fiscalConfig.moneda_simbolo)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'impresora' && (
                <div className="row">
                  <div className="col-md-6">
                    <h5>Configuración de Impresora</h5>
                    <div className="mb-3">
                      <label className="form-label">Puerto de Impresora</label>
                      <input
                        type="text"
                        className="form-control"
                        value={impresoraConfig.puerto}
                        onChange={(e) => setImpresoraConfig({...impresoraConfig, puerto: e.target.value})}
                        placeholder="Ej: COM1, USB, etc."
                      />
                    </div>
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={impresoraConfig.test_print}
                          onChange={(e) => setImpresoraConfig({...impresoraConfig, test_print: e.target.checked})}
                        />
                        <label className="form-check-label">
                          Modo de prueba (simular impresión)
                        </label>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleSaveImpresora}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          Guardar Configuración
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Config;