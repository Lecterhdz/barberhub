// src/core/app.js
// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - NÚCLEO DEL SISTEMA (Estado Global Único)
// ─────────────────────────────────────────────────────────────────────

import { storage } from './storage.js';
import { utils } from './utils.js';
import { router } from './router.js';

console.log('🏗️ BarberHub Core v2.0');

// ============================================
// ESTADO GLOBAL ÚNICO
// ============================================

export const app = {
    // Estado principal (única fuente de verdad)
    estado: {
        // Autenticación
        autenticado: false,
        licencia: null,
        rol: 'cliente', // 'cliente' | 'admin' | 'barbero'
        
        // UI
        vista: 'portal',      // 'portal' | 'admin'
        modulo: 'agendar',    // módulo actual
        sidebarAbierto: true,  // estado del menú hamburguesa
        modal: null,          // { tipo: 'login', 'confirmar', etc, data: {} }
        
        // ========== CACHÉ DE DATOS (PERSISTE ENTRE MÓDULOS) ==========
        cache: {
            // Datos públicos (siempre disponibles)
            barberos: [],
            servicios: [],
            
            // Datos privados (solo admin)
            clientes: [],
            citas: [],
            productos: [],
            ventas: [],
            
            // Metadatos
            ultimaActualizacion: null,
            version: '2.0.0',
            inicializado: false
        },
        
        // UI temporal
        ui: {
            loading: false,
            notificacion: null,
            mensajeConfirmacion: null
        }
    },
    
    // ============================================
    // INICIALIZACIÓN
    // ============================================
    
    async init() {
        console.log('🚀 Inicializando BarberHub v2.0...');
        
        // Cargar configuración guardada
        await this.cargarConfiguracion();
        
        // Verificar autenticación
        await this.verificarAutenticacion();
        
        // Cargar caché de datos públicos (barberos, servicios)
        await this.cargarCachePublico();
        
        // Si está autenticado, cargar datos privados
        if (this.estado.autenticado) {
            await this.cargarCachePrivado();
        }
        
        // Inicializar UI
        this.renderizarUI();
        this.renderizarHeader();
        this.renderizarFooter();
        
        // ✅ INICIAR EL ROUTER PARA MANEJAR LAS VISTAS
        if (window.router) {
            // Si ya estamos en una ruta, manejarla
            const rutaInicial = window.location.hash.substring(1) || '/portal/agendar';
            window.router.navegar(rutaInicial, false);
        } else {
            console.error('❌ Router no disponible');
        }
        
        // Ocultar loader
        setTimeout(() => this.ocultarLoader(), 500);
        
        console.log('✅ BarberHub v2.0 listo');
    },
    // ✅ AGREGAR FUNCIONES DE LOADER
    mostrarLoader() {
        let loader = document.getElementById('app-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'app-loader';
            loader.innerHTML = `
                <div class="loader-overlay">
                    <div class="loader-spinner"></div>
                    <p>Cargando BarberHub...</p>
                </div>
            `;
            document.body.appendChild(loader);
        }
        loader.style.display = 'flex';
    },
    
    ocultarLoader() {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                loader.style.opacity = '1';
            }, 300);
        }
    },
    
    // ============================================
    // CONFIGURACIÓN Y PERSISTENCIA
    // ============================================
    
    async cargarConfiguracion() {
        try {
            // Cargar tema
            const tema = localStorage.getItem('barberhub_tema');
            if (tema) this.estado.tema = tema;
            
            // Cargar sidebar state
            const sidebarState = localStorage.getItem('barberhub_sidebar');
            if (sidebarState !== null) {
                this.estado.sidebarAbierto = sidebarState === 'true';
            }
            
            console.log('⚙️ Configuración cargada');
        } catch (error) {
            console.error('Error cargando configuración:', error);
        }
    },
    
    guardarConfiguracion() {
        try {
            localStorage.setItem('barberhub_tema', this.estado.tema);
            localStorage.setItem('barberhub_sidebar', this.estado.sidebarAbierto);
        } catch (error) {
            console.error('Error guardando configuración:', error);
        }
    },
    
    // ============================================
    // AUTENTICACIÓN
    // ============================================
    
    async verificarAutenticacion() {
        try {
            const licencia = storage.localStorage.get('barberhub_licencia');
            if (licencia && licencia.expiracion) {
                const fechaExpiracion = new Date(licencia.expiracion);
                if (fechaExpiracion > new Date()) {
                    this.estado.autenticado = true;
                    this.estado.licencia = licencia;
                    this.estado.rol = this.obtenerRolPorLicencia(licencia.tipo);
                    this.estado.vista = 'admin';
                    console.log('🔐 Sesión activa:', licencia.tipo);
                    return true;
                } else {
                    // Licencia expirada
                    storage.localStorage.remove('barberhub_licencia');
                    console.warn('⚠️ Licencia expirada');
                }
            }
        } catch (error) {
            console.error('Error verificando autenticación:', error);
        }
        
        this.estado.autenticado = false;
        this.estado.licencia = null;
        this.estado.rol = 'cliente';
        this.estado.vista = 'portal';
        return false;
    },
    
    obtenerRolPorLicencia(tipo) {
        const roles = {
            'DEMO': 'admin',
            'BASICO': 'admin',
            'PRO': 'admin',
            'SALON': 'admin'
        };
        return roles[tipo] || 'cliente';
    },
    
    async login(licenciaKey) {
        // Validar licencia (simplificado - luego se puede expandir)
        const licenciasValidas = {
            'BARBERHUB-DEMO-2026': { tipo: 'DEMO', dias: 7 },
            'BARBERHUB-BASICO-2026': { tipo: 'BASICO', dias: 365 },
            'BARBERHUB-PRO-2026': { tipo: 'PRO', dias: 365 },
            'BARBERHUB-SALON-2026': { tipo: 'SALON', dias: 365 }
        };
        
        const licenciaInfo = licenciasValidas[licenciaKey.toUpperCase()];
        if (!licenciaInfo) {
            this.mostrarNotificacion('❌ Licencia inválida', 'error');
            return false;
        }
        
        const expiracion = new Date();
        expiracion.setDate(expiracion.getDate() + licenciaInfo.dias);
        
        const licencia = {
            key: licenciaKey.toUpperCase(),
            tipo: licenciaInfo.tipo,
            expiracion: expiracion.toISOString()
        };
        
        // Guardar licencia
        storage.localStorage.set('barberhub_licencia', licencia);
        
        // Actualizar estado
        this.estado.autenticado = true;
        this.estado.licencia = licencia;
        this.estado.rol = this.obtenerRolPorLicencia(licencia.tipo);
        this.estado.vista = 'admin';
        this.estado.modulo = 'dashboard';
        
        // Cargar datos privados
        await this.cargarCachePrivado();
        
        // Cerrar modal si está abierto
        this.cerrarModal();
        
        // Actualizar UI
        this.renderizarUI();
        
        this.mostrarNotificacion(`✅ Bienvenido ${licencia.tipo}`, 'success');
        
        // Navegar al dashboard
        if (window.router) {
            window.router.navegar('/admin/dashboard');
        }
        
        return true;
    },
    
    logout() {
        if (confirm('¿Cerrar sesión?')) {
            storage.localStorage.remove('barberhub_licencia');
            
            this.estado.autenticado = false;
            this.estado.licencia = null;
            this.estado.rol = 'cliente';
            this.estado.vista = 'portal';
            this.estado.modulo = 'agendar';
            
            // Limpiar caché privado (opcional, mantener para próxima sesión)
            this.estado.cache.clientes = [];
            this.estado.cache.citas = [];
            this.estado.cache.productos = [];
            this.estado.cache.ventas = [];
            
            this.renderizarUI();
            
            if (window.router) {
                window.router.navegar('/portal/agendar');
            }
            
            this.mostrarNotificacion('Sesión cerrada', 'info');
        }
    },
    
    // ============================================
    // CACHÉ DE DATOS
    // ============================================
    
    async cargarCachePublico() {
        console.log('📦 Cargando caché público...');
        
        try {
            // Cargar barberos
            const barberos = await storage.obtenerTodos('barberos');
            if (barberos.length > 0) {
                this.estado.cache.barberos = barberos;
            } else {
                this.estado.cache.barberos = this.getBarberosEjemplo();
                await this.guardarCachePublico();
            }
            
            // Cargar servicios
            const servicios = await storage.obtenerTodos('servicios');
            if (servicios.length > 0) {
                this.estado.cache.servicios = servicios;
            } else {
                this.estado.cache.servicios = this.getServiciosEjemplo();
                await this.guardarCachePublico();
            }
            
            console.log(`📦 Caché público: ${this.estado.cache.barberos.length} barberos, ${this.estado.cache.servicios.length} servicios`);
        } catch (error) {
            console.error('Error cargando caché público:', error);
            this.estado.cache.barberos = this.getBarberosEjemplo();
            this.estado.cache.servicios = this.getServiciosEjemplo();
        }
    },
    
    async cargarCachePrivado() {
        console.log('📦 Cargando caché privado...');
        
        try {
            this.estado.cache.clientes = await storage.obtenerTodos('clientes') || [];
            this.estado.cache.citas = await storage.obtenerTodos('citas') || [];
            this.estado.cache.productos = await storage.obtenerTodos('productos') || [];
            this.estado.cache.ventas = await storage.obtenerTodos('ventas') || [];
            
            console.log(`📦 Caché privado: ${this.estado.cache.clientes.length} clientes, ${this.estado.cache.citas.length} citas`);
        } catch (error) {
            console.error('Error cargando caché privado:', error);
        }
    },
    
    async guardarCachePublico() {
        try {
            for (const barbero of this.estado.cache.barberos) {
                await storage.guardar('barberos', barbero);
            }
            for (const servicio of this.estado.cache.servicios) {
                await storage.guardar('servicios', servicio);
            }
        } catch (error) {
            console.error('Error guardando caché público:', error);
        }
    },
    
    getBarberosEjemplo() {
        return [
            { id: 1, nombre: 'Carlos Martínez', telefono: '555-0101', especialidad: 'Corte', estado: 'activo', horarioInicio: '09:00', horarioFin: '18:00' },
            { id: 2, nombre: 'Miguel Rodríguez', telefono: '555-0102', especialidad: 'Barba', estado: 'activo', horarioInicio: '10:00', horarioFin: '19:00' },
            { id: 3, nombre: 'Juan Pérez', telefono: '555-0103', especialidad: 'Todo', estado: 'activo', horarioInicio: '08:00', horarioFin: '17:00' }
        ];
    },
    
    getServiciosEjemplo() {
        return [
            { id: 1, nombre: 'Corte de Cabello', categoria: 'Corte', precio: 350, duracion: 30, icono: '✂️', estado: 'activo' },
            { id: 2, nombre: 'Barba', categoria: 'Barba', precio: 200, duracion: 20, icono: '🧔', estado: 'activo' },
            { id: 3, nombre: 'Corte + Barba', categoria: 'Paquete', precio: 500, duracion: 50, icono: '✨', estado: 'activo' }
        ];
    },
    
    // ============================================
    // CRUD GENÉRICO (Actualiza caché + storage)
    // ============================================
    
    async agregar(coleccion, item) {
        const nuevoItem = {
            id: Date.now(),
            ...item,
            fechaCreacion: new Date().toISOString()
        };
        
        this.estado.cache[coleccion].push(nuevoItem);
        await storage.guardar(coleccion, nuevoItem);
        
        this.mostrarNotificacion(`${coleccion.slice(0, -1)} agregado`, 'success');
        return nuevoItem;
    },
    
    async actualizar(coleccion, id, nuevosDatos) {
        const index = this.estado.cache[coleccion].findIndex(i => i.id === id);
        if (index === -1) return null;
        
        const actualizado = {
            ...this.estado.cache[coleccion][index],
            ...nuevosDatos,
            fechaActualizacion: new Date().toISOString()
        };
        
        this.estado.cache[coleccion][index] = actualizado;
        await storage.guardar(coleccion, actualizado);
        
        this.mostrarNotificacion(`${coleccion.slice(0, -1)} actualizado`, 'success');
        return actualizado;
    },
    
    async eliminar(coleccion, id) {
        const index = this.estado.cache[coleccion].findIndex(i => i.id === id);
        if (index === -1) return false;
        
        this.estado.cache[coleccion].splice(index, 1);
        await storage.eliminar(coleccion, id);
        
        this.mostrarNotificacion(`${coleccion.slice(0, -1)} eliminado`, 'success');
        return true;
    },
    
    // ============================================
    // UI Y RENDERIZADO
    // ============================================
    
    renderizarUI() {
        this.renderizarHeader();
        this.renderizarSidebar();
        this.renderizarFooter();
    },
    
    renderizarHeader() {
        const header = document.getElementById('app-header');
        if (!header) return;
        
        const autenticado = this.estado.autenticado;
        const licencia = this.estado.licencia;
        
        header.innerHTML = `
            <div class="header-content">
                <div class="header-logo">
                    ${this.estado.vista === 'admin' ? `
                        <button class="hamburger-btn" id="hamburger-btn">☰</button>
                    ` : ''}
                    <div>
                        <h1 class="header-title">💈 BarberHub</h1>
                        <p class="header-subtitle">${autenticado ? 'Panel Administrativo' : 'Agenda tu cita'}</p>
                    </div>
                </div>
                <div class="header-actions">
                    ${autenticado ? `
                        <div class="license-badge">✅ ${licencia.tipo}</div>
                        <button class="btn-logout" id="btn-logout">🚪 Salir</button>
                    ` : `
                        <button class="btn-login" id="btn-login">🔐 Iniciar Sesión</button>
                    `}
                </div>
            </div>
        `;
        
        // Eventos
        const loginBtn = document.getElementById('btn-login');
        if (loginBtn) loginBtn.onclick = () => this.mostrarModal('login');
        
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) logoutBtn.onclick = () => this.logout();
        
        const hamburger = document.getElementById('hamburger-btn');
        if (hamburger) hamburger.onclick = () => this.toggleSidebar();
    },
    
    renderizarSidebar() {
        const sidebar = document.getElementById('app-sidebar');
        if (!sidebar) return;
        
        if (this.estado.vista !== 'admin') {
            sidebar.style.display = 'none';
            return;
        }
        
        sidebar.style.display = 'block';
        
        const menuItems = [
            { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
            { path: '/admin/clientes', icon: '👥', label: 'Clientes' },
            { path: '/admin/citas', icon: '📅', label: 'Citas' },
            { path: '/admin/barberos', icon: '✂️', label: 'Barberos' },
            { path: '/admin/servicios', icon: '💈', label: 'Servicios' },
            { path: '/admin/inventario', icon: '📦', label: 'Inventario' },
            { path: '/admin/caja', icon: '💰', label: 'Caja' },
            { path: '/admin/reportes', icon: '📈', label: 'Reportes' },
            { path: '/admin/configuracion', icon: '⚙️', label: 'Configuración' }
        ];
        
        sidebar.innerHTML = `
            <div class="sidebar-container">
                <div class="sidebar-header">
                    <h3>💈 BarberHub</h3>
                </div>
                <nav class="sidebar-nav">
                    ${menuItems.map(item => `
                        <a href="#${item.path}" class="sidebar-link" data-path="${item.path}">
                            <span class="sidebar-icon">${item.icon}</span>
                            <span class="sidebar-label">${item.label}</span>
                        </a>
                    `).join('')}
                </nav>
            </div>
        `;
        // ✅ USAR EL ROUTER PARA NAVEGAR
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const path = link.getAttribute('data-path');
                if (window.router) {
                    window.router.navegar(path);
                }
            });
        });        
        // Marcar link activo
        const currentPath = window.location.hash.substring(1);
        document.querySelectorAll('.sidebar-link').forEach(link => {
            const linkPath = link.getAttribute('data-path');
            if (linkPath === currentPath) {
                link.classList.add('active');
            }
        });
    },
    
    renderizarFooter() {
        const footer = document.getElementById('app-footer');
        if (!footer) return;
        
        footer.innerHTML = `
            <div class="footer-content">
                <p>© ${new Date().getFullYear()} BarberHub - Gestión Inteligente para Barberías</p>
            </div>
        `;
    },
    
    toggleSidebar() {
        this.estado.sidebarAbierto = !this.estado.sidebarAbierto;
        this.guardarConfiguracion();
        
        const sidebar = document.getElementById('app-sidebar');
        const main = document.getElementById('app-main');
        
        if (sidebar && main) {
            if (this.estado.sidebarAbierto) {
                sidebar.classList.remove('sidebar-cerrado');
                main.classList.remove('main-sidebar-cerrado');
            } else {
                sidebar.classList.add('sidebar-cerrado');
                main.classList.add('main-sidebar-cerrado');
            }
        }
    },
    
    // ============================================
    // MODALES
    // ============================================
    
    mostrarModal(tipo, data = {}) {
        this.estado.modal = { tipo, data };
        
        let modalHtml = '';
        
        if (tipo === 'login') {
            modalHtml = `
                <div class="modal-overlay" id="modal-overlay">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>🔐 Iniciar Sesión</h3>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label>Clave de Licencia</label>
                                <input type="text" id="licencia-input" class="form-control" placeholder="BARBERHUB-XXXX-XXXX">
                            </div>
                            <div class="license-ejemplos">
                                <small>Ejemplos: BARBERHUB-DEMO-2026, BARBERHUB-PRO-2026</small>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" id="modal-cancelar">Cancelar</button>
                            <button class="btn btn-primary" id="modal-confirmar">Ingresar</button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Remover modal existente
        const existingModal = document.getElementById('modal-overlay');
        if (existingModal) existingModal.remove();
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = document.getElementById('modal-overlay');
        const closeBtn = modal?.querySelector('.modal-close');
        const cancelBtn = document.getElementById('modal-cancelar');
        const confirmBtn = document.getElementById('modal-confirmar');
        
        closeBtn?.addEventListener('click', () => this.cerrarModal());
        cancelBtn?.addEventListener('click', () => this.cerrarModal());
        
        if (tipo === 'login' && confirmBtn) {
            confirmBtn.onclick = async () => {
                const licenciaInput = document.getElementById('licencia-input');
                if (licenciaInput && licenciaInput.value) {
                    await this.login(licenciaInput.value);
                } else {
                    this.mostrarNotificacion('Ingresa una licencia', 'warning');
                }
            };
        }
        
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) this.cerrarModal();
        });
    },
    
    cerrarModal() {
        const modal = document.getElementById('modal-overlay');
        if (modal) modal.remove();
        this.estado.modal = null;
    },
    
    // ============================================
    // NOTIFICACIONES
    // ============================================
    
    mostrarNotificacion(mensaje, tipo = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${tipo}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : 'ℹ️'}</span>
                <p>${mensaje}</p>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
};

// ============================================
// EXPORTAR E INICIALIZAR
// ============================================

window.app = app;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}
