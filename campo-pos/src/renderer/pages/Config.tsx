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
    tipo: 'usb', // usb, ethernet, bluetooth
    puerto: '',
    ip: '',
    puerto_red: 9100,
    ancho_papel: 58,
    velocidad: 9600,
    test_print: false,
    auto_cut: true,
    auto_open: true,
    encoding: 'utf8'
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
        tipo: settingsMap.impresora_tipo || 'usb',
        puerto: settingsMap.impresora_puerto || '',
        ip: settingsMap.impresora_ip || '',
        puerto_red: settingsMap.impresora_puerto_red || 9100,
        ancho_papel: settingsMap.impresora_ancho_papel || 58,
        velocidad: settingsMap.impresora_velocidad || 9600,
        test_print: false,
        auto_cut: settingsMap.impresora_auto_cut !== false,
        auto_open: settingsMap.impresora_auto_open !== false,
        encoding: settingsMap.impresora_encoding || 'utf8'
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
        api.setSetting('impresora_tipo', impresoraConfig.tipo),
        api.setSetting('impresora_puerto', impresoraConfig.puerto),
        api.setSetting('impresora_ip', impresoraConfig.ip),
        api.setSetting('impresora_puerto_red', impresoraConfig.puerto_red),
        api.setSetting('impresora_ancho_papel', impresoraConfig.ancho_papel),
        api.setSetting('impresora_velocidad', impresoraConfig.velocidad),

        api.setSetting('impresora_auto_cut', impresoraConfig.auto_cut),
        api.setSetting('impresora_auto_open', impresoraConfig.auto_open),
        api.setSetting('impresora_encoding', impresoraConfig.encoding)
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

  const handleTestImpresora = useCallback(async () => {
    try {
      setIsLoading(true);
      await api.testImpresora();
      Swal.fire({
        icon: 'success',
        title: 'Prueba exitosa',
        text: 'La impresora está funcionando correctamente',
        confirmButtonText: 'Entendido'
      });
    } catch (error) {
      console.error('Error al probar impresora:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de impresora',
        text: 'No se pudo conectar con la impresora. Verifica la configuración.',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

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
                  <div className="col-lg-8">
                    <h5 className="mb-4">
                      <i className="bi bi-printer me-2"></i>
                      Configuración de Impresora Térmica
                    </h5>
                    
                    {/* Tipo de Conexión */}
                    <div className="card mb-4">
                      <div className="card-header">
                        <h6 className="mb-0">
                          <i className="bi bi-wifi me-2"></i>
                          Tipo de Conexión
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-4">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="tipoImpresora"
                                id="usb"
                                value="usb"
                                checked={impresoraConfig.tipo === 'usb'}
                                onChange={(e) => setImpresoraConfig({...impresoraConfig, tipo: e.target.value})}
                              />
                              <label className="form-check-label" htmlFor="usb">
                                <i className="bi bi-usb me-1"></i>
                                USB
                              </label>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="tipoImpresora"
                                id="ethernet"
                                value="ethernet"
                                checked={impresoraConfig.tipo === 'ethernet'}
                                onChange={(e) => setImpresoraConfig({...impresoraConfig, tipo: e.target.value})}
                              />
                              <label className="form-check-label" htmlFor="ethernet">
                                <i className="bi bi-ethernet me-1"></i>
                                Ethernet
                              </label>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="tipoImpresora"
                                id="bluetooth"
                                value="bluetooth"
                                checked={impresoraConfig.tipo === 'bluetooth'}
                                onChange={(e) => setImpresoraConfig({...impresoraConfig, tipo: e.target.value})}
                              />
                              <label className="form-check-label" htmlFor="bluetooth">
                                <i className="bi bi-bluetooth me-1"></i>
                                Bluetooth
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Configuración de Conexión */}
                    <div className="card mb-4">
                      <div className="card-header">
                        <h6 className="mb-0">
                          <i className="bi bi-gear me-2"></i>
                          Configuración de Conexión
                        </h6>
                      </div>
                      <div className="card-body">
                        {impresoraConfig.tipo === 'usb' && (
                          <div className="row g-3">
                            <div className="col-md-6">
                              <label className="form-label">Puerto USB</label>
                              <select
                                className="form-select"
                                value={impresoraConfig.puerto}
                                onChange={(e) => setImpresoraConfig({...impresoraConfig, puerto: e.target.value})}
                              >
                                <option value="">Seleccionar puerto...</option>
                                <option value="auto">Detección automática</option>
                                <option value="COM1">COM1</option>
                                <option value="COM2">COM2</option>
                                <option value="COM3">COM3</option>
                                <option value="COM4">COM4</option>
                                <option value="COM5">COM5</option>
                                <option value="COM6">COM6</option>
                                <option value="COM7">COM7</option>
                                <option value="COM8">COM8</option>
                                <option value="USB">USB Genérico</option>
                              </select>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Velocidad (Baud Rate)</label>
                              <select
                                className="form-select"
                                value={impresoraConfig.velocidad}
                                onChange={(e) => setImpresoraConfig({...impresoraConfig, velocidad: parseInt(e.target.value)})}
                              >
                                <option value={9600}>9600</option>
                                <option value={19200}>19200</option>
                                <option value={38400}>38400</option>
                                <option value={57600}>57600</option>
                                <option value={115200}>115200</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {impresoraConfig.tipo === 'ethernet' && (
                          <div className="row g-3">
                            <div className="col-md-6">
                              <label className="form-label">Dirección IP</label>
                              <input
                                type="text"
                                className="form-control"
                                value={impresoraConfig.ip}
                                onChange={(e) => setImpresoraConfig({...impresoraConfig, ip: e.target.value})}
                                placeholder="192.168.1.100"
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Puerto de Red</label>
                              <input
                                type="number"
                                className="form-control"
                                value={impresoraConfig.puerto_red}
                                onChange={(e) => setImpresoraConfig({...impresoraConfig, puerto_red: parseInt(e.target.value)})}
                                placeholder="9100"
                              />
                            </div>
                          </div>
                        )}

                        {impresoraConfig.tipo === 'bluetooth' && (
                          <div className="row g-3">
                            <div className="col-md-6">
                              <label className="form-label">Dispositivo Bluetooth</label>
                              <input
                                type="text"
                                className="form-control"
                                value={impresoraConfig.puerto}
                                onChange={(e) => setImpresoraConfig({...impresoraConfig, puerto: e.target.value})}
                                placeholder="MAC Address o Nombre del dispositivo"
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Velocidad</label>
                              <select
                                className="form-select"
                                value={impresoraConfig.velocidad}
                                onChange={(e) => setImpresoraConfig({...impresoraConfig, velocidad: parseInt(e.target.value)})}
                              >
                                <option value={9600}>9600</option>
                                <option value={19200}>19200</option>
                                <option value={38400}>38400</option>
                                <option value={57600}>57600</option>
                                <option value={115200}>115200</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Configuración de Papel */}
                    <div className="card mb-4">
                      <div className="card-header">
                        <h6 className="mb-0">
                          <i className="bi bi-file-text me-2"></i>
                          Configuración de Papel
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label">Ancho de Papel (mm)</label>
                            <select
                              className="form-select"
                              value={impresoraConfig.ancho_papel}
                              onChange={(e) => setImpresoraConfig({...impresoraConfig, ancho_papel: parseInt(e.target.value)})}
                            >
                              <option value={58}>58mm (Estándar)</option>
                              <option value={80}>80mm (Grande)</option>
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Codificación</label>
                            <select
                              className="form-select"
                              value={impresoraConfig.encoding}
                              onChange={(e) => setImpresoraConfig({...impresoraConfig, encoding: e.target.value})}
                            >
                              <option value="utf8">UTF-8 (Recomendado)</option>
                              <option value="latin1">Latin-1</option>
                              <option value="ascii">ASCII</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Opciones Avanzadas */}
                    <div className="card mb-4">
                      <div className="card-header">
                        <h6 className="mb-0">
                          <i className="bi bi-sliders me-2"></i>
                          Opciones Avanzadas
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">

                          <div className="col-md-4">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="auto_cut"
                                checked={impresoraConfig.auto_cut}
                                onChange={(e) => setImpresoraConfig({...impresoraConfig, auto_cut: e.target.checked})}
                              />
                              <label className="form-check-label" htmlFor="auto_cut">
                                Corte Automático
                              </label>
                              <small className="form-text text-muted d-block">
                                Cortar papel automáticamente después de imprimir
                              </small>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="auto_open"
                                checked={impresoraConfig.auto_open}
                                onChange={(e) => setImpresoraConfig({...impresoraConfig, auto_open: e.target.checked})}
                              />
                              <label className="form-check-label" htmlFor="auto_open">
                                Apertura Automática
                              </label>
                              <small className="form-text text-muted d-block">
                                Abrir cajón automáticamente al imprimir
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="d-flex gap-2">
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
                      
                      <button
                        className="btn btn-outline-success"
                        onClick={handleTestImpresora}
                        disabled={isLoading}
                      >
                        <i className="bi bi-printer me-2"></i>
                        Probar Impresora
                      </button>
                    </div>
                  </div>

                  {/* Panel de Ayuda */}
                  <div className="col-lg-4">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="mb-0">
                          <i className="bi bi-question-circle me-2"></i>
                          Ayuda y Compatibilidad
                        </h6>
                      </div>
                      <div className="card-body">
                        <h6 className="text-primary">Impresoras Compatibles</h6>
                        <ul className="list-unstyled small">
                          <li><i className="bi bi-check-circle text-success me-1"></i> Epson TM-T20</li>
                          <li><i className="bi bi-check-circle text-success me-1"></i> Epson TM-T82</li>
                          <li><i className="bi bi-check-circle text-success me-1"></i> Epson TM-T88V</li>
                          <li><i className="bi bi-check-circle text-success me-1"></i> Star TSP143</li>
                          <li><i className="bi bi-check-circle text-success me-1"></i> Star TSP650</li>
                          <li><i className="bi bi-check-circle text-success me-1"></i> Bixolon SRP-350</li>
                          <li><i className="bi bi-check-circle text-success me-1"></i> Bixolon SRP-330</li>
                          <li><i className="bi bi-check-circle text-success me-1"></i> Citizen CT-S310</li>
                        </ul>
                        
                        <h6 className="text-primary mt-3">Configuración Recomendada</h6>
                        <ul className="list-unstyled small">
                          <li><i className="bi bi-info-circle text-info me-1"></i> Ancho: 58mm (estándar)</li>
                          <li><i className="bi bi-info-circle text-info me-1"></i> Velocidad: 9600 baud</li>
                          <li><i className="bi bi-info-circle text-info me-1"></i> Codificación: UTF-8</li>
                          <li><i className="bi bi-info-circle text-info me-1"></i> Puerto Ethernet: 9100</li>
                        </ul>

                        <div className="alert alert-warning mt-3">
                          <small>
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            <strong>Nota:</strong> Para impresoras USB, asegúrate de que el driver esté instalado correctamente.
                          </small>
                        </div>
                      </div>
                    </div>
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