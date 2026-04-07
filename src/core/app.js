// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - CORE APP (NÚCLEO NO MODIFICABLE)
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
            // Cargar sidebar
            Sidebar.render();
            
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
        const estadoGuardado = localStorage.getItem('barberhub_estado');
        if (estadoGuardado) {
            this.estado = { ...this.estado, ...JSON.parse(estadoGuardado) };
        }
    },

    guardarEstado: function() {
        localStorage.setItem('barberhub_estado', JSON.stringify(this.estado));
    },

    verificarAuth: async function() {
        const licencia = localStorage.getItem('barberhub_licencia');
        if (licencia) {
            this.estado.licencia = JSON.parse(licencia);
            
            // Verificar expiración
            if (new Date() > new Date(this.estado.licencia.expiracion)) {
                this.estado.licencia = null;
                localStorage.removeItem('barberhub_licencia');
                return false;
            }
            
            return true;
        }
        return false;
    },

    setUsuario: function(usuario) {
        this.estado.usuario = usuario;
        this.guardarEstado();
    },

    setLicencia: function(licencia) {
        this.estado.licencia = licencia;
        this.guardarEstado();
    },

    logout: function() {
        this.estado.usuario = null;
        this.estado.licencia = null;
        localStorage.removeItem('barberhub_licencia');
        this.guardarEstado();
        router.navegar('/auth');
    },

    cargarFeature: async function(featureName) {
        console.log('🔌 Cargando feature:', featureName);
        
        // Remover CSS de feature anterior
        const featureCss = document.getElementById('feature-css');
        if (featureCss) {
            featureCss.href = `../src/features/${featureName}/${featureName}.css`;
        }
        
        this.estado.featureActivo = featureName;
        
        // Aquí podrías cargar dinámicamente el JS si no está precargado
        // const module = await import(`../src/features/${featureName}/${featureName}.js`);
        // module.init();
    }
};

// Iniciar app cuando DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Exportar para uso global en features
window.app = app;
