// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - THEME SWITCHER COMPONENT
// ─────────────────────────────────────────────────────────────────────

export const ThemeSwitcher = {
    temas: [
        { id: 'dark-amber', nombre: 'Ámbar Oscuro', icono: '🌙', color: '#ff6b35' },
        { id: 'dark-neon', nombre: 'Neón Oscuro', icono: '💚', color: '#00ff88' },
        { id: 'light-clean', nombre: 'Claro Limpio', icono: '☀️', color: '#ff6b35' }
    ],
    
    temaActual: 'dark-amber',
    
    init: function() {
        // Cargar tema guardado
        const temaGuardado = localStorage.getItem('barberhub_tema');
        if (temaGuardado && this.temas.find(t => t.id === temaGuardado)) {
            this.temaActual = temaGuardado;
        }
        
        this.aplicarTema(this.temaActual);
        this.renderizarBoton();
    },
    
    renderizarBoton: function() {
        // Verificar si ya existe el botón
        if (document.getElementById('theme-switcher-btn')) return;
        
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions) return;
        
        const temaActualObj = this.temas.find(t => t.id === this.temaActual);
        
        const btn = document.createElement('button');
        btn.id = 'theme-switcher-btn';
        btn.className = 'btn-icon theme-switcher-btn';
        btn.title = 'Cambiar tema';
        btn.innerHTML = `
            <span class="theme-icon">${temaActualObj?.icono || '🎨'}</span>
            <span class="theme-name">${temaActualObj?.nombre || 'Tema'}</span>
            <span class="theme-arrow">▼</span>
        `;
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.mostrarMenu();
        });
        
        headerActions.insertBefore(btn, headerActions.firstChild);
    },
    
    mostrarMenu: function() {
        // Remover menú existente
        const menuExistente = document.getElementById('theme-menu');
        if (menuExistente) {
            menuExistente.remove();
            return;
        }
        
        const menu = document.createElement('div');
        menu.id = 'theme-menu';
        menu.className = 'theme-menu';
        
        menu.innerHTML = `
            <div class="theme-menu-header">
                <span>🎨</span>
                <h4>Seleccionar tema</h4>
            </div>
            <div class="theme-menu-options">
                ${this.temas.map(tema => `
                    <button class="theme-option ${this.temaActual === tema.id ? 'active' : ''}" 
                            data-theme="${tema.id}">
                        <span class="theme-option-icon">${tema.icono}</span>
                        <div class="theme-option-info">
                            <span class="theme-option-name">${tema.nombre}</span>
                            <span class="theme-option-color" style="background: ${tema.color}"></span>
                        </div>
                        ${this.temaActual === tema.id ? '<span class="theme-check">✓</span>' : ''}
                    </button>
                `).join('')}
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Posicionar el menú
        const btn = document.getElementById('theme-switcher-btn');
        const rect = btn.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 5}px`;
        menu.style.right = `${window.innerWidth - rect.right}px`;
        
        // Eventos de los botones
        menu.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const themeId = option.dataset.theme;
                this.cambiarTema(themeId);
                menu.remove();
            });
        });
        
        // Cerrar al hacer clic fuera
        const cerrarMenu = (e) => {
            if (!menu.contains(e.target) && e.target !== btn) {
                menu.remove();
                document.removeEventListener('click', cerrarMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', cerrarMenu);
        }, 100);
    },
    
    cambiarTema: function(themeId) {
        const tema = this.temas.find(t => t.id === themeId);
        if (!tema) return;
        
        this.temaActual = themeId;
        this.aplicarTema(themeId);
        
        // Guardar en localStorage
        localStorage.setItem('barberhub_tema', themeId);
        
        // Actualizar botón
        const btn = document.getElementById('theme-switcher-btn');
        if (btn) {
            btn.innerHTML = `
                <span class="theme-icon">${tema.icono}</span>
                <span class="theme-name">${tema.nombre}</span>
                <span class="theme-arrow">▼</span>
            `;
        }
        
        // Notificar cambio
        if (window.app && window.app.estado) {
            window.app.estado.tema = themeId;
            window.app.guardarEstado();
        }
        
        // Mostrar notificación
        this.mostrarNotificacion(`Tema cambiado a ${tema.nombre}`, 'success');
    },
    
    aplicarTema: function(themeId) {
        // Actualizar data-theme en el body
        document.body.setAttribute('data-theme', themeId);
        document.documentElement.setAttribute('data-theme', themeId);
        
        // Actualizar el link del tema CSS
        let themeLink = document.getElementById('theme-css');
        if (!themeLink) {
            themeLink = document.createElement('link');
            themeLink.id = 'theme-css';
            themeLink.rel = 'stylesheet';
            document.head.appendChild(themeLink);
        }
        
        themeLink.href = `./src/core/themes/${themeId}.css`;
        
        console.log(`🎨 Tema cambiado a: ${themeId}`);
    },
    
    mostrarNotificacion: function(mensaje, tipo) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${tipo}`;
        notification.innerHTML = `
            <div class="notification-content">
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

// Inicializar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ThemeSwitcher.init();
    });
} else {
    ThemeSwitcher.init();
}

// Exportar para uso global
window.ThemeSwitcher = ThemeSwitcher;
