import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Inicio from './pages/Inicio';
import Inventario from './pages/Inventario';
import Pedidos from './pages/Pedidos';
import Caja from './pages/Caja';
import Reportes from './pages/Reportes';
import Config from './pages/Config';


function App() {
  console.log('🚀 App component rendering...');
  
  return (
    <Router>
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
    </Router>
  );
}

export default App;
