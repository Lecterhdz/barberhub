// src/core/router.js
// ─────────────────────────────────────────────────────────────────────

export const router = {
    rutas: {
        '/': 'dashboard',
        '/dashboard': 'dashboard',
        '/auth': 'auth',
        '/portal': 'portal',
        '/clientes': 'clientes',
        '/citas': 'citas',
        '/barberos': 'barberos',
        '/servicios': 'servicios',
        '/inventario': 'inventario',
        '/caja': 'caja',
        '/reportes': 'reportes',
        '/configuracion': 'configuracion'
    },

    // ✅ Agregar bandera para evitar cargas duplicadas
    cargandoFeature: false,
    ultimoFeature: '',

    getBasePath: function() {
        const pathname = window.location.pathname;
        if (pathname.includes('/barberhub/')) {
            return '/barberhub';
        }
        const parts = pathname.split('/').filter(p => p);
        if (parts.length > 0 && !parts[0].includes('.')) {
            return `/${parts[0]}`;
        }
        return '';
    },

    getCurrentRoute: function() {
        let hash = window.location.hash;
        hash = hash.substring(1);
        if (!hash || hash === '') return '/';
        const queryIndex = hash.indexOf('?');
        if (queryIndex !== -1) hash = hash.substring(0, queryIndex);
        return hash;
    },

    navegar: function(ruta, agregarHistorial = true) {
        const rutaActual = this.getCurrentRoute();
        // ✅ No navegar si es la misma ruta
        if (rutaActual === ruta) {
            console.log('⏳ Misma ruta, ignorando');
            return;
        }
        if (agregarHistorial) {
            window.location.hash = ruta;
        } else {
            window.location.replace(`#${ruta}`);
        }
        this.manejarRuta();
    },

    manejarRuta: async function() {
        // ✅ Evitar cargas duplicadas
        if (this.cargandoFeature) {
            console.log('⏳ Ya cargando un feature, ignorando...');
            return;
        }
        
        const rutaActual = this.getCurrentRoute();
        let featureName = this.rutas[rutaActual];
        
        if (!featureName) {
            const parts = rutaActual.split('/').filter(p => p);
            if (parts.length > 0) {
                featureName = this.rutas[`/${parts[0]}`];
            }
            if (!featureName) {
                featureName = 'dashboard';
            }
        }
        
        // ✅ No cargar el mismo feature dos veces seguidas
        if (this.ultimoFeature === featureName) {
            console.log('⏳ Mismo feature, ignorando');
            return;
        }
        
        console.log('📍 Navegando a:', rutaActual, 'Feature:', featureName);
        
        this.cargandoFeature = true;
        this.ultimoFeature = featureName;
        
        await this.cargarFeature(featureName);
        
        this.cargandoFeature = false;
        this.actualizarSidebarActivo(rutaActual);
    },

    cargarFeature: async function(featureName) {
        try {
            await this.cargarCSS(featureName);
            await this.cargarHTML(featureName);
            await this.cargarJS(featureName);
            
            window.dispatchEvent(new CustomEvent('feature-loaded', { 
                detail: { feature: featureName } 
            }));
            
            console.log(`✅ Feature ${featureName} cargado correctamente`);
        } catch (error) {
            console.error(`❌ Error cargando feature ${featureName}:`, error);
            this.mostrarError(featureName, error);
            this.cargandoFeature = false;
        }
    },

    cargarCSS: function(featureName) {
        return new Promise((resolve) => {
            const basePath = this.getBasePath();
            const cssPath = `${basePath}/src/features/${featureName}/${featureName}.css`;
            const featureCss = document.getElementById('feature-css');
            
            if (featureCss) {
                featureCss.href = cssPath;
                featureCss.onload = () => resolve();
                featureCss.onerror = () => {
                    console.warn(`⚠️ CSS no encontrado: ${cssPath}`);
                    resolve();
                };
            } else {
                resolve();
            }
            setTimeout(resolve, 500);
        });
    },

    cargarHTML: function(featureName) {
        return new Promise(async (resolve, reject) => {
            const container = document.getElementById('app-main');
            if (!container) return reject('No container');
            
            const basePath = this.getBasePath();
            const htmlPath = `${basePath}/src/features/${featureName}/${featureName}.html`;
            
            try {
                const response = await fetch(htmlPath);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const html = await response.text();
                container.innerHTML = html;
                await new Promise(r => setTimeout(r, 50));
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    },

    cargarJS: function(featureName) {
        return new Promise((resolve) => {
            const oldScript = document.getElementById('feature-script');
            if (oldScript) {
                oldScript.remove();
            }
            
            const basePath = this.getBasePath();
            const scriptPath = `${basePath}/src/features/${featureName}/${featureName}.js`;
            const script = document.createElement('script');
            script.id = 'feature-script';
            script.src = scriptPath;
            script.type = 'module';
            
            script.onload = () => {
                console.log(`✅ JS ${featureName} cargado`);
                resolve();
            };
            script.onerror = () => {
                console.warn(`⚠️ JS no encontrado: ${scriptPath}`);
                resolve();
            };
            
            document.body.appendChild(script);
            setTimeout(resolve, 1000);
        });
    },

    actualizarSidebarActivo: function(rutaActual) {
        const links = document.querySelectorAll('.sidebar-link');
        links.forEach(link => {
            const linkPath = link.getAttribute('data-path');
            if (linkPath === rutaActual) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    mostrarError: function(featureName, error) {
        const container = document.getElementById('app-main');
        if (!container) return;
        
        container.innerHTML = `
            <div class="error-container">
                <div class="error-icon">❌</div>
                <h2>Error de navegación</h2>
                <p>No se pudo cargar ${featureName}</p>
                <p class="error-details">${error.message}</p>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="location.reload()">Recargar</button>
                    <button class="btn btn-secondary" onclick="window.router.navegar('/dashboard')">Ir al Dashboard</button>
                </div>
            </div>
        `;
    }
};

// ✅ Prevenir múltiples listeners
let hashChangeHandler = null;
let popStateHandler = null;

if (!hashChangeHandler) {
    hashChangeHandler = () => {
        router.manejarRuta();
    };
    window.addEventListener('hashchange', hashChangeHandler);
}

if (!popStateHandler) {
    popStateHandler = () => {
        router.manejarRuta();
    };
    window.addEventListener('popstate', popStateHandler);
}

window.router = router;
