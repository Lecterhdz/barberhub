// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - CORE APP (CORREGIDO)
// ─────────────────────────────────────────────────────────────────────

import { router } from './router.js';
import { storage } from './storage.js';
import { utils } from './utils.js';
import { Sidebar } from '../components/Sidebar.js';

console.log('🏗️ Core App cargado');

export const app = {
    estado: {
        usuario: null,
        licencia: null,
        tema: 'dark-amber',
        featureActivo: null
    },

    init: async function() {
        console.log('💈 BarberHub iniciando...');
        
        // Inicializar storage
        await storage.init();
        
        // Cargar estado guardado
        await this.cargarEstado();
        
        // Verificar autenticación
        const autenticado = await this.verificarAuth();
        
        if (autenticado) {
            // Renderizar header y sidebar
            this.renderHeader();
            Sidebar.render();
            this.renderFooter();
            
            // Navegar a dashboard
            router.navegar('/dashboard');
        } else {
            // Navegar a login
            router.navegar('/auth');
        }
        
        // Escuchar cambios de ruta
        window.addEventListener('popstate', () => {
            router.manejarRuta();
        });
        
        console.log('✅ BarberHub listo');
    },

    cargarEstado: async function() {
        const estadoGuardado = storage.localStorage.get('barberhub_estado');
        if (estadoGuardado) {
            this.estado = { ...this.estado, ...estadoGuardado };
        }
    },

    guardarEstado: function() {
        storage.localStorage.set('barberhub_estado', this.estado);
    },

    verificarAuth: async function() {
        const licencia = storage.localStorage.get('barberhub_licencia');
        if (licencia) {
            this.estado.licencia = licencia;
            
            // Verificar expiración
            if (new Date() > new Date(this.estado.licencia.expiracion)) {
                this.estado.licencia = null;
                storage.localStorage.remove('barberhub_licencia');
                this.guardarEstado();
                return false;
            }
            
            return true;
        }
        return false;
    },

    setLicencia: function(licencia) {
        this.estado.licencia = licencia;
        storage.localStorage.set('barberhub_licencia', licencia);
        this.guardarEstado();
    },

    logout: function() {
        this.estado.usuario = null;
        this.estado.licencia = null;
        storage.localStorage.remove('barberhub_licencia');
        this.guardarEstado();
        router.navegar('/auth');
    },

    cargarFeature: async function(featureName) {
        console.log('🔌 Feature activado:', featureName);
        this.estado.featureActivo = featureName;
    },

    renderHeader: function() {
        const header = document.getElementById('app-header');
        if (!header) return;
        
        const licencia = this.estado.licencia;
        
        header.innerHTML = `
            <div class="header-content">
                <div>
                    <h1 class="header-title">💈 BarberHub</h1>
                    <p class="header-subtitle">Gestión Inteligente para Barberías</p>
                </div>
                <div class="header-actions">
                    ${licencia ? `
                        <div class="license-badge">
                            ✅ ${licencia.tipo} - Exp: ${utils.formatoFecha(licencia.expiracion)}
                        </div>
                    ` : ''}
                    <button onclick="window.app.logout()" class="btn-logout">
                        🚪 Salir
                    </button>
                </div>
            </div>
        `;
    },

    renderFooter: function() {
        const footer = document.getElementById('app-footer');
        if (!footer) return;
        
        footer.innerHTML = `
            <p>© 2026 BarberHub - Gestión Inteligente para Barberías</p>
            <p style="margin-top:10px;font-size:12px;opacity:0.7;">
                Los datos se guardan localmente. Exporta regularmente.
            </p>
        `;
    }
};

// Exportar para uso global
window.app = app;

// Iniciar cuando DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
