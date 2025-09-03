import { useAppStore } from '../store/useAppStore';

let started = false;
let syncInterval: NodeJS.Timeout | null = null;

export function startSyncService() {
  if (started) return;
  started = true;

  // 1) Cargar datos iniciales
  useAppStore.getState().loadAll();

  // 2) Sincronización manual - solo cuando sea necesario
  // La sincronización se hará manualmente después de acciones que modifiquen datos

  // 3) Limpiar al cerrar
  const cleanup = () => {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
    started = false;
  };

  // Limpiar al cerrar la ventana
  window.addEventListener('beforeunload', cleanup);


}

export function stopSyncService() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  started = false;
  console.log('🛑 Servicio de sincronización detenido');
}
