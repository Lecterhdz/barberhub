// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - ROUTER (CORREGIDO)
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

    // Determinar base path para GitHub Pages
    getBasePath: function() {
        // Detecta si está en subdirectorio o en root
        const pathname = window.location.pathname;
        if (pathname.includes('/barberhub/')) {
            return '/barberhub';
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
        
        // Obtener feature name
        let featureName = this.rutas[rutaActual];
        if (!featureName) {
            featureName = 'dashboard';
        }
        
        console.log('📍 Navegando a:', rutaActual, 'Feature:', featureName);
        
        // Cargar CSS y HTML del feature
        await this.cargarFeature(featureName);
        await this.renderizarVista(featureName);
        
        // Actualizar estado del app
        if (window.app && window.app.cargarFeature) {
            window.app.cargarFeature(featureName);
        }
    },

    cargarFeature: async function(featureName) {
        const basePath = this.getBasePath();
        
        // ✅ CORRECCIÓN: Usar paths correctos para GitHub Pages
        const cssPath = `${basePath}/src/features/${featureName}/${featureName}.css`;
        
        console.log('🎨 Cargando CSS:', cssPath);
        
        // Cargar CSS del feature
        let featureCss = document.getElementById('feature-css');
        if (!featureCss) {
            featureCss = document.createElement('link');
            featureCss.id = 'feature-css';
            featureCss.rel = 'stylesheet';
            document.head.appendChild(featureCss);
        }
        
        featureCss.href = cssPath;
        
        // Esperar un poco para que cargue el CSS
        return new Promise(resolve => setTimeout(resolve, 100));
    },

    renderizarVista: async function(featureName) {
        const basePath = this.getBasePath();
        const container = document.getElementById('app-view');
        
        if (!container) {
            console.error('❌ Contenedor app-view no encontrado');
            return;
        }
        
        // ✅ CORRECCIÓN: Path correcto para HTML
        const htmlPath = `${basePath}/src/features/${featureName}/${featureName}.html`;
        
        console.log('📄 Cargando HTML:', htmlPath);
        
        try {
            const response = await fetch(htmlPath);
            
            if (!response.ok) {
                throw new Error(`HTML: ${response.status} - ${htmlPath}`);
            }
            
            const html = await response.text();
            container.innerHTML = html;
            
            // Cargar el JS del feature después de insertar el HTML
            await this.cargarJavaScript(featureName);
            
            console.log(`✅ Vista ${featureName} cargada correctamente`);
            
        } catch (error) {
            console.error('❌ Error cargando vista:', error);
            container.innerHTML = `
                <div class="error-container">
                    <h2>⚠️ Error al cargar la página</h2>
                    <p>No se pudo cargar ${featureName}</p>
                    <p class="error-details">${error.message}</p>
                    <button onclick="location.reload()">Recargar</button>
                </div>
            `;
        }
    },

    cargarJavaScript: async function(featureName) {
        const basePath = this.getBasePath();
        
        // Remover script anterior si existe
        const oldScript = document.getElementById('feature-script');
        if (oldScript) {
            oldScript.remove();
        }
        
        // Crear nuevo script
        const scriptPath = `${basePath}/src/features/${featureName}/${featureName}.js`;
        console.log('📦 Cargando JS:', scriptPath);
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.id = 'feature-script';
            script.src = scriptPath;
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
