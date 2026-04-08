// src/core/router.js
// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - ROUTER (Navegación Unificada Portal + Admin)
// ─────────────────────────────────────────────────────────────────────

console.log('🔄 Router v2.0');

export const router = {
    // ============================================
    // RUTAS UNIFICADAS
    // ============================================
    
    rutas: {
        // Portal (público - sin autenticación)
        '/portal/agendar': { view: 'portal/agendar', title: 'Agendar Cita', publica: true },
        '/portal/mis-citas': { view: 'portal/mis-citas', title: 'Mis Citas', publica: true },
        '/portal/info': { view: 'portal/info', title: 'Información', publica: true },
        
        // Admin (privado - requiere autenticación)
        '/admin/dashboard': { view: 'admin/dashboard', title: 'Dashboard', publica: false },
        '/admin/clientes': { view: 'admin/clientes', title: 'Clientes', publica: false },
        '/admin/barberos': { view: 'admin/barberos', title: 'Barberos', publica: false },
        '/admin/citas': { view: 'admin/citas', title: 'Citas', publica: false },
        '/admin/servicios': { view: 'admin/servicios', title: 'Servicios', publica: false },
        '/admin/inventario': { view: 'admin/inventario', title: 'Inventario', publica: false },
        '/admin/caja': { view: 'admin/caja', title: 'Caja', publica: false },
        '/admin/reportes': { view: 'admin/reportes', title: 'Reportes', publica: false },
        '/admin/configuracion': { view: 'admin/configuracion', title: 'Configuración', publica: false },
        
        // Redirecciones (backward compatibility)
        '/': '/portal/agendar',
        '/dashboard': '/admin/dashboard',
        '/clientes': '/admin/clientes',
        '/citas': '/admin/citas',
        '/barberos': '/admin/barberos',
        '/servicios': '/admin/servicios',
        '/inventario': '/admin/inventario',
        '/caja': '/admin/caja',
        '/reportes': '/admin/reportes',
        '/configuracion': '/admin/configuracion',
        '/portal': '/portal/agendar',
        '/auth': '/portal/agendar'
    },
    
    // Control de navegación
    navegando: false,
    rutaActual: '/portal/agendar',
    
    // ============================================
    // DETECCIÓN DE BASE PATH
    // ============================================
    
    getBasePath() {
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
    
    // ============================================
    // OBTENER RUTA ACTUAL
    // ============================================
    
    getCurrentRoute() {
        let hash = window.location.hash;
        hash = hash.substring(1);
        
        if (!hash || hash === '') {
            return '/portal/agendar';
        }
        
        // Limpiar query params
        const queryIndex = hash.indexOf('?');
        if (queryIndex !== -1) {
            hash = hash.substring(0, queryIndex);
        }
        
        // Redirecciones
        if (this.rutas[hash] && typeof this.rutas[hash] === 'string') {
            return this.rutas[hash];
        }
        
        return hash;
    },
    
    // ============================================
    // VERIFICAR ACCESO
    // ============================================
    
    tieneAcceso(ruta) {
        const routeConfig = this.rutas[ruta];
        if (!routeConfig || typeof routeConfig === 'string') {
            // Si es una redirección, resolver la ruta real
            const resolved = this.resolverRuta(ruta);
            return this.tieneAcceso(resolved);
        }
        
        // Si es pública, siempre acceso
        if (routeConfig.publica) return true;
        
        // Si es privada, requiere autenticación
        return window.app?.estado?.autenticado === true;
    },
    
    resolverRuta(ruta) {
        const resolved = this.rutas[ruta];
        if (typeof resolved === 'string') {
            return this.resolverRuta(resolved);
        }
        return ruta;
    },
    
    // ============================================
    // NAVEGACIÓN
    // ============================================
    
    navegar(ruta, agregarHistorial = true) {
        // Normalizar ruta
        let rutaDestino = ruta;
        
        // Verificar si es una redirección
        if (this.rutas[ruta] && typeof this.rutas[ruta] === 'string') {
            rutaDestino = this.rutas[ruta];
        }
        
        // Verificar si es la misma ruta
        if (this.rutaActual === rutaDestino && agregarHistorial) {
            console.log('⏳ Misma ruta, ignorando');
            return;
        }
        
        // Verificar acceso
        if (!this.tieneAcceso(rutaDestino)) {
            console.log('🔒 Acceso denegado, redirigiendo a portal');
            rutaDestino = '/portal/agendar';
        }
        
        console.log('🚀 Navegando a:', rutaDestino);
        
        // Actualizar UI del sidebar si es admin
        if (rutaDestino.startsWith('/admin/') && window.app) {
            window.app.estado.vista = 'admin';
            window.app.estado.modulo = rutaDestino.split('/')[2];
            window.app.renderizarSidebar();
        } else if (window.app) {
            window.app.estado.vista = 'portal';
            window.app.estado.modulo = rutaDestino.split('/')[2];
        }
        
        // Actualizar hash
        if (agregarHistorial) {
            window.location.hash = rutaDestino;
        } else {
            window.location.replace(`#${rutaDestino}`);
        }
        
        this.manejarRuta();
    },
    
    // ============================================
    // MANEJAR RUTA (CARGA DE VISTAS)
    // ============================================
    
    async manejarRuta() {
        if (this.navegando) {
            console.log('⏳ Ya navegando, ignorando...');
            return;
        }
        
        let ruta = this.getCurrentRoute();
        
        // Resolver redirecciones
        ruta = this.resolverRuta(ruta);
        
        // Verificar acceso
        if (!this.tieneAcceso(ruta)) {
            console.log('🔒 Sin acceso a', ruta);
            ruta = '/portal/agendar';
            window.location.hash = ruta;
        }
        
        const routeConfig = this.rutas[ruta];
        if (!routeConfig) {
            console.error('Ruta no encontrada:', ruta);
            this.mostrarError404();
            return;
        }
        
        this.rutaActual = ruta;
        this.navegando = true;
        
        // Actualizar título de la página
        document.title = `BarberHub - ${routeConfig.title}`;
        
        try {
            await this.cargarVista(routeConfig.view);
        } catch (error) {
            console.error('Error cargando vista:', error);
            this.mostrarError(error);
        } finally {
            this.navegando = false;
        }
    },
    
    // ============================================
    // CARGA DE VISTAS
    // ============================================
    
    async cargarVista(viewPath) {
        console.log(`📄 Cargando vista: ${viewPath}`);
        
        const container = document.getElementById('app-main');
        if (!container) {
            throw new Error('Contenedor app-main no encontrado');
        }
        
        // Mostrar loader
        this.mostrarLoader(container);
        
        // Cargar HTML
        const html = await this.cargarHTML(viewPath);
        if (html) {
            container.innerHTML = html;
        }
        
        // Cargar CSS
        await this.cargarCSS(viewPath);
        
        // Cargar y ejecutar JS
        await this.cargarJS(viewPath);
        
        // Ocultar loader
        this.ocultarLoader(container);
        
        // Disparar evento de vista cargada
        window.dispatchEvent(new CustomEvent('view-loaded', {
            detail: { view: viewPath, ruta: this.rutaActual }
        }));
        
        console.log(`✅ Vista ${viewPath} cargada`);
    },
    
    async cargarHTML(viewPath) {
        const basePath = this.getBasePath();
        const htmlPath = `${basePath}/src/views/${viewPath}.html`;
        
        try {
            const response = await fetch(htmlPath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            console.error(`Error cargando HTML: ${htmlPath}`, error);
            return `<div class="error-container">
                        <h2>⚠️ Error</h2>
                        <p>No se pudo cargar la vista: ${viewPath}</p>
                        <button onclick="location.reload()">Recargar</button>
                    </div>`;
        }
    },
    
    async cargarCSS(viewPath) {
        const basePath = this.getBasePath();
        const cssPath = `${basePath}/src/views/${viewPath}.css`;
        
        return new Promise((resolve) => {
            const linkId = `css-${viewPath.replace(/\//g, '-')}`;
            let link = document.getElementById(linkId);
            
            if (link) {
                link.remove();
            }
            
            link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            link.href = cssPath;
            link.onload = () => resolve();
            link.onerror = () => {
                console.warn(`⚠️ CSS no encontrado: ${cssPath}`);
                resolve();
            };
            document.head.appendChild(link);
            
            setTimeout(resolve, 500);
        });
    },
    
    async cargarJS(viewPath) {
        const basePath = this.getBasePath();
        const jsPath = `${basePath}/src/views/${viewPath}.js`;
        
        return new Promise((resolve) => {
            const scriptId = `js-${viewPath.replace(/\//g, '-')}`;
            let script = document.getElementById(scriptId);
            
            if (script) {
                script.remove();
            }
            
            script = document.createElement('script');
            script.id = scriptId;
            script.src = jsPath;
            script.type = 'module';
            
            script.onload = () => {
                console.log(`✅ JS cargado: ${viewPath}`);
                resolve();
            };
            script.onerror = () => {
                console.warn(`⚠️ JS no encontrado: ${jsPath}`);
                resolve();
            };
            
            document.body.appendChild(script);
            setTimeout(resolve, 1000);
        });
    },
    
    // ============================================
    // LOADER
    // ============================================
    
    mostrarLoader(container) {
        const loader = document.createElement('div');
        loader.id = 'view-loader';
        loader.className = 'view-loader';
        loader.innerHTML = `
            <div class="loader-spinner"></div>
            <p>Cargando...</p>
        `;
        container.appendChild(loader);
    },
    
    ocultarLoader(container) {
        const loader = document.getElementById('view-loader');
        if (loader) loader.remove();
    },
    
    // ============================================
    // ERRORES
    // ============================================
    
    mostrarError404() {
        const container = document.getElementById('app-main');
        if (!container) return;
        
        container.innerHTML = `
            <div class="error-container">
                <div class="error-icon">🔍</div>
                <h2>Página no encontrada</h2>
                <p>La ruta que buscas no existe</p>
                <button class="btn btn-primary" onclick="window.router.navegar('/portal/agendar')">
                    Ir al inicio
                </button>
            </div>
        `;
    },
    
    mostrarError(error) {
        const container = document.getElementById('app-main');
        if (!container) return;
        
        container.innerHTML = `
            <div class="error-container">
                <div class="error-icon">❌</div>
                <h2>Error al cargar</h2>
                <p>${error.message || 'Error desconocido'}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    Recargar
                </button>
            </div>
        `;
    }
};

// ============================================
// EVENTOS GLOBALES
// ============================================

// Limpiar listeners anteriores
if (window._hashChangeHandler) {
    window.removeEventListener('hashchange', window._hashChangeHandler);
    window.removeEventListener('popstate', window._popStateHandler);
}

// Crear nuevos handlers
window._hashChangeHandler = () => router.manejarRuta();
window._popStateHandler = () => router.manejarRuta();

// Registrar listeners
window.addEventListener('hashchange', window._hashChangeHandler);
window.addEventListener('popstate', window._popStateHandler);

// Exportar
window.router = router;

console.log('🔄 Router v2.0 inicializado');
