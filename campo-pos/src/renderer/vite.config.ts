import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // 👈 ESSENCIAL para file://
  root: path.resolve(__dirname), // 👈 Especificar el directorio raíz
  build: {
    outDir: '../../renderer', // 👈 Ruta relativa al directorio raíz del proyecto
    assetsDir: 'assets',
    sourcemap: true,
    emptyOutDir: true
  },
  server: {
    port: 5173,
    strictPort: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@components': path.resolve(__dirname, './components'),
      '@pages': path.resolve(__dirname, './pages'),
      '@store': path.resolve(__dirname, './store'),
      '@lib': path.resolve(__dirname, './lib')
    }
  }
});
