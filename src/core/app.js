// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - CORE APP (COMPLETAMENTE CORREGIDO)
// ─────────────────────────────────────────────────────────────────────

import { router } from './router.js';
import { storage } from './storage.js';
import { utils } from './utils.js';
import { Sidebar } from '../components/Sidebar.js';
import { ThemeSwitcher } from '../components/ThemeSwitcher.js';

console.log('🏗️ Core App cargado');

export const app = {
    estado: {
        usuario: null,
        licencia: null,
        tema: 'dark-amber',
        featureActivo: null,
        configuracion: {
            notificaciones: true,
            sonidos: false,
            modoOscuro: true,
            idioma: 'es'
        }
    },

    // Inicialización principal
    init: async function() {
        console.log('💈 BarberHub iniciando...');
        
        try {
            // Mostrar loader
            this.mostrarLoader();
            
            // Inicializar storage
            await storage.init();
            console.log('✅ Storage inicializado');
            
            // Cargar estado guardado
            await this.cargarEstado();
            console.log('✅ Estado cargado');
            
            // Aplicar tema
            this.aplicarTema();
            
            // Verificar autenticación
            const autenticado = await this.verificarAuth();
            
            // Renderizar header, sidebar y footer siempre
            this.renderHeader();
            Sidebar.render();
            this.renderFooter();
            
            // ✅ INICIALIZAR THEME SWITCHER AQUÍ
            ThemeSwitcher.init(); 
            
            // Configurar eventos globales
            this.configurarEventosGlobales();
            
            if (autenticado) {
                // Navegar a dashboard
                router.navegar('/dashboard');
            } else {
                // Navegar a login
                router.navegar('/auth');
            }
            
            // Ocultar loader
            this.ocultarLoader();
            
            console.log('✅ BarberHub listo');
            
        } catch (error) {
            console.error('❌ Error en inicialización:', error);
            this.mostrarError('Error al iniciar la aplicación. Recarga la página.');
            this.ocultarLoader();
        }
    },

    // Mostrar loader
    mostrarLoader: function() {
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

    // Ocultar loader
    ocultarLoader: function() {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    },

    // Mostrar error
    mostrarError: function(mensaje) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'global-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <span>⚠️</span>
                <p>${mensaje}</p>
                <button onclick="this.parentElement.parentElement.remove()">Cerrar</button>
            </div>
        `;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    },

    // Cargar estado guardado
    cargarEstado: async function() {
        try {
            const estadoGuardado = storage.localStorage.get('barberhub_estado');
            if (estadoGuardado) {
                this.estado = { ...this.estado, ...estadoGuardado };
            }
            
            const configGuardada = storage.localStorage.get('barberhub_config');
            if (configGuardada) {
                this.estado.configuracion = { ...this.estado.configuracion, ...configGuardada };
            }
        } catch (error) {
            console.error('Error cargando estado:', error);
        }
    },

    // Guardar estado
    guardarEstado: function() {
        try {
            storage.localStorage.set('barberhub_estado', this.estado);
            storage.localStorage.set('barberhub_config', this.estado.configuracion);
        } catch (error) {
            console.error('Error guardando estado:', error);
        }
    },

    // Aplicar tema
    aplicarTema: function() {
        const themeLink = document.getElementById('theme-css');
        if (themeLink) {
            themeLink.href = `./src/core/themes/${this.estado.tema}.css`;
        }
        document.body.setAttribute('data-theme', this.estado.tema);
    },

    // Cambiar tema
    cambiarTema: function(tema) {
        const temasValidos = ['dark-amber', 'dark-neon', 'light-clean'];
        if (temasValidos.includes(tema)) {
            this.estado.tema = tema;
            this.aplicarTema();
            this.guardarEstado();
            
            // Notificar cambio
            if (window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('theme-changed', { detail: { tema } }));
            }
        }
    },

    // Verificar autenticación
    verificarAuth: async function() {
        try {
            const licencia = storage.localStorage.get('barberhub_licencia');
            if (licencia && licencia.expiracion) {
                this.estado.licencia = licencia;
                
                // Verificar expiración
                const fechaExpiracion = new Date(licencia.expiracion);
                const ahora = new Date();
                
                if (fechaExpiracion <= ahora) {
                    console.warn('⚠️ Licencia expirada');
                    this.estado.licencia = null;
                    storage.localStorage.remove('barberhub_licencia');
                    this.guardarEstado();
                    return false;
                }
                
                // Verificar días restantes y mostrar advertencia
                const diasRestantes = Math.ceil((fechaExpiracion - ahora) / (1000 * 60 * 60 * 24));
                if (diasRestantes <= 7 && diasRestantes > 0) {
                    console.warn(`⚠️ Licencia expira en ${diasRestantes} días`);
                    this.mostrarAdvertenciaLicencia(diasRestantes);
                }
                
                return true;
            }
        } catch (error) {
            console.error('Error verificando autenticación:', error);
        }
        return false;
    },

    // Mostrar advertencia de licencia próxima a expirar
    mostrarAdvertenciaLicencia: function(diasRestantes) {
        const advertencia = document.createElement('div');
        advertencia.className = 'warning-banner';
        advertencia.innerHTML = `
            <div class="warning-content">
                <span>⚠️</span>
                <p>Tu licencia expirará en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}. 
                Contacta con soporte para renovar.</p>
                <button onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
        `;
        document.body.insertBefore(advertencia, document.body.firstChild);
        
        setTimeout(() => {
            advertencia.remove();
        }, 10000);
    },

    // Establecer licencia
    setLicencia: function(licencia) {
        this.estado.licencia = licencia;
        storage.localStorage.set('barberhub_licencia', licencia);
        this.guardarEstado();
        
        // Disparar evento
        window.dispatchEvent(new CustomEvent('license-activated', { detail: licencia }));
    },

    // Cerrar sesión
    logout: function() {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            this.estado.usuario = null;
            this.estado.licencia = null;
            storage.localStorage.remove('barberhub_licencia');
            this.guardarEstado();
            router.navegar('/auth');
            
            // Recargar sidebar para actualizar estado
            Sidebar.render();
        }
    },

    // Cargar feature
    cargarFeature: async function(featureName) {
        console.log('🔌 Activando feature:', featureName);
        this.estado.featureActivo = featureName;
        this.guardarEstado();
        
        // Disparar evento
        window.dispatchEvent(new CustomEvent('feature-changed', { detail: { feature: featureName } }));
    },

    // Renderizar header
    renderHeader: function() {
        const header = document.getElementById('app-header');
        if (!header) return;
        
        const licencia = this.estado.licencia;
        const fechaExpiracion = licencia ? new Date(licencia.expiracion) : null;
        const diasRestantes = fechaExpiracion ? Math.ceil((fechaExpiracion - new Date()) / (1000 * 60 * 60 * 24)) : 0;
        
        header.innerHTML = `
            <div class="header-content">
                <div class="header-logo">
                    <button class="mobile-menu-btn" id="mobile-menu-btn">☰</button>
                    <div>
                        <h1 class="header-title">💈 BarberHub</h1>
                        <p class="header-subtitle">Gestión Inteligente para Barberías</p>
                    </div>
                </div>
                <div class="header-actions">
                    ${licencia ? `
                        <div class="license-badge ${diasRestantes <= 7 ? 'expiring-soon' : ''}">
                            ✅ ${licencia.tipo}
                            ${diasRestantes > 0 ? `<small>${diasRestantes} días</small>` : ''}
                        </div>
                    ` : ''}
                    <!-- Los botones se agregarán aquí por ThemeSwitcher -->
                </div>
            </div>
        `;
        
        // Disparar evento para que ThemeSwitcher agregue sus botones
        window.dispatchEvent(new CustomEvent('header-ready'));
    },

    // Renderizar footer
    renderFooter: function() {
        const footer = document.getElementById('app-footer');
        if (!footer) return;
        
        const year = new Date().getFullYear();
        
        footer.innerHTML = `
            <div class="footer-content">
                <p>© ${year} BarberHub - Gestión Inteligente para Barberías</p>
                <div class="footer-links">
                    <a href="#" onclick="window.app.mostrarAcercaDe()">Acerca de</a>
                    <a href="#" onclick="window.app.mostrarAyuda()">Ayuda</a>
                    <a href="#" onclick="window.app.exportarDatos()">Exportar datos</a>
                </div>
                <p class="footer-note">
                    Los datos se guardan localmente. Exporta regularmente para respaldo.
                </p>
            </div>
        `;
    },

    // Configurar eventos globales
    configurarEventosGlobales: function() {
        // Teclas de acceso rápido
        document.addEventListener('keydown', (e) => {
            // Ctrl + S: Guardar
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.guardarEstado();
                this.mostrarNotificacion('Datos guardados', 'success');
            }
            
            // Escape: Cerrar modales
            if (e.key === 'Escape') {
                this.cerrarModales();
            }
        });
        
        // Detectar cambios de conexión
        window.addEventListener('online', () => {
            this.mostrarNotificacion('Conexión restablecida', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.mostrarNotificacion('Sin conexión a internet', 'warning');
        });
    },

    // Mostrar notificación
    mostrarNotificacion: function(mensaje, tipo = 'info') {
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
    },

    // Cerrar modales
    cerrarModales: function() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.remove();
        });
    },

    // Abrir configuración
    openConfiguracion: function() {
        const config = {
            tema: this.estado.tema,
            notificaciones: this.estado.configuracion.notificaciones,
            sonidos: this.estado.configuracion.sonidos,
            idioma: this.estado.configuracion.idioma
        };
        
        // Disparar evento para que el feature de configuración lo maneje
        window.dispatchEvent(new CustomEvent('open-config', { detail: config }));
    },

    // Mostrar acerca de
    mostrarAcercaDe: function() {
        alert(`
BarberHub v1.0.0
Gestión Inteligente para Barberías

Desarrollado para optimizar la gestión de tu barbería.
© 2026 Todos los derechos reservados.
        `);
    },

    // Mostrar ayuda
    mostrarAyuda: function() {
        alert(`
Ayuda rápida:

• Navega usando el menú lateral
• Los datos se guardan automáticamente
• Exporta tus datos regularmente
• Usa Ctrl+S para guardar manualmente

Para más ayuda, contacta con soporte.
        `);
    },

    // Exportar datos
    exportarDatos: async function() {
        try {
            const datos = {
                exportacion: new Date().toISOString(),
                version: '1.0.0',
                clientes: await storage.obtenerTodos('clientes') || [],
                citas: await storage.obtenerTodos('citas') || [],
                servicios: await storage.obtenerTodos('servicios') || [],
                configuracion: this.estado.configuracion
            };
            
            const dataStr = JSON.stringify(datos, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `barberhub-backup-${new Date().toISOString().slice(0,19)}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            this.mostrarNotificacion('Datos exportados correctamente', 'success');
        } catch (error) {
            console.error('Error exportando datos:', error);
            this.mostrarNotificacion('Error al exportar datos', 'error');
        }
    },

    // Importar datos
    importarDatos: function(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const datos = JSON.parse(e.target.result);
                
                // Validar estructura
                if (datos.clientes && Array.isArray(datos.clientes)) {
                    await storage.guardarMultiples('clientes', datos.clientes);
                }
                
                if (datos.citas && Array.isArray(datos.citas)) {
                    await storage.guardarMultiples('citas', datos.citas);
                }
                
                this.mostrarNotificacion('Datos importados correctamente', 'success');
                location.reload();
            } catch (error) {
                console.error('Error importando datos:', error);
                this.mostrarNotificacion('Error al importar datos', 'error');
            }
        };
        reader.readAsText(file);
    },

    // Obtener estadísticas
    getEstadisticas: async function() {
        try {
            const clientes = await storage.obtenerTodos('clientes') || [];
            const citas = await storage.obtenerTodos('citas') || [];
            const servicios = await storage.obtenerTodos('servicios') || [];
            
            const citasHoy = citas.filter(cita => {
                const fechaCita = new Date(cita.fecha);
                const hoy = new Date();
                return fechaCita.toDateString() === hoy.toDateString();
            });
            
            return {
                totalClientes: clientes.length,
                totalCitas: citas.length,
                citasHoy: citasHoy.length,
                totalServicios: servicios.length,
                ultimaActualizacion: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return null;
        }
    }
};

// Exportar para uso global
window.app = app;

// Iniciar cuando DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app.init();
    });
} else {
    app.init();
}
