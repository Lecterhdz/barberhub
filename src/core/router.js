// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - ROUTER (CORREGIDO PARA GITHUB PAGES)
// ─────────────────────────────────────────────────────────────────────

import { routes } from '../config/routes.js';
import { app } from './app.js';

console.log('🧭 Router cargado');

// Obtener base path dinámicamente
const getBasePath = () => {
    const path = window.location.pathname;
    // Si estamos en github.io/username/repo/, extraer /username/repo/
    if (path.includes('/barberhub/')) {
        return '/barberhub/';
    }
    return '/';
};

export const router = {
    rutaActual: null,

    navegar: function(ruta, params = {}) {
        console.log('🧭 Navegando a:', ruta);
        // Usar hash para evitar problemas con GitHub Pages
        window.location.hash = `#${ruta}`;
        this.manejarRuta(ruta, params);
    },

    manejarRuta: async function(rutaForzada = null, params = {}) {
        // Obtener ruta del hash o parámetro
        const hash = window.location.hash.replace('#', '');
        const urlParams = new URLSearchParams(window.location.search);
        const ruta = rutaForzada || hash || urlParams.get('route') || '/dashboard';
        
        const rutaConfig = routes[ruta];
        
        if (!rutaConfig) {
            console.error('❌ Ruta no encontrada:', ruta);
            this.navegar('/404');
            return;
        }
        
        // Verificar autenticación
        if (rutaConfig.requiereAuth && !app.estado.licencia) {
            this.navegar('/auth');
            return;
        }
        
        // Cargar feature
        if (rutaConfig.feature) {
            await app.cargarFeature(rutaConfig.feature);
        }
        
        // Renderizar vista
        await this.renderizarVista(rutaConfig, params);
        
        this.rutaActual = ruta;
        document.title = `${rutaConfig.titulo} - BarberHub`;
    },

    renderizarVista: async function(rutaConfig, params) {
        const main = document.getElementById('app-main');
        
        if (!main) {
            console.error('❌ No se encontró #app-main');
            return;
        }
        
        try {
            // ✅ CORRECCIÓN: Usar ruta relativa desde la raíz del repo
            const featurePath = `./src/features/${rutaConfig.feature}`;
            
            // Cargar HTML
            const response = await fetch(`${featurePath}/${rutaConfig.feature}.html`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();
            main.innerHTML = html;
            
            // Cargar e inicializar JS del feature
            const module = await import(`./src/features/${rutaConfig.feature}/${rutaConfig.feature}.js`);
            if (module.init) {
                module.init(params);
            }
            
            console.log('✅ Vista renderizada:', rutaConfig.feature);
        } catch (error) {
            console.error('❌ Error cargando vista:', error);
            main.innerHTML = `
                <div style="text-align:center;padding:50px;">
                    <h2 style="color:#f44336;">❌ Error cargando la vista</h2>
                    <p>${error.message}</p>
                    <button onclick="window.location.hash='#/dashboard'" 
                            style="margin-top:20px;padding:15px 30px;background:#1a1a1a;color:white;border:none;border-radius:10px;cursor:pointer;">
                        ↩️ Volver al Dashboard
                    </button>
                </div>
            `;
        }
    },

    volver: function() {
        history.back();
    }
};

window.router = router;
