// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - ROUTER (HASH-BASED PARA GITHUB PAGES)
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

    // Obtener la ruta actual desde el hash
    getCurrentRoute: function() {
        let hash = window.location.hash;
        // Remover el # inicial
        hash = hash.substring(1);
        
        // Si está vacío, usar /
        if (!hash || hash === '') {
            return '/';
        }
        
        // Remover query params si existen
        const queryIndex = hash.indexOf('?');
        if (queryIndex !== -1) {
            hash = hash.substring(0, queryIndex);
        }
        
        return hash;
    },

    navegar: function(ruta, agregarHistorial = true) {
        // Usar hash para la navegación
        const nuevaUrl = `#${ruta}`;
        
        if (agregarHistorial) {
            window.location.hash = ruta;
        } else {
            window.location.replace(nuevaUrl);
        }
        
        // Forzar manejo de ruta
        this.manejarRuta();
    },

    manejarRuta: async function() {
        let rutaActual = this.getCurrentRoute();
        
        // Obtener feature name
        let featureName = this.rutas[rutaActual];
        if (!featureName) {
            featureName = 'dashboard';
        }
        
        console.log('📍 Navegando a:', rutaActual, 'Feature:', featureName);
        
        // Cargar CSS y HTML del feature
        await this.cargarFeatureCSS(featureName);
        await this.renderizarVista(featureName);
        
        // Actualizar estado del app
        if (window.app && window.app.cargarFeature) {
            window.app.cargarFeature(featureName);
        }
        
        // Actualizar sidebar activo
        this.actualizarSidebarActivo(rutaActual);
    },

    actualizarSidebarActivo: function(rutaActual) {
        // Remover clase active de todos los items del sidebar
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.classList.remove('active');
            const linkPath = link.getAttribute('href');
            if (linkPath === rutaActual) {
                link.classList.add('active');
            }
        });
    },

    cargarFeatureCSS: async function(featureName) {
        const cssPath = `./src/features/${featureName}/${featureName}.css`;
        console.log('🎨 Cargando CSS:', cssPath);
        
        const featureCss = document.getElementById('feature-css');
        if (featureCss) {
            featureCss.href = cssPath;
        }
        
        return new Promise(resolve => setTimeout(resolve, 50));
    },

    renderizarVista: async function(featureName) {
        const container = document.getElementById('app-main');
        
        if (!container) {
            console.error('❌ Contenedor app-main no encontrado');
            return;
        }
        
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
                resolve();
            };
            
            document.body.appendChild(script);
        });
    }
};

// Escuchar cambios en el hash
window.addEventListener('hashchange', () => {
    router.manejarRuta();
});
