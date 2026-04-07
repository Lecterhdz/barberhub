// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - ROUTER (NAVEGACIÓN ENTRE VISTAS)
// ─────────────────────────────────────────────────────────────────────

import { routes } from '../config/routes.js';
import { app } from './app.js';

console.log('🧭 Router cargado');

export const router = {
    rutaActual: null,

    navegar: function(ruta, params = {}) {
        console.log('🧭 Navegando a:', ruta);
        
        // Actualizar URL sin recargar
        history.pushState({ ruta, params }, '', `?route=${ruta}`);
        
        // Manejar la ruta
        this.manejarRuta(ruta, params);
    },

    manejarRuta: function(rutaForzada = null, params = {}) {
        // Obtener ruta de URL o parámetro
        const urlParams = new URLSearchParams(window.location.search);
        const ruta = rutaForzada || urlParams.get('route') || '/dashboard';
        
        // Verificar si la ruta existe
        const rutaConfig = routes[ruta];
        
        if (!rutaConfig) {
            console.error('❌ Ruta no encontrada:', ruta);
            this.navegar('/404');
            return;
        }
        
        // Verificar permisos
        if (rutaConfig.requiereAuth && !app.estado.licencia) {
            this.navegar('/auth');
            return;
        }
        
        // Cargar feature
        if (rutaConfig.feature) {
            app.cargarFeature(rutaConfig.feature);
        }
        
        // Renderizar vista
        this.renderizarVista(rutaConfig, params);
        
        this.rutaActual = ruta;
    },

    renderizarVista: async function(rutaConfig, params) {
        const main = document.getElementById('app-main');
        
        if (!main) {
            console.error('❌ No se encontró #app-main');
            return;
        }
        
        // Cargar HTML de la feature
        try {
            const response = await fetch(`../src/features/${rutaConfig.feature}/${rutaConfig.feature}.html`);
            const html = await response.text();
            main.innerHTML = html;
            
            // Inicializar feature si tiene init
            const featureModule = await import(`../src/features/${rutaConfig.feature}/${rutaConfig.feature}.js`);
            if (featureModule.init) {
                featureModule.init(params);
            }
            
            console.log('✅ Vista renderizada:', rutaConfig.feature);
        } catch (error) {
            console.error('❌ Error cargando vista:', error);
            main.innerHTML = '<div class="error">Error cargando la vista</div>';
        }
    },

    volver: function() {
        history.back();
    }
};

// Exportar para uso global
window.router = router;
