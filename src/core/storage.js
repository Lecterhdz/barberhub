// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - STORAGE WRAPPER (IndexedDB + localStorage)
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
                
                // Crear stores si no existen
                if (!db.objectStoreNames.contains('citas')) {
                    db.createObjectStore('citas', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('clientes')) {
                    db.createObjectStore('clientes', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('barberos')) {
                    db.createObjectStore('barberos', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('servicios')) {
                    db.createObjectStore('servicios', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('productos')) {
                    db.createObjectStore('productos', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('ventas')) {
                    db.createObjectStore('ventas', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('config')) {
                    db.createObjectStore('config', { keyPath: 'clave' });
                }
                
                console.log('✅ DB stores creados');
            };
        });
    },

    // Generic CRUD
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

    // LocalStorage helpers
    localStorage: {
        set: function(clave, valor) {
            localStorage.setItem(clave, JSON.stringify(valor));
        },
        get: function(clave) {
            const valor = localStorage.getItem(clave);
            return valor ? JSON.parse(valor) : null;
        },
        remove: function(clave) {
            localStorage.removeItem(clave);
        }
    },

    // Exportar/Importar
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

    importar: async function(datosJSON) {
        const datos = JSON.parse(datosJSON);
        
        for (const [store, items] of Object.entries(datos)) {
            if (store !== 'fecha' && store !== 'version' && Array.isArray(items)) {
                const tx = this.db.transaction(store, 'readwrite');
                const store_ = tx.objectStore(store);
                store_.clear();
                items.forEach(item => store_.add(item));
            }
        }
        
        alert('✅ Datos importados correctamente');
        location.reload();
    }
};

// Exportar para uso global
window.storage = storage;
