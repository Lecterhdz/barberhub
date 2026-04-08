// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - THEME SWITCHER (Menú Desplegable)
// ─────────────────────────────────────────────────────────────────────

export const ThemeSwitcher = {
    temas: [
        { id: 'dark-amber', nombre: 'Ámbar Oscuro', icono: '🌙', color: '#ff6b35', descripcion: 'Clásico y elegante' },
        { id: 'dark-neon', nombre: 'Neón Oscuro', icono: '💚', color: '#00ff88', descripcion: 'Moderno y vibrante' },
        { id: 'light-clean', nombre: 'Claro Limpio', icono: '☀️', color: '#ff9f4a', descripcion: 'Claro y profesional' }
    ],
    
    temaActual: 'dark-amber',
    
    init: function() {
        console.log('🎨 Inicializando ThemeSwitcher...');
        
        // Cargar tema guardado
        const temaGuardado = localStorage.getItem('barberhub_tema');
        if (temaGuardado && this.temas.find(t => t.id === temaGuardado)) {
            this.temaActual = temaGuardado;
        }
        
        this.aplicarTema(this.temaActual);
        this.crearBotonDropdown();
        
        // Escuchar cuando el header esté listo
        window.addEventListener('header-ready', () => {
            this.crearBotonDropdown();
        });
    },
    
    crearBotonDropdown: function() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) {
            setTimeout(() => this.crearBotonDropdown(), 100);
            return;
        }
        
        // Eliminar botón anterior si existe
        const existingBtn = document.getElementById('theme-dropdown');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        const temaActualObj = this.temas.find(t => t.id === this.temaActual);
        
        // Crear el dropdown container
        const dropdown = document.createElement('div');
        dropdown.className = 'theme-dropdown';
        dropdown.id = 'theme-dropdown';
        
        // Crear el botón principal
        const btn = document.createElement('button');
        btn.id = 'theme-dropdown-btn';
        btn.className = 'theme-dropdown-btn';
        btn.innerHTML = `
            <span class="theme-dropdown-icon">${temaActualObj.icono}</span>
            <span class="theme-dropdown-label">${temaActualObj.nombre}</span>
            <span class="theme-dropdown-arrow">▼</span>
        `;
        
        // Crear el menú desplegable
        const menu = document.createElement('div');
        menu.className = 'theme-dropdown-menu';
        menu.innerHTML = `
            <div class="theme-menu-header">
                <span>🎨</span>
                <span>Seleccionar tema</span>
            </div>
            <div class="theme-menu-options">
                ${this.temas.map(tema => `
                    <button class="theme-option ${this.temaActual === tema.id ? 'active' : ''}" 
                            data-theme="${tema.id}">
                        <span class="theme-option-icon">${tema.icono}</span>
                        <div class="theme-option-info">
                            <div class="theme-option-name">${tema.nombre}</div>
                            <div class="theme-option-desc">${tema.descripcion}</div>
                        </div>
                        <div class="theme-option-color" style="background: ${tema.color}"></div>
                        ${this.temaActual === tema.id ? '<span class="theme-option-check">✓</span>' : ''}
                    </button>
                `).join('')}
            </div>
        `;
        
        dropdown.appendChild(btn);
        dropdown.appendChild(menu);
        
        // LIMPIAR header-actions y reconstruir en orden
        // Guardar elementos existentes que queremos preservar
        const licenseBadge = headerActions.querySelector('.license-badge');
        const configBtn = headerActions.querySelector('.btn-icon, .config-btn');
        const logoutBtn = headerActions.querySelector('.btn-logout');
        
        // Limpiar header-actions
        while (headerActions.firstChild) {
            headerActions.removeChild(headerActions.firstChild);
        }
        
        // Reconstruir en el orden correcto
        headerActions.appendChild(dropdown);  // 1. Dropdown de temas
        
        if (licenseBadge) {
            headerActions.appendChild(licenseBadge);  // 2. Badge de licencia
        }
        
        // 3. Botón de configuración
        let configButton = configBtn;
        if (!configButton) {
            configButton = document.createElement('button');
            configButton.className = 'btn-icon config-btn';
            configButton.innerHTML = '⚙️';
            configButton.title = 'Configuración';
            configButton.onclick = () => {
                if (window.app && window.app.openConfiguracion) {
                    window.app.openConfiguracion();
                } else {
                    console.log('Configuración - próximamente');
                }
            };
        }
        headerActions.appendChild(configButton);
        
        // 4. Botón de salir
        let logoutButton = logoutBtn;
        if (!logoutButton) {
            logoutButton = document.createElement('button');
            logoutButton.className = 'btn-logout';
            logoutButton.innerHTML = '🚪 Salir';
            logoutButton.onclick = () => {
                if (window.app && window.app.logout) {
                    window.app.logout();
                }
            };
        }
        headerActions.appendChild(logoutButton);
        
        // Eventos del dropdown
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.classList.contains('open');
            
            document.querySelectorAll('.theme-dropdown.open').forEach(d => {
                if (d !== dropdown) d.classList.remove('open');
            });
            
            dropdown.classList.toggle('open');
        });
        
        menu.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const themeId = option.dataset.theme;
                this.cambiarTema(themeId);
                dropdown.classList.remove('open');
                this.actualizarBoton(themeId);
                this.actualizarMenuActivo(themeId);
            });
        });
        
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
        
        console.log('✅ Dropdown de temas creado con botones de configuración y salir');
    },
    
    actualizarBoton: function(themeId) {
        const tema = this.temas.find(t => t.id === themeId);
        const btn = document.getElementById('theme-dropdown-btn');
        if (btn && tema) {
            btn.innerHTML = `
                <span class="theme-dropdown-icon">${tema.icono}</span>
                <span class="theme-dropdown-label">${tema.nombre}</span>
                <span class="theme-dropdown-arrow">▼</span>
            `;
        }
    },
    
    actualizarMenuActivo: function(themeId) {
        const options = document.querySelectorAll('.theme-option');
        options.forEach(option => {
            if (option.dataset.theme === themeId) {
                option.classList.add('active');
                // Agregar check si no existe
                if (!option.querySelector('.theme-option-check')) {
                    const check = document.createElement('span');
                    check.className = 'theme-option-check';
                    check.textContent = '✓';
                    option.appendChild(check);
                }
            } else {
                option.classList.remove('active');
                const check = option.querySelector('.theme-option-check');
                if (check) check.remove();
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
        
        // Mostrar notificación
        this.mostrarNotificacion(`${tema.icono} Tema cambiado a ${tema.nombre}`);
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
    },
    
    mostrarNotificacion: function(mensaje) {
        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.innerHTML = `
            <div class="theme-notification-content">
                <span>🎨</span>
                <p>${mensaje}</p>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
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
