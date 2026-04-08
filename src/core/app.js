// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - CORE APP (COMPLETAMENTE CORREGIDO Y OPTIMIZADO)
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
            
            // Inicializar ThemeSwitcher después de que el header esté listo
            setTimeout(() => {
                ThemeSwitcher.init();
            }, 100);
            
            // Configurar eventos globales
            this.configurarEventosGlobales();
            
            // Agregar clase al body para estilos específicos
            if (!autenticado) {
                document.body.classList.add('auth-page');
            } else {
                document.body.classList.remove('auth-page');
            }
            
            if (autenticado) {
                router.navegar('/dashboard');
            } else {
                router.navegar('/auth');
            }
            
            // Ocultar loader
            setTimeout(() => {
                this.ocultarLoader();
            }, 500);
            
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
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                loader.style.opacity = '1';
            }, 300);
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
            if (errorDiv) errorDiv.remove();
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
            
            // Cargar tema guardado
            const temaGuardado = localStorage.getItem('barberhub_tema');
            if (temaGuardado) {
                this.estado.tema = temaGuardado;
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
            localStorage.setItem('barberhub_tema', this.estado.tema);
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
        document.documentElement.setAttribute('data-theme', this.estado.tema);
    },

    // Cambiar tema
    cambiarTema: function(tema) {
        const temasValidos = ['dark-amber', 'dark-neon', 'light-clean'];
        if (temasValidos.includes(tema)) {
            this.estado.tema = tema;
            this.aplicarTema();
            this.guardarEstado();
            
            // Notificar cambio
            window.dispatchEvent(new CustomEvent('theme-changed', { detail: { tema } }));
            
            // Mostrar notificación
            this.mostrarNotificacion(`Tema cambiado a ${tema}`, 'success');
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
                
                // Verificar días restantes
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

    // Mostrar advertencia de licencia
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
            if (advertencia) advertencia.remove();
        }, 10000);
    },

    // Establecer licencia
    setLicencia: function(licencia) {
        this.estado.licencia = licencia;
        storage.localStorage.set('barberhub_licencia', licencia);
        this.guardarEstado();
        
        // Forzar actualización del header
        this.renderHeader();
        
        // Disparar evento
        window.dispatchEvent(new CustomEvent('license-activated', { detail: licencia }));
        
        console.log('✅ Licencia guardada:', licencia);
    },

    // Cerrar sesión
    logout: function() {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            this.estado.usuario = null;
            this.estado.licencia = null;
            storage.localStorage.remove('barberhub_licencia');
            this.guardarEstado();
            
            // Agregar clase auth-page
            document.body.classList.add('auth-page');
            
            router.navegar('/auth');
            Sidebar.render();
            
            this.mostrarNotificacion('Sesión cerrada correctamente', 'info');
        }
    },

    // Cargar feature
    cargarFeature: async function(featureName) {
        console.log('🔌 Activando feature:', featureName);
        this.estado.featureActivo = featureName;
        this.guardarEstado();
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
                </div>
            </div>
        `;
        
        // Disparar evento para ThemeSwitcher
        window.dispatchEvent(new CustomEvent('header-ready'));
        
        // Evento para menú móvil
        const mobileBtn = document.getElementById('mobile-menu-btn');
        if (mobileBtn) {
            mobileBtn.onclick = () => {
                const sidebar = document.getElementById('app-sidebar');
                if (sidebar) sidebar.classList.toggle('open');
            };
        }
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
            </div>
        `;
    },

    // Configurar eventos globales
    configurarEventosGlobales: function() {
        // Ctrl + S
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.guardarEstado();
                this.mostrarNotificacion('Datos guardados', 'success');
            }
            if (e.key === 'Escape') {
                this.cerrarModales();
            }
        });
        
        // Online/Offline
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
                <span>${tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : tipo === 'warning' ? '⚠️' : 'ℹ️'}</span>
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
        document.querySelectorAll('.modal').forEach(modal => modal.remove());
    },

    // Abrir configuración
    openConfiguracion: function() {
        window.dispatchEvent(new CustomEvent('open-config', { 
            detail: this.estado.configuracion 
        }));
        this.mostrarNotificacion('Configuración - Próximamente', 'info');
    },

    // Mostrar acerca de
    mostrarAcercaDe: function() {
        alert(`BarberHub v1.0.0\nGestión Inteligente para Barberías\n\nDesarrollado para optimizar la gestión de tu barbería.\n© 2026 Todos los derechos reservados.`);
    },

    // Mostrar ayuda
    mostrarAyuda: function() {
        alert(`Ayuda rápida:\n\n• Navega usando el menú lateral\n• Los datos se guardan automáticamente\n• Exporta tus datos regularmente\n• Usa Ctrl+S para guardar manualmente\n\nPara más ayuda, contacta con soporte.`);
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
                productos: await storage.obtenerTodos('productos') || [],
                configuracion: this.estado.configuracion
            };
            
            const dataStr = JSON.stringify(datos, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `barberhub-backup-${new Date().toISOString().slice(0, 19)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
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
                
                if (datos.clientes?.length) {
                    await storage.guardarMultiples('clientes', datos.clientes);
                }
                if (datos.citas?.length) {
                    await storage.guardarMultiples('citas', datos.citas);
                }
                if (datos.servicios?.length) {
                    await storage.guardarMultiples('servicios', datos.servicios);
                }
                
                this.mostrarNotificacion('Datos importados correctamente', 'success');
                setTimeout(() => location.reload(), 1500);
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
            const [clientes, citas, servicios] = await Promise.all([
                storage.obtenerTodos('clientes'),
                storage.obtenerTodos('citas'),
                storage.obtenerTodos('servicios')
            ]);
            
            const hoy = new Date().toDateString();
            const citasHoy = citas.filter(cita => 
                new Date(cita.fecha).toDateString() === hoy
            );
            
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
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}
