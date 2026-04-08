export const ThemeSwitcher = {
    temas: [
        { id: 'dark-amber', nombre: 'Ámbar', icono: '🌙', color: '#ff6b35' },
        { id: 'dark-neon', nombre: 'Neón', icono: '💚', color: '#00ff88' },
        { id: 'light-clean', nombre: 'Claro', icono: '☀️', color: '#ff9f4a' }
    ],
    
    temaActual: 'dark-amber',
    
    init: function() {
        console.log('🎨 Inicializando ThemeSwitcher...');
        
        const temaGuardado = localStorage.getItem('barberhub_tema');
        if (temaGuardado) {
            this.temaActual = temaGuardado;
        }
        
        this.aplicarTema(this.temaActual);
        
        // Esperar a que el header esté listo
        this.agregarBotonesAlHeader();
        
        // Escuchar evento de header ready
        window.addEventListener('header-ready', () => {
            this.agregarBotonesAlHeader();
        });
    },
    
    agregarBotonesAlHeader: function() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) {
            setTimeout(() => this.agregarBotonesAlHeader(), 100);
            return;
        }
        
        // Limpiar botones anteriores si existen
        const existingContainer = document.querySelector('.theme-buttons-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        // Crear contenedor de botones de tema
        const container = document.createElement('div');
        container.className = 'theme-buttons-container';
        
        // Crear botones de tema
        this.temas.forEach(tema => {
            const btn = document.createElement('button');
            btn.className = `theme-btn ${this.temaActual === tema.id ? 'active' : ''}`;
            btn.setAttribute('data-theme', tema.id);
            btn.title = tema.nombre;
            btn.innerHTML = tema.icono;
            btn.onclick = () => {
                this.cambiarTema(tema.id);
                this.actualizarBotonActivo(tema.id);
            };
            container.appendChild(btn);
        });
        
        // Buscar y preservar los botones existentes
        const licenseBadge = headerActions.querySelector('.license-badge');
        const existingButtons = [];
        
        // Guardar botones existentes que no sean del theme
        headerActions.querySelectorAll('.btn-icon, .btn-logout, .config-btn').forEach(btn => {
            existingButtons.push(btn);
        });
        
        // Limpiar header-actions pero mantener la licencia
        while (headerActions.firstChild) {
            headerActions.removeChild(headerActions.firstChild);
        }
        
        // Agregar en orden correcto: Theme buttons -> License -> Config -> Logout
        headerActions.appendChild(container);
        
        if (licenseBadge) {
            headerActions.appendChild(licenseBadge);
        }
        
        // Agregar botón de configuración si no existe
        let configBtn = document.querySelector('.config-btn');
        if (!configBtn) {
            configBtn = document.createElement('button');
            configBtn.className = 'btn-icon config-btn';
            configBtn.innerHTML = '⚙️';
            configBtn.title = 'Configuración';
            configBtn.onclick = () => {
                if (window.app && window.app.openConfiguracion) {
                    window.app.openConfiguracion();
                }
            };
        }
        headerActions.appendChild(configBtn);
        
        // Agregar botón de logout
        let logoutBtn = document.querySelector('.btn-logout');
        if (!logoutBtn) {
            logoutBtn = document.createElement('button');
            logoutBtn.className = 'btn-logout';
            logoutBtn.innerHTML = '🚪 Salir';
            logoutBtn.onclick = () => {
                if (window.app && window.app.logout) {
                    window.app.logout();
                }
            };
        }
        headerActions.appendChild(logoutBtn);
        
        console.log('✅ Botones de tema agregados correctamente');
    },
    
    actualizarBotonActivo: function(themeId) {
        const btns = document.querySelectorAll('.theme-btn');
        btns.forEach(btn => {
            if (btn.getAttribute('data-theme') === themeId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },
    
    cambiarTema: function(themeId) {
        const tema = this.temas.find(t => t.id === themeId);
        if (!tema) return;
        
        this.temaActual = themeId;
        this.aplicarTema(themeId);
        
        localStorage.setItem('barberhub_tema', themeId);
        
        if (window.app && window.app.estado) {
            window.app.estado.tema = themeId;
            if (window.app.guardarEstado) window.app.guardarEstado();
        }
        
        console.log(`🎨 Tema cambiado a: ${tema.nombre}`);
    },
    
    aplicarTema: function(themeId) {
        document.body.setAttribute('data-theme', themeId);
        document.documentElement.setAttribute('data-theme', themeId);
        
        let themeLink = document.getElementById('theme-css');
        if (!themeLink) {
            themeLink = document.createElement('link');
            themeLink.id = 'theme-css';
            themeLink.rel = 'stylesheet';
            document.head.appendChild(themeLink);
        }
        
        themeLink.href = `./src/core/themes/${themeId}.css`;
    }
};

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ThemeSwitcher.init();
    });
} else {
    ThemeSwitcher.init();
}
