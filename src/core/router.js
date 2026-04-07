// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - ROUTER
// ─────────────────────────────────────────────────────────────────────

import { routes } from '../config/routes.js';
import { app } from './app.js';

console.log('🧭 Router cargado');

// ✅ Definir el objeto router
const routerObj = {
    rutaActual: null,

    navegar: function(ruta, params = {}) {
        console.log('🧭 Navegando a:', ruta);
        window.location.hash = `#${ruta}`;
        this.manejarRuta(ruta, params);
    },

    manejarRuta: async function(rutaForzada = null, params = {}) {
        const hash = window.location.hash.replace('#', '');
        const urlParams = new URLSearchParams(window.location.search);
        const ruta = rutaForzada || hash || urlParams.get('route') || '/dashboard';
        
        const rutaConfig = routes[ruta];
        
        if (!rutaConfig) {
            console.error('❌ Ruta no encontrada:', ruta);
            this.navegar('/404');
            return;
        }
        
        if (rutaConfig.requiereAuth && !app.estado.licencia) {
            this.navegar('/auth');
            return;
        }
        
        if (rutaConfig.feature) {
            await app.cargarFeature(rutaConfig.feature);
        }
        
        await this.renderizarVista(rutaConfig, params);
        this.rutaActual = ruta;
        document.title = `${rutaConfig.titulo} - BarberHub`;
    },

    renderizarVista: async function(rutaConfig, params) {
        const main = document.getElementById('app-main');
        if (!main) { console.error('❌ No se encontró #app-main'); return; }
        
        try {
            const featurePath = `./src/features/${rutaConfig.feature}`;
            
            const htmlResponse = await fetch(`${featurePath}/${rutaConfig.feature}.html`);
            if (!htmlResponse.ok) throw new Error(`HTML: ${htmlResponse.status}`);
            const html = await htmlResponse.text();
            main.innerHTML = html;
            
            const module = await import(`${featurePath}/${rutaConfig.feature}.js`);
            if (module.init) module.init(params);
            
            console.log('✅ Vista renderizada:', rutaConfig.feature);
        } catch (error) {
            console.error('❌ Error cargando vista:', error);
            main.innerHTML = `<div style="text-align:center;padding:50px;"><h2 style="color:#f44336;">❌ Error: ${error.message}</h2><button onclick="window.location.hash='#/auth'" style="margin-top:20px;padding:15px 30px;background:#1a1a1a;color:white;border:none;border-radius:10px;cursor:pointer;">↩️ Volver a Login</button></div>`;
        }
    },

    volver: function() { history.back(); }
};

// ✅ EXPORTACIÓN CLARA AL FINAL
export { routerObj as router };
