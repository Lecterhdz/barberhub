// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - STORAGE (IndexedDB + LocalStorage)
// ─────────────────────────────────────────────────────────────────────

export const storage = {
    db: null,
    dbName: 'BarberHubDB',
    dbVersion: 2,
    
    // Inicializar IndexedDB
    init: function() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                resolve(this.db);
                return;
            }
            
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('Error abriendo IndexedDB:', request.error);
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
                const stores = [
                    'citas', 'clientes', 'barberos', 'servicios', 
                    'productos', 'ventas', 'config'
                ];
                
                stores.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { 
                            keyPath: 'id', 
                            autoIncrement: true 
                        });
                        
                        // Crear índices
                        if (storeName === 'citas') {
                            store.createIndex('fecha', 'fecha', { unique: false });
                            store.createIndex('estado', 'estado', { unique: false });
                            store.createIndex('clienteId', 'clienteId', { unique: false });
                        } else if (storeName === 'clientes') {
                            store.createIndex('telefono', 'telefono', { unique: false });
                            store.createIndex('email', 'email', { unique: false });
                        } else if (storeName === 'servicios') {
                            store.createIndex('nombre', 'nombre', { unique: false });
                            store.createIndex('precio', 'precio', { unique: false });
                        } else if (storeName === 'productos') {
                            store.createIndex('nombre', 'nombre', { unique: false });
                            store.createIndex('categoria', 'categoria', { unique: false });
                            store.createIndex('stock', 'stock', { unique: false });
                        }
                    }
                });
                
                console.log('✅ Stores creados/actualizados');
            };
        });
    },
    
    // Guardar un registro
    guardar: function(storeName, data) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Base de datos no inicializada'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // Agregar timestamps
            if (!data.id) {
                data.creado = new Date().toISOString();
            }
            data.actualizado = new Date().toISOString();
            
            const request = store.put(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    // Guardar múltiples registros
    guardarMultiples: function(storeName, dataArray) {
        return new Promise(async (resolve, reject) => {
            try {
                const results = [];
                for (const data of dataArray) {
                    const result = await this.guardar(storeName, data);
                    results.push(result);
                }
                resolve(results);
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // Obtener un registro por ID
    obtener: function(storeName, id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Base de datos no inicializada'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    // Obtener todos los registros
    obtenerTodos: function(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Base de datos no inicializada'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },
    
    // Obtener por índice
    obtenerPorIndice: function(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Base de datos no inicializada'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    // Eliminar un registro
    eliminar: function(storeName, id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Base de datos no inicializada'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    },
    
    // Eliminar múltiples registros
    eliminarMultiples: function(storeName, ids) {
        return new Promise(async (resolve, reject) => {
            try {
                for (const id of ids) {
                    await this.eliminar(storeName, id);
                }
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // Limpiar store
    limpiarStore: function(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Base de datos no inicializada'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    },
    
    // Contar registros
    contar: function(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Base de datos no inicializada'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.count();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    // Buscar con filtros
    buscar: function(storeName, filtros) {
        return new Promise(async (resolve, reject) => {
            try {
                let datos = await this.obtenerTodos(storeName);
                
                // Aplicar filtros
                if (filtros) {
                    datos = datos.filter(item => {
                        for (const [key, value] of Object.entries(filtros)) {
                            if (item[key] !== value) return false;
                        }
                        return true;
                    });
                }
                
                resolve(datos);
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // LocalStorage wrapper
    localStorage: {
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Error guardando en localStorage:', error);
                return false;
            }
        },
        
        get: function(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Error leyendo de localStorage:', error);
                return defaultValue;
            }
        },
        
        remove: function(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Error eliminando de localStorage:', error);
                return false;
            }
        },
        
        clear: function() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('Error limpiando localStorage:', error);
                return false;
            }
        }
    },
    
    // SessionStorage wrapper
    sessionStorage: {
        set: function(key, value) {
            try {
                sessionStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Error guardando en sessionStorage:', error);
                return false;
            }
        },
        
        get: function(key, defaultValue = null) {
            try {
                const item = sessionStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Error leyendo de sessionStorage:', error);
                return defaultValue;
            }
        },
        
        remove: function(key) {
            try {
                sessionStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Error eliminando de sessionStorage:', error);
                return false;
            }
        },
        
        clear: function() {
            try {
                sessionStorage.clear();
                return true;
            } catch (error) {
                console.error('Error limpiando sessionStorage:', error);
                return false;
            }
        }
    },
    
    // Backup completo
    backup: async function() {
        try {
            const stores = ['citas', 'clientes', 'barberos', 'servicios', 'productos', 'ventas', 'config'];
            const backup = {};
            
            for (const store of stores) {
                backup[store] = await this.obtenerTodos(store);
            }
            
            backup.metadata = {
                fecha: new Date().toISOString(),
                version: '1.0.0',
                totalRegistros: Object.values(backup).reduce((sum, arr) => sum + arr.length, 0)
            };
            
            return backup;
        } catch (error) {
            console.error('Error creando backup:', error);
            return null;
        }
    },
    
    // Restaurar backup
    restaurar: async function(backup) {
        try {
            for (const [storeName, data] of Object.entries(backup)) {
                if (storeName !== 'metadata' && Array.isArray(data)) {
                    await this.limpiarStore(storeName);
                    if (data.length > 0) {
                        await this.guardarMultiples(storeName, data);
                    }
                }
            }
            return true;
        } catch (error) {
            console.error('Error restaurando backup:', error);
            return false;
        }
    }
};

// Exportar para uso global
window.storage = storage;
