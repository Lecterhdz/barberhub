// src/core/router.js
// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - ROUTER (Completo y Optimizado)
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

    // Control de carga
    cargandoFeature: false,
    ultimoFeature: '',
    featureActual: '',

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
        if (!hash || hash === '') return '/';
        const queryIndex = hash.indexOf('?');
        if (queryIndex !== -1) hash = hash.substring(0, queryIndex);
        return hash;
    },

    // Navegar a una ruta
    navegar: function(ruta, agregarHistorial = true) {
        const rutaActual = this.getCurrentRoute();
        
        // No navegar si es la misma ruta
        if (rutaActual === ruta) {
            console.log('⏳ Misma ruta, ignorando navegación');
            return;
        }
        
        console.log('🚀 Navegando de:', rutaActual, 'a:', ruta);
        
        if (agregarHistorial) {
            window.location.hash = ruta;
        } else {
            window.location.replace(`#${ruta}`);
        }
        this.manejarRuta();
    },

    // Manejar la ruta actual
    manejarRuta: async function() {
        // Evitar cargas simultáneas
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
        
        // No cargar el mismo feature si ya estamos en él
        if (this.featureActual === featureName) {
            console.log('⏳ Ya en el feature:', featureName, '- ignorando recarga');
            return;
        }
        
        console.log('📍 Navegando a:', rutaActual, 'Feature:', featureName);
        
        this.cargandoFeature = true;
        
        try {
            await this.cargarFeature(featureName);
            this.featureActual = featureName;
            this.ultimoFeature = featureName;
            this.actualizarSidebarActivo(rutaActual);
        } catch (error) {
            console.error('Error cargando feature:', error);
            this.mostrarError(featureName, error);
        } finally {
            this.cargandoFeature = false;
        }
    },

    // Cargar feature completo (CSS + HTML + JS)
    cargarFeature: async function(featureName) {
        console.log(`📦 Cargando feature: ${featureName}`);
        
        try {
            await this.cargarCSS(featureName);
            await this.cargarHTML(featureName);
            await this.cargarJS(featureName);
            
            // Disparar evento de que el feature está listo
            window.dispatchEvent(new CustomEvent('feature-loaded', { 
                detail: { feature: featureName } 
            }));
            
            console.log(`✅ Feature ${featureName} cargado correctamente`);
        } catch (error) {
            console.error(`❌ Error cargando feature ${featureName}:`, error);
            throw error;
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
                featureCss.onload = () => {
                    console.log(`✅ CSS ${featureName} cargado`);
                    resolve();
                };
                featureCss.onerror = () => {
                    console.warn(`⚠️ CSS no encontrado: ${cssPath}`);
                    resolve();
                };
            } else {
                resolve();
            }
            
            // Timeout por si tarda demasiado
            setTimeout(resolve, 1000);
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
                
                // Disparar evento de que el HTML está listo
                window.dispatchEvent(new CustomEvent('feature-html-loaded', { 
                    detail: { feature: featureName } 
                }));
                
                console.log(`✅ HTML ${featureName} cargado`);
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
            // Remover script anterior
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
                
                // Intentar llamar a la función init del feature
                setTimeout(() => {
                    const initName = `init${featureName.charAt(0).toUpperCase() + featureName.slice(1)}`;
                    if (window[initName]) {
                        window[initName]();
                    } else if (window.initClientes && featureName === 'clientes') {
                        window.initClientes();
                    } else if (window.initBarberos && featureName === 'barberos') {
                        window.initBarberos();
                    } else if (window.initCitas && featureName === 'citas') {
                        window.initCitas();
                    } else if (window.initServicios && featureName === 'servicios') {
                        window.initServicios();
                    } else if (window.initInventario && featureName === 'inventario') {
                        window.initInventario();
                    } else if (window.initCaja && featureName === 'caja') {
                        window.initCaja();
                    }
                }, 50);
                
                resolve();
            };
            
            script.onerror = () => {
                console.warn(`⚠️ JS no encontrado: ${scriptPath}`);
                resolve();
            };
            
            document.body.appendChild(script);
            
            // Timeout por si tarda demasiado
            setTimeout(resolve, 2000);
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

    // Mostrar error en el contenedor
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

// ✅ Prevenir múltiples listeners - Limpiar listeners existentes
if (window._hashChangeHandler) {
    window.removeEventListener('hashchange', window._hashChangeHandler);
    window.removeEventListener('popstate', window._popStateHandler);
}

// Crear nuevos handlers
window._hashChangeHandler = () => {
    router.manejarRuta();
};

window._popStateHandler = () => {
    router.manejarRuta();
};

// Registrar listeners
window.addEventListener('hashchange', window._hashChangeHandler);
window.addEventListener('popstate', window._popStateHandler);

// Exportar para uso global
window.router = router;

console.log('🔄 Router inicializado');
