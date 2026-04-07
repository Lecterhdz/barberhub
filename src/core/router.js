// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - ROUTER (Hash-based para GitHub Pages)
// ─────────────────────────────────────────────────────────────────────

export const router = {
    rutas: {
        '/': 'dashboard',
        '/dashboard': 'dashboard',
        '/auth': 'auth',
        '/clientes': 'clientes',
        '/citas': 'citas',
        '/cortes': 'servicios',
        '/servicios': 'servicios',
        '/inventario': 'inventario',
        '/caja': 'caja',
        '/reportes': 'reportes',
        '/configuracion': 'configuracion',
        '/config': 'configuracion'
    },
    
    // Obtener ruta actual del hash
    getCurrentRoute: function() {
        let hash = window.location.hash;
        hash = hash.substring(1); // Remover #
        
        if (!hash || hash === '') {
            return '/';
        }
        
        // Remover query params
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
            // Intentar con la primera parte de la ruta
            const parts = rutaActual.split('/').filter(p => p);
            if (parts.length > 0) {
                featureName = this.rutas[`/${parts[0]}`];
            }
            if (!featureName) {
                featureName = 'dashboard';
            }
        }
        
        console.log('📍 Navegando a:', rutaActual, 'Feature:', featureName);
        
        // Cargar el feature
        await this.cargarFeature(featureName);
        
        // Actualizar sidebar activo
        this.actualizarSidebarActivo(rutaActual);
    },
    
    // Cargar feature (CSS + HTML + JS)
    cargarFeature: async function(featureName) {
        try {
            // Cargar CSS
            await this.cargarCSS(featureName);
            
            // Cargar HTML
            await this.cargarHTML(featureName);
            
            // Cargar JS
            await this.cargarJS(featureName);
            
            // Notificar que el feature está listo
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
            const cssPath = `./src/features/${featureName}/${featureName}.css`;
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
            
            const htmlPath = `./src/features/${featureName}/${featureName}.html`;
            
            try {
                const response = await fetch(htmlPath);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
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
            // Remover script anterior
            const oldScript = document.getElementById('feature-script');
            if (oldScript) {
                oldScript.remove();
            }
            
            const scriptPath = `./src/features/${featureName}/${featureName}.js`;
            const script = document.createElement('script');
            script.id = 'feature-script';
            script.src = scriptPath;
            script.type = 'module';
            
            script.onload = () => resolve();
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
