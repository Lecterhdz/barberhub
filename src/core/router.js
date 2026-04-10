// src/core/router.js
console.log('🔄 Router cargado');

export const router = {
    rutas: {
        '/portal/agendar': 'portal/agendar',
        '/portal/mis-citas': 'portal/mis-citas',
        '/admin/dashboard': 'admin/dashboard',
        '/admin/clientes': 'admin/clientes',
        '/admin/barberos': 'admin/barberos',
        '/admin/citas': 'admin/citas',
        '/admin/servicios': 'admin/servicios',
        '/admin/inventario': 'admin/inventario',
        '/admin/caja': 'admin/caja',
        '/admin/reportes': 'admin/reportes'
    },
    
    getBasePath() {
        // Detectar si estamos en GitHub Pages
        const pathname = window.location.pathname;
        if (pathname.includes('/barberhub/')) {
            return '/barberhub';
        }
        return '';
    },
    
    async cargarVista() {
        let ruta = window.location.hash.substring(1);
        if (!ruta) ruta = '/portal/agendar';
        
        console.log('📍 Cargando ruta:', ruta);
        
        const viewPath = this.rutas[ruta];
        if (!viewPath) {
            console.log('❌ Ruta no encontrada:', ruta);
            return;
        }
        
        const container = document.getElementById('app-main');
        if (!container) return;
        
        container.innerHTML = '<div style="text-align: center; padding: 40px;">Cargando...</div>';
        
        try {
            const basePath = this.getBasePath();
            const url = `${basePath}/src/views/${viewPath}.html`;
            console.log('Fetching:', url);
            
            const res = await fetch(url);
            
            if (res.ok) {
                let html = await res.text();
                container.innerHTML = html;
                
                // Ejecutar scripts
                const scripts = container.querySelectorAll('script');
                scripts.forEach(oldScript => {
                    try {
                        const newScript = document.createElement('script');
                        if (oldScript.src) {
                            newScript.src = oldScript.src;
                        } else {
                            newScript.textContent = oldScript.textContent;
                        }
                        oldScript.parentNode.replaceChild(newScript, oldScript);
                    } catch(e) {
                        console.warn('Error ejecutando script:', e);
                    }
                });
                
                console.log('✅ Vista cargada:', viewPath);
            } else {
                container.innerHTML = `<div style="padding: 20px;"><h2>Error ${res.status}</h2><p>No se pudo cargar la vista: ${viewPath}</p></div>`;
            }
        } catch (error) {
            console.error('❌ Error cargando vista:', error);
            container.innerHTML = `<div style="padding: 20px;"><h2>Error</h2><p>${error.message}</p></div>`;
        }
    },
    
    navegar(ruta) {
        if (window.location.hash.substring(1) === ruta) return;
        window.location.hash = ruta;
        this.cargarVista();
    }
};

window.router = router;

// Inicializar
window.addEventListener('load', () => router.cargarVista());
window.addEventListener('hashchange', () => router.cargarVista());
