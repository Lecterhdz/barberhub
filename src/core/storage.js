// src/core/storage.js
// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - STORAGE (IndexedDB + LocalStorage)
// ─────────────────────────────────────────────────────────────────────

console.log('💾 Storage module cargado');

export const storage = {
    db: null,
    dbName: 'BarberHubDB',
    dbVersion: 3,  // ✅ Incrementar versión para forzar actualización
    initialized: false,
    
    // Inicializar IndexedDB
    init: function() {
        return new Promise((resolve, reject) => {
            // ✅ Si ya está inicializado, resolver inmediatamente
            if (this.db && this.initialized) {
                console.log('✅ Storage ya inicializado');
                resolve(this.db);
                return;
            }
            
            console.log('🔄 Inicializando IndexedDB...');
            
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('❌ Error abriendo IndexedDB:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                this.initialized = true;
                console.log('✅ IndexedDB inicializado correctamente');
                
                // ✅ Manejar cierre de la base de datos
                this.db.onclose = () => {
                    console.warn('⚠️ IndexedDB cerrada');
                    this.initialized = false;
                    this.db = null;
                };
                
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                console.log('🔄 Actualizando estructura de IndexedDB...');
                
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
                        console.log(`✅ Store creado: ${storeName}`);
                        
                        // Crear índices
                        if (storeName === 'citas') {
                            store.createIndex('fecha', 'fecha', { unique: false });
                            store.createIndex('estado', 'estado', { unique: false });
                            store.createIndex('clienteId', 'clienteId', { unique: false });
                            store.createIndex('barberoId', 'barberoId', { unique: false });
                        } else if (storeName === 'clientes') {
                            store.createIndex('telefono', 'telefono', { unique: false });
                            store.createIndex('email', 'email', { unique: false });
                        } else if (storeName === 'barberos') {
                            store.createIndex('estado', 'estado', { unique: false });
                        } else if (storeName === 'servicios') {
                            store.createIndex('nombre', 'nombre', { unique: false });
                            store.createIndex('precio', 'precio', { unique: false });
                            store.createIndex('estado', 'estado', { unique: false });
                        } else if (storeName === 'productos') {
                            store.createIndex('nombre', 'nombre', { unique: false });
                            store.createIndex('categoria', 'categoria', { unique: false });
                            store.createIndex('stock', 'stock', { unique: false });
                        } else if (storeName === 'ventas') {
                            store.createIndex('fecha', 'fecha', { unique: false });
                            store.createIndex('metodo', 'metodo', { unique: false });
                            store.createIndex('estado', 'estado', { unique: false });
                        }
                    }
                });
                
                console.log('✅ Stores creados/actualizados');
            };
        });
    },
    
    // ✅ Verificar si la base de datos está lista
    isReady: function() {
        return this.db !== null && this.initialized === true;
    },
    
    // ✅ Esperar a que la base de datos esté lista
    waitForReady: async function() {
        if (this.isReady()) return true;
        
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (this.isReady()) {
                    clearInterval(checkInterval);
                    resolve(true);
                }
            }, 100);
            
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve(false);
            }, 5000);
        });
    },
    
    // Guardar un registro
    guardar: function(storeName, data) {
        return new Promise(async (resolve, reject) => {
            // ✅ Esperar a que la BD esté lista
            await this.waitForReady();
            
            if (!this.db) {
                reject(new Error('Base de datos no inicializada'));
                return;
            }
            
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                
                // Agregar timestamps
                const now = new Date().toISOString();
                if (!data.id) {
                    data.creado = now;
                }
                data.actualizado = now;
                
                const request = store.put(data);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
                
                transaction.onerror = () => reject(transaction.error);
                transaction.oncomplete = () => console.log(`✅ Guardado en ${storeName}`);
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // Guardar múltiples registros
    guardarMultiples: function(storeName, dataArray) {
        return new Promise(async (resolve, reject) => {
            try {
                await this.waitForReady();
                
                if (!this.db) {
                    reject(new Error('Base de datos no inicializada'));
                    return;
                }
                
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
        return new Promise(async (resolve, reject) => {
            await this.waitForReady();
            
            if (!this.db) {
                reject(new Error('Base de datos no inicializada'));
                return;
            }
            
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(id);
                
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // Obtener todos los registros
    obtenerTodos: function(storeName) {
        return new Promise(async (resolve, reject) => {
            await this.waitForReady();
            
            if (!this.db) {
                reject(new Error('Base de datos no inicializada'));
                return;
            }
            
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // Obtener por índice
    obtenerPorIndice: function(storeName, indexName, value) {
        return new Promise(async (resolve, reject) => {
            await this.waitForReady();
            
            if (!this.db) {
                reject(new Error('Base de datos no inicializada'));
                return;
            }
            
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const index = store.index(indexName);
                const request = index.getAll(value);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // Eliminar un registro
    eliminar: function(storeName, id) {
        return new Promise(async (resolve, reject) => {
            await this.waitForReady();
            
            if (!this.db) {
                reject(new Error('Base de datos no inicializada'));
                return;
            }
            
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(id);
                
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
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
        return new Promise(async (resolve, reject) => {
            await this.waitForReady();
            
            if (!this.db) {
                reject(new Error('Base de datos no inicializada'));
                return;
            }
            
            try {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // Contar registros
    contar: function(storeName) {
        return new Promise(async (resolve, reject) => {
            await this.waitForReady();
            
            if (!this.db) {
                reject(new Error('Base de datos no inicializada'));
                return;
            }
            
            try {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.count();
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // Buscar con filtros
    buscar: function(storeName, filtros) {
        return new Promise(async (resolve, reject) => {
            try {
                const datos = await this.obtenerTodos(storeName);
                
                if (!filtros) {
                    resolve(datos);
                    return;
                }
                
                const filtered = datos.filter(item => {
                    for (const [key, value] of Object.entries(filtros)) {
                        if (item[key] !== value) return false;
                    }
                    return true;
                });
                
                resolve(filtered);
            } catch (error) {
                reject(error);
            }
        });
    },
    
    // ============================================
    // DATOS DE EJEMPLO PARA INICIALIZAR
    // ============================================
    
    async cargarDatosEjemplo() {
        console.log('📦 Cargando datos de ejemplo...');
        
        // Verificar si ya hay datos
        const barberos = await this.obtenerTodos('barberos');
        if (barberos.length > 0) {
            console.log('📦 Ya hay datos, omitiendo ejemplos');
            return;
        }
        
        // Barberos de ejemplo
        const barberosEjemplo = [
            { id: 1, nombre: 'Carlos Martínez', telefono: '555-0101', email: 'carlos@barberhub.com', especialidad: 'Corte', comision: 40, estado: 'activo', horarioInicio: '09:00', horarioFin: '18:00', diasDescanso: ['Dom'], citasAtendidas: 0, ingresosGenerados: 0, rating: 0 },
            { id: 2, nombre: 'Miguel Rodríguez', telefono: '555-0102', email: 'miguel@barberhub.com', especialidad: 'Barba', comision: 45, estado: 'activo', horarioInicio: '10:00', horarioFin: '19:00', diasDescanso: ['Lun'], citasAtendidas: 0, ingresosGenerados: 0, rating: 0 },
            { id: 3, nombre: 'Juan Pérez', telefono: '555-0103', email: 'juan@barberhub.com', especialidad: 'Todo', comision: 50, estado: 'activo', horarioInicio: '08:00', horarioFin: '17:00', diasDescanso: ['Mié'], citasAtendidas: 0, ingresosGenerados: 0, rating: 0 }
        ];
        
        // Servicios de ejemplo
        const serviciosEjemplo = [
            { id: 1, nombre: 'Corte de Cabello', categoria: 'Corte', precio: 350, duracion: 30, estado: 'activo', icono: '✂️', descripcion: 'Corte clásico o moderno según preferencia', barberos: [1, 2, 3] },
            { id: 2, nombre: 'Barba', categoria: 'Barba', precio: 200, duracion: 20, estado: 'activo', icono: '🧔', descripcion: 'Arreglo de barba con navaja', barberos: [1, 2] },
            { id: 3, nombre: 'Corte + Barba', categoria: 'Paquete', precio: 500, duracion: 50, estado: 'activo', icono: '✨', descripcion: 'Combo completo de corte y barba', barberos: [1, 2, 3] }
        ];
        
        // Guardar datos
        for (const barbero of barberosEjemplo) {
            await this.guardar('barberos', barbero);
        }
        for (const servicio of serviciosEjemplo) {
            await this.guardar('servicios', servicio);
        }
        
        console.log('✅ Datos de ejemplo cargados');
    },
    
    // ============================================
    // LOCALSTORAGE WRAPPER
    // ============================================
    
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
    
    // ============================================
    // SESSIONSTORAGE WRAPPER
    // ============================================
    
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
    
    // ============================================
    // BACKUP
    // ============================================
    
    backup: async function() {
        try {
            await this.waitForReady();
            
            const stores = ['citas', 'clientes', 'barberos', 'servicios', 'productos', 'ventas', 'config'];
            const backup = {};
            
            for (const store of stores) {
                backup[store] = await this.obtenerTodos(store);
            }
            
            backup.metadata = {
                fecha: new Date().toISOString(),
                version: '2.0.0',
                totalRegistros: Object.values(backup).reduce((sum, arr) => sum + (arr?.length || 0), 0)
            };
            
            return backup;
        } catch (error) {
            console.error('Error creando backup:', error);
            return null;
        }
    },
    
    restaurar: async function(backup) {
        try {
            await this.waitForReady();
            
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

console.log('💾 Storage module listo');
