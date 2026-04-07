// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - ROUTER (PATHS ABSOLUTOS PARA DYNAMIC IMPORT)
// ─────────────────────────────────────────────────────────────────────

import { routes } from '../config/routes.js';

console.log('🧭 Router cargado');

// ✅ Detectar base path para GitHub Pages
// Si la app está en https://usuario.github.io/repo/, el basePath es /repo
const getBasePath = () => {
    const pathname = window.location.pathname;
    // Para GitHub Pages: /username/repo/ → extraer /repo
    const parts = pathname.split('/').filter(p => p);
    if (parts.length >= 2 && parts[0] === 'barberhub') {
        return '/barberhub';
    }
    return '';
};

const BASE_PATH = getBasePath();

// ✅ Router object
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
        
        // Verificar autenticación usando window.app (evita ciclo de imports)
        if (rutaConfig.requiereAuth && !window.app?.estado?.licencia) {
            this.navegar('/auth');
            return;
        }
        
        if (rutaConfig.feature) {
            await this.cargarFeature(rutaConfig.feature);
        }
        
        await this.renderizarVista(rutaConfig, params);
        this.rutaActual = ruta;
        document.title = `${rutaConfig.titulo} - BarberHub`;
    },

    cargarFeature: async function(featureName) {
        console.log('🔌 Cargando feature:', featureName);
        
        // ✅ CSS: path absoluto desde el dominio root
        const cssPath = `${BASE_PATH}/src/features/${featureName}/${featureName}.css`;
        
        const featureCss = document.getElementById('feature-css');
        if (featureCss) {
            featureCss.href = cssPath;
        }
    },

    renderizarVista: async function(rutaConfig, params) {
        const main = document.getElementById('app-main');
        if (!main) { console.error('❌ No se encontró #app-main'); return; }
        
        try {
            // ✅ CORRECCIÓN CLAVE: Paths absolutos desde el dominio root para dynamic import
            const featurePath = `${BASE_PATH}/src/features/${rutaConfig.feature}`;
            
            // Cargar HTML con fetch (path absoluto)
            const htmlResponse = await fetch(`${featurePath}/${rutaConfig.feature}.html`);
            if (!htmlResponse.ok) throw new Error(`HTML: ${htmlResponse.status} - ${featurePath}/${rutaConfig.feature}.html`);
            const html = await htmlResponse.text();
            main.innerHTML = html;
            
            // ✅ CORRECCIÓN CLAVE: Dynamic import con path absoluto
            // El import() se resuelve desde el dominio root, no desde el archivo JS
            const module = await import(`${featurePath}/${rutaConfig.feature}.js`);
            if (module.init) {
                module.init(params);
            }
            
            console.log('✅ Vista renderizada:', rutaConfig.feature);
        } catch (error) {
            console.error('❌ Error cargando vista:', error);
            main.innerHTML = `
                <div style="text-align:center;padding:50px;">
                    <h2 style="color:#f44336;">❌ Error: ${error.message}</h2>
                    <p>Verifica que los archivos existen en GitHub</p>
                    <button onclick="window.location.hash='#/auth'" 
                            style="margin-top:20px;padding:15px 30px;background:#1a1a1a;color:white;border:none;border-radius:10px;cursor:pointer;">
                        ↩️ Volver a Login
                    </button>
                </div>
            `;
        }
    },

    volver: function() {
        history.back();
    }
};

// ✅ Exportación explícita con alias
export { routerObj as router };
export default routerObj;
