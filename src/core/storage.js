// src/core/storage.js
import { 
    guardarFirestore, 
    obtenerTodosFirestore, 
    eliminarFirestore, 
    escucharCambios,
    COLLECTIONS 
} from './firebase.js';

console.log('💾 Storage module v2.0 (Firebase + IndexedDB)');

export const storage = {
    db: null,
    disponible: false,
    sincronizando: false,
    firebaseEnabled: true, // Cambiar a false si no hay conexión

    async init() {
        console.log('💾 Inicializando storage...');
        
        // Inicializar IndexedDB (local)
        await this.initIndexedDB();
        
        // Verificar conexión a Firebase
        if (this.firebaseEnabled) {
            try {
                await this.sincronizarDatos();
                this.iniciarEscuchaTiempoReal();
                console.log('✅ Firebase activo - sincronización en tiempo real');
            } catch (error) {
                console.warn('⚠️ Firebase no disponible, modo offline');
                this.firebaseEnabled = false;
            }
        }
        
        return true;
    },
    
    initIndexedDB() {
        return new Promise((resolve) => {
            const request = indexedDB.open('BarberHubDB', 4);
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                const stores = ['barberos', 'servicios', 'clientes', 'citas', 'productos', 'ventas'];
                stores.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                        console.log(`✅ Store creado: ${storeName}`);
                    }
                });
            };
            
            request.onsuccess = (e) => {
                this.db = e.target.result;
                this.disponible = true;
                console.log('✅ IndexedDB conectada');
                resolve();
            };
            
            request.onerror = () => {
                console.warn('⚠️ IndexedDB no disponible');
                this.disponible = false;
                resolve();
            };
        });
    },
    
    async sincronizarDatos() {
        if (this.sincronizando) return;
        this.sincronizando = true;
        
        console.log('🔄 Sincronizando datos con Firebase...');
        
        for (const [key, coleccion] of Object.entries(COLLECTIONS)) {
            try {
                const datosFirebase = await obtenerTodosFirestore(coleccion);
                const datosLocal = await this.obtenerTodos(coleccion);
                
                // Sincronizar: Firebase -> Local
                for (const dato of datosFirebase) {
                    const existeLocal = datosLocal.some(l => l.id === dato.id);
                    if (!existeLocal) {
                        await this.guardarLocal(coleccion, dato);
                        console.log(`📥 Sincronizado local: ${coleccion}/${dato.id}`);
                    }
                }
                
                // Sincronizar: Local -> Firebase
                for (const dato of datosLocal) {
                    const existeFirebase = datosFirebase.some(f => f.id === dato.id);
                    if (!existeFirebase && dato.id) {
                        await guardarFirestore(coleccion, dato.id, dato);
                        console.log(`📤 Sincronizado Firebase: ${coleccion}/${dato.id}`);
                    }
                }
            } catch (error) {
                console.error(`Error sincronizando ${coleccion}:`, error);
            }
        }
        
        this.sincronizando = false;
        console.log('✅ Sincronización completada');
    },
    
    iniciarEscuchaTiempoReal() {
        for (const [key, coleccion] of Object.entries(COLLECTIONS)) {
            escucharCambios(coleccion, async (datos) => {
                console.log(`🔄 Cambios detectados en ${coleccion}:`, datos.length);
                for (const dato of datos) {
                    await this.guardarLocal(coleccion, dato);
                }
                // Disparar evento para actualizar UI
                window.dispatchEvent(new CustomEvent('firebase-sync', { detail: { coleccion, datos } }));
            });
        }
    },
    
    async guardarLocal(storeName, data) {
        if (!this.db) return null;
        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction([storeName], 'readwrite');
                const store = tx.objectStore(storeName);
                const request = store.put(data);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null);
            } catch (error) {
                console.error('Error guardando local:', error);
                resolve(null);
            }
        });
    },
    
    async guardar(storeName, data) {
        // Guardar localmente
        const result = await this.guardarLocal(storeName, data);
        
        // Guardar en Firebase si está disponible
        if (this.firebaseEnabled && data.id) {
            await guardarFirestore(storeName, data.id, data);
        }
        
        return result;
    },
    
    async obtenerTodos(storeName) {
        if (!this.db) return [];
        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction([storeName], 'readonly');
                const store = tx.objectStore(storeName);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => resolve([]);
            } catch (error) {
                console.error('Error obteniendo:', error);
                resolve([]);
            }
        });
    },
    
    async eliminar(storeName, id) {
        if (!this.db) return false;
        
        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction([storeName], 'readwrite');
                const store = tx.objectStore(storeName);
                const request = store.delete(id);
                request.onsuccess = () => {
                    if (this.firebaseEnabled) {
                        eliminarFirestore(storeName, id);
                    }
                    resolve(true);
                };
                request.onerror = () => resolve(false);
            } catch (error) {
                resolve(false);
            }
        });
    },
    
    localStorage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                return false;
            }
        },
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                return defaultValue;
            }
        },
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                return false;
            }
        }
    }
};

window.storage = storage;