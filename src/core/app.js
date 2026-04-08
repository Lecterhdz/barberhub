// src/core/app.js - NUEVA ESTRUCTURA

export const app = {
    // ============ ESTADO GLOBAL ÚNICO ============
    estado: {
        // Autenticación
        autenticado: false,      // true si licencia válida
        licencia: null,          // { tipo, expiracion, key }
        rol: 'cliente',          // 'cliente' | 'admin' | 'barbero'
        
        // UI
        vista: 'portal',         // 'portal' | 'admin'
        modulo: 'agendar',       // módulo actual dentro de la vista
        sidebarAbierto: true,    // estado del menú hamburguesa
        modal: null,             // modal activo { tipo, data }
        
        // ============ DATOS EN CACHÉ (NO SE PIERDEN) ============
        cache: {
            // Datos principales (se cargan una sola vez)
            barberos: [],
            servicios: [],
            
            // Datos que requieren autenticación
            clientes: [],
            citas: [],
            productos: [],
            ventas: [],
            
            // Metadatos
            ultimaActualizacion: null,
            version: '2.0.0'
        },
        
        // ============ UI Temporal ============
        ui: {
            loading: false,
            notificacion: null,
            confirmacion: null
        }
    },
    
    // ============ MÉTODOS PRINCIPALES ============
    
    // Inicializar la app
    async init() { ... },
    
    // Cargar datos en caché (solo una vez)
    async cargarCache() { ... },
    
    // Obtener datos (desde caché o storage)
    async getData(coleccion) { ... },
    
    // Guardar datos (actualiza caché + storage)
    async setData(coleccion, datos) { ... },
    
    // Agregar un elemento (push a caché + storage)
    async addData(coleccion, item) { ... },
    
    // Actualizar un elemento
    async updateData(coleccion, id, nuevosDatos) { ... },
    
    // Eliminar un elemento
    async deleteData(coleccion, id) { ... },
    
    // ============ AUTENTICACIÓN ============
    
    async login(licenciaKey) { ... },
    logout() { ... },
    
    // ============ NAVEGACIÓN ============
    
    navegar(modulo, params) { ... },
    
    // ============ UI ============
    
    toggleSidebar() { ... },
    mostrarModal(tipo, data) { ... },
    cerrarModal() { ... },
    mostrarNotificacion(mensaje, tipo) { ... }
};
