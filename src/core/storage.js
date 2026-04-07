// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - STORAGE WRAPPER (IndexedDB)
// ─────────────────────────────────────────────────────────────────────

console.log('💾 Storage cargado');

export const storage = {
    db: null,
    DB_NAME: 'BarberHubDB',
    DB_VERSION: 1,

    init: async function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onerror = () => {
                console.error('❌ Error abriendo DB');
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB inicializado');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Crear object stores
                const stores = [
                    'citas', 'clientes', 'barberos', 
                    'servicios', 'productos', 'ventas', 'config'
                ];
                
                stores.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { 
                            keyPath: 'id', 
                            autoIncrement: true 
                        });
                        
                        // Crear índices para búsquedas
                        if (storeName === 'citas') {
                            store.createIndex('fecha', 'fecha', { unique: false });
                            store.createIndex('clienteId', 'clienteId', { unique: false });
                            store.createIndex('estado', 'estado', { unique: false });
                        }
                        if (storeName === 'clientes') {
                            store.createIndex('telefono', 'telefono', { unique: false });
                        }
                        if (storeName === 'productos') {
                            store.createIndex('categoria', 'categoria', { unique: false });
                        }
                    }
                });
                
                console.log('✅ DB stores creados');
            };
        });
    },

    // CRUD Genérico
    guardar: async function(storeName, datos) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.add(datos);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    obtener: async function(storeName, id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    obtenerTodos: async function(storeName) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    actualizar: async function(storeName, id, datos) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            datos.id = id;
            const request = store.put(datos);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    eliminar: async function(storeName, id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    // Búsquedas específicas
    obtenerPorFecha: async function(storeName, campo, valor) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const index = store.index(campo);
            const request = index.getAll(valor);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Exportar todos los datos
    exportar: async function() {
        const datos = {};
        const stores = ['citas', 'clientes', 'barberos', 'servicios', 'productos', 'ventas', 'config'];
        
        for (const store of stores) {
            datos[store] = await this.obtenerTodos(store);
        }
        
        datos.fecha = new Date().toISOString();
        datos.version = '1.0';
        
        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BarberHub_Respaldo_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        return datos;
    },

    // Importar datos
    importar: async function(datosJSON) {
        const datos = JSON.parse(datosJSON);
        
        for (const [storeName, items] of Object.entries(datos)) {
            if (storeName !== 'fecha' && storeName !== 'version' && Array.isArray(items)) {
                const tx = this.db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                await store.clear();
                for (const item of items) {
                    await store.add(item);
                }
            }
        }
        
        alert('✅ Datos importados correctamente');
        location.reload();
    },

    // LocalStorage helper
    localStorage: {
        set: (clave, valor) => localStorage.setItem(clave, JSON.stringify(valor)),
        get: (clave) => {
            const valor = localStorage.getItem(clave);
            return valor ? JSON.parse(valor) : null;
        },
        remove: (clave) => localStorage.removeItem(clave)
    }
};

// Exportar para uso global
window.storage = storage;
