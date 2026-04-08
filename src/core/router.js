// src/core/router.js
// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - ROUTER (Completo y Funcional)
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

    // Detectar base path para GitHub Pages
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

    // Obtener ruta actual del hash
    getCurrentRoute: function() {
        let hash = window.location.hash;
        hash = hash.substring(1);
        
        if (!hash || hash === '') {
            return '/';
        }
        
        const queryIndex = hash.indexOf('?');
        if (queryIndex !== -1) {
            hash = hash.substring(0, queryIndex);
        }
        
        return hash;
    },

    // Navegar a una ruta
    navegar: function(ruta, agregarHistorial = true) {
        if (agregarHistorial) {
            window.location.hash = ruta;
        } else {
            window.location.replace(`#${ruta}`);
        }
        this.manejarRuta();
    },

    // Manejar la ruta actual
    manejarRuta: async function() {
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
        
        console.log('📍 Navegando a:', rutaActual, 'Feature:', featureName);
        
        await this.cargarFeature(featureName);
        this.actualizarSidebarActivo(rutaActual);
    },

    // Cargar feature (CSS + HTML + JS)
    cargarFeature: async function(featureName) {
        try {
            await this.cargarCSS(featureName);
            await this.cargarHTML(featureName);
            await this.cargarJS(featureName);
            
            // Disparar evento de feature cargado
            window.dispatchEvent(new CustomEvent('feature-loaded', { 
                detail: { feature: featureName } 
            }));
            
            console.log(`✅ Feature ${featureName} cargado correctamente`);
        } catch (error) {
            console.error(`❌ Error cargando feature ${featureName}:`, error);
            this.mostrarError(featureName, error);
        }
    },

    // Cargar CSS del feature
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

    // Cargar HTML del feature
    cargarHTML: function(featureName) {
        return new Promise(async (resolve, reject) => {
            const container = document.getElementById('app-main');
            if (!container) {
                reject(new Error('Contenedor app-main no encontrado'));
                return;
            }
            
            const basePath = this.getBasePath();
            const htmlPath = `${basePath}/src/features/${featureName}/${featureName}.html`;
            
            try {
                const response = await fetch(htmlPath);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${htmlPath}`);
                }
                const html = await response.text();
                container.innerHTML = html;
                resolve();
            } catch (error) {
                console.error(`Error cargando HTML: ${htmlPath}`, error);
                container.innerHTML = `
                    <div class="error-container">
                        <div class="error-icon">⚠️</div>
                        <h2>Error al cargar la página</h2>
                        <p>No se pudo cargar ${featureName}</p>
                        <p class="error-details">${error.message}</p>
                        <button class="btn btn-primary" onclick="location.reload()">
                            Recargar página
                        </button>
                    </div>
                `;
                reject(error);
            }
        });
    },

    // Cargar JS del feature
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

    // Actualizar link activo en sidebar
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

    // Mostrar error
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
                    <button class="btn btn-primary" onclick="location.reload()">
                        Recargar
                    </button>
                    <button class="btn btn-secondary" onclick="window.router.navegar('/dashboard')">
                        Ir al Dashboard
                    </button>
                </div>
            </div>
        `;
    }
};

// Escuchar cambios en el hash
window.addEventListener('hashchange', () => {
    router.manejarRuta();
});

// Escuchar popstate para retroceso/avance
window.addEventListener('popstate', () => {
    router.manejarRuta();
});

// Exportar para uso global
window.router = router;
