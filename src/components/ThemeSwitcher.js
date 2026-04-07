// src/components/ThemeSwitcher.js (versión mejorada)

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
        this.agregarBotonesAlHeader();
    },
    
    agregarBotonesAlHeader: function() {
        // Esperar a que el header esté listo
        const checkHeader = setInterval(() => {
            const headerActions = document.querySelector('.header-actions');
            if (headerActions && !document.querySelector('.theme-buttons-container')) {
                clearInterval(checkHeader);
                this.crearGrupoBotones(headerActions);
            }
        }, 100);
        
        setTimeout(() => clearInterval(checkHeader), 5000);
    },
    
    crearGrupoBotones: function(headerActions) {
        // Crear contenedor de botones de tema
        const container = document.createElement('div');
        container.className = 'theme-buttons-container';
        container.style.cssText = `
            display: flex;
            gap: 8px;
            margin-right: 10px;
        `;
        
        // Crear botones individuales para cada tema
        this.temas.forEach(tema => {
            const btn = document.createElement('button');
            btn.className = `theme-btn ${this.temaActual === tema.id ? 'active' : ''}`;
            btn.setAttribute('data-theme', tema.id);
            btn.title = tema.nombre;
            btn.innerHTML = tema.icono;
            btn.style.cssText = `
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: 2px solid ${this.temaActual === tema.id ? tema.color : 'transparent'};
                background: var(--bg-tertiary);
                cursor: pointer;
                font-size: 1.2rem;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            btn.onmouseenter = () => {
                btn.style.transform = 'scale(1.1)';
                btn.style.borderColor = tema.color;
            };
            btn.onmouseleave = () => {
                btn.style.transform = 'scale(1)';
                if (this.temaActual !== tema.id) {
                    btn.style.borderColor = 'transparent';
                }
            };
            
            btn.onclick = () => {
                this.cambiarTema(tema.id);
                this.actualizarBotonActivo(tema.id);
            };
            
            container.appendChild(btn);
        });
        
        // Agregar contenedor al principio de header-actions
        headerActions.insertBefore(container, headerActions.firstChild);
        
        // Mover los botones existentes si los hay
        const existingConfigBtn = document.querySelector('.btn-icon');
        const existingLogoutBtn = document.querySelector('.btn-logout');
        
        if (existingConfigBtn) {
            headerActions.appendChild(existingConfigBtn);
        }
        if (existingLogoutBtn) {
            headerActions.appendChild(existingLogoutBtn);
        }
        
        console.log('✅ Botones de tema agregados');
    },
    
    actualizarBotonActivo: function(themeId) {
        const tema = this.temas.find(t => t.id === themeId);
        const btns = document.querySelectorAll('.theme-btn');
        
        btns.forEach(btn => {
            if (btn.getAttribute('data-theme') === themeId) {
                btn.style.borderColor = tema.color;
                btn.classList.add('active');
            } else {
                btn.style.borderColor = 'transparent';
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
        
        this.mostrarNotificacion(`${tema.icono} Tema: ${tema.nombre}`, 'success');
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
    
    mostrarNotificacion: function(mensaje, tipo) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${tipo}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>🎨</span>
                <p>${mensaje}</p>
            </div>
        `;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            padding: 12px 20px;
            border-radius: 10px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            box-shadow: var(--shadow-md);
            border-left: 4px solid var(--color-primary);
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
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
