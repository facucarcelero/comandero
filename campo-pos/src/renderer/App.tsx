import { HashRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Inicio from './pages/Inicio';
import Inventario from './pages/Inventario';
import Pedidos from './pages/Pedidos';
import Caja from './pages/Caja';
import Reportes from './pages/Reportes';
import Config from './pages/Config';
import { useAppStore } from './store/useAppStore';
import { ipcEventManager } from './lib/ipcEvents';

function App() {
  console.log('🚀 App component rendering...');
  
  const loadAll = useAppStore(state => state.loadAll);

  // Inicializar aplicación
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Cargar datos iniciales
        await loadAll();
        
        // Inicializar eventos IPC
        ipcEventManager.init();
        
        console.log('✅ Aplicación inicializada correctamente');
      } catch (error) {
        console.error('❌ Error al inicializar aplicación:', error);
      }
    };

    initializeApp();

    // Cleanup al desmontar
    return () => {
      ipcEventManager.cleanup();
    };
  }, [loadAll]);
  
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/caja" element={<Caja />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/config" element={<Config />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
