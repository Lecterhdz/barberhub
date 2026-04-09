// src/components/ThemeSwitcher.js
// ─────────────────────────────────────────────────────────────────────

console.log('🎨 ThemeSwitcher cargado');

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
        this.agregarBoton();
        
        // Escuchar cuando el header cambie
        window.addEventListener('header-ready', () => {
            this.agregarBoton();
        });
    },
    
    agregarBoton: function() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) {
            setTimeout(() => this.agregarBoton(), 100);
            return;
        }
        
        // Evitar duplicados
        if (document.getElementById('theme-dropdown')) return;
        
        const temaActualObj = this.temas.find(t => t.id === this.temaActual);
        
        // Crear dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'theme-dropdown';
        dropdown.id = 'theme-dropdown';
        
        const btn = document.createElement('button');
        btn.className = 'theme-dropdown-btn';
        btn.innerHTML = `
            <span class="theme-dropdown-icon">${temaActualObj.icono}</span>
            <span class="theme-dropdown-label">${temaActualObj.nombre}</span>
            <span class="theme-dropdown-arrow">▼</span>
        `;
        
        const menu = document.createElement('div');
        menu.className = 'theme-dropdown-menu';
        menu.innerHTML = `
            <div class="theme-menu-header">
                <span>🎨</span>
                <span>Seleccionar tema</span>
            </div>
            <div class="theme-menu-options">
                ${this.temas.map(tema => `
                    <button class="theme-option ${this.temaActual === tema.id ? 'active' : ''}" data-theme="${tema.id}">
                        <span class="theme-option-icon">${tema.icono}</span>
                        <div class="theme-option-info">
                            <div class="theme-option-name">${tema.nombre}</div>
                        </div>
                        <div class="theme-option-color" style="background: ${tema.color}"></div>
                        ${this.temaActual === tema.id ? '<span class="theme-option-check">✓</span>' : ''}
                    </button>
                `).join('')}
            </div>
        `;
        
        dropdown.appendChild(btn);
        dropdown.appendChild(menu);
        
        // Insertar al inicio del header-actions
        headerActions.insertBefore(dropdown, headerActions.firstChild);
        
        // Eventos
        btn.onclick = (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('open');
        };
        
        menu.querySelectorAll('.theme-option').forEach(option => {
            option.onclick = (e) => {
                e.stopPropagation();
                const themeId = option.dataset.theme;
                this.cambiarTema(themeId);
                dropdown.classList.remove('open');
                this.actualizarBoton(themeId);
                this.actualizarMenuActivo(themeId);
            };
        });
        
        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
    },
    
    actualizarBoton: function(themeId) {
        const tema = this.temas.find(t => t.id === themeId);
        const btn = document.querySelector('#theme-dropdown .theme-dropdown-btn');
        if (btn && tema) {
            btn.innerHTML = `
                <span class="theme-dropdown-icon">${tema.icono}</span>
                <span class="theme-dropdown-label">${tema.nombre}</span>
                <span class="theme-dropdown-arrow">▼</span>
            `;
        }
    },
    
    actualizarMenuActivo: function(themeId) {
        document.querySelectorAll('.theme-option').forEach(option => {
            if (option.dataset.theme === themeId) {
                option.classList.add('active');
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

// Inicializar automáticamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeSwitcher.init());
} else {
    ThemeSwitcher.init();
}
