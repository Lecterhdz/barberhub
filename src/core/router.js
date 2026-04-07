// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - ROUTER (CORREGIDO PARA TU ESTRUCTURA)
// ─────────────────────────────────────────────────────────────────────

export const router = {
    rutas: {
        '/': 'dashboard',
        '/dashboard': 'dashboard',
        '/auth': 'auth',
        '/clientes': 'clientes',
        '/cortes': 'cortes',
        '/inventario': 'inventario',
        '/caja': 'caja',
        '/reportes': 'reportes',
        '/configuracion': 'configuracion'
    },

    // Detectar si estamos en GitHub Pages
    getBasePath: function() {
        // GitHub Pages sirve desde /barberhub/ o desde root?
        const pathname = window.location.pathname;
        
        // Si el path contiene /barberhub/ o similar
        if (pathname.includes('/barberhub/')) {
            return '/barberhub';
        }
        
        // Si estamos en una subcarpeta (ej: /nombre-repo/)
        const parts = pathname.split('/').filter(p => p);
        if (parts.length > 0 && !parts[0].includes('.')) {
            // Podría ser un repo name
            return `/${parts[0]}`;
        }
        
        return '';
    },

    navegar: function(ruta, agregarHistorial = true) {
        const basePath = this.getBasePath();
        const nuevaUrl = basePath + ruta;
        
        if (agregarHistorial) {
            window.history.pushState({}, '', nuevaUrl);
        }
        
        this.manejarRuta();
    },

    manejarRuta: async function() {
        const basePath = this.getBasePath();
        let rutaActual = window.location.pathname;
        
        // Remover base path si existe
        if (basePath && rutaActual.startsWith(basePath)) {
            rutaActual = rutaActual.slice(basePath.length) || '/';
        }
        
        // Si está vacío o es solo slash
        if (!rutaActual || rutaActual === '') {
            rutaActual = '/';
        }
        
        // Obtener feature name
        let featureName = this.rutas[rutaActual];
        if (!featureName) {
            // Intentar con la última parte de la ruta
            const parts = rutaActual.split('/').filter(p => p);
            if (parts.length > 0) {
                featureName = this.rutas[`/${parts[0]}`];
            }
            if (!featureName) {
                featureName = 'dashboard';
            }
        }
        
        console.log('📍 Navegando a:', rutaActual, 'Feature:', featureName);
        
        // Cargar CSS y HTML del feature
        await this.cargarFeatureCSS(featureName);
        await this.renderizarVista(featureName);
        
        // Actualizar estado del app
        if (window.app && window.app.cargarFeature) {
            window.app.cargarFeature(featureName);
        }
    },

    cargarFeatureCSS: async function(featureName) {
        // Usar rutas relativas como en tu index.html
        const cssPath = `./src/features/${featureName}/${featureName}.css`;
        
        console.log('🎨 Cargando CSS:', cssPath);
        
        const featureCss = document.getElementById('feature-css');
        if (featureCss) {
            featureCss.href = cssPath;
        }
        
        return new Promise(resolve => setTimeout(resolve, 50));
    },

    renderizarVista: async function(featureName) {
        // ✅ CORRECCIÓN: Usar 'app-main' como en tu HTML
        const container = document.getElementById('app-main');
        
        if (!container) {
            console.error('❌ Contenedor app-main no encontrado');
            return;
        }
        
        // Usar ruta relativa
        const htmlPath = `./src/features/${featureName}/${featureName}.html`;
        
        console.log('📄 Cargando HTML:', htmlPath);
        
        try {
            const response = await fetch(htmlPath);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${htmlPath}`);
            }
            
            const html = await response.text();
            container.innerHTML = html;
            
            // Cargar el JS del feature
            await this.cargarJavaScript(featureName);
            
            // Disparar evento de carga
            window.dispatchEvent(new CustomEvent('feature-loaded', { 
                detail: { feature: featureName } 
            }));
            
            console.log(`✅ Vista ${featureName} cargada correctamente`);
            
        } catch (error) {
            console.error('❌ Error cargando vista:', error);
            container.innerHTML = `
                <div class="error-container" style="padding: 40px; text-align: center;">
                    <h2>⚠️ Error al cargar la página</h2>
                    <p>No se pudo cargar ${featureName}</p>
                    <p style="color: #888; font-size: 12px;">${error.message}</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px;">
                        Recargar
                    </button>
                </div>
            `;
        }
    },

    cargarJavaScript: async function(featureName) {
        // Remover script anterior si existe
        const oldScript = document.getElementById('feature-script');
        if (oldScript) {
            oldScript.remove();
        }
        
        // Ruta relativa
        const scriptPath = `./src/features/${featureName}/${featureName}.js`;
        console.log('📦 Cargando JS:', scriptPath);
        
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.id = 'feature-script';
            script.src = scriptPath;
            script.type = 'module';
            
            script.onload = () => {
                console.log(`✅ JS ${featureName} cargado`);
                resolve();
            };
            
            script.onerror = () => {
                console.warn(`⚠️ No se encontró JS para ${featureName}`);
                resolve(); // Resolvemos igual aunque no haya JS
            };
            
            document.body.appendChild(script);
        });
    }
};
