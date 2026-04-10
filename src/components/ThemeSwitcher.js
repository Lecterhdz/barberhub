// src/components/ThemeSwitcher.js
console.log('🎨 ThemeSwitcher cargado');

export const ThemeSwitcher = {
    temas: [
        { id: 'dark-amber', nombre: 'Ámbar', icono: '🌙' },
        { id: 'dark-neon', nombre: 'Neón', icono: '💚' },
        { id: 'light-clean', nombre: 'Claro', icono: '☀️' }
    ],
    
    temaActual: 'dark-amber',
    
    getBasePath() {
        return window.location.pathname.includes('/barberhub/') ? '/barberhub' : '';
    },
    
    init() {
        console.log('🎨 ThemeSwitcher init');
        
        const temaGuardado = localStorage.getItem('barberhub_tema');
        if (temaGuardado) this.temaActual = temaGuardado;
        
        this.aplicarTema(this.temaActual);
        this.esperarHeaderYAgregarBoton();
        
        window.addEventListener('header-ready', () => {
            this.agregarBoton();
        });
    },
    
    esperarHeaderYAgregarBoton() {
        let intentos = 0;
        const maxIntentos = 20;
        
        const check = setInterval(() => {
            intentos++;
            const headerActions = document.querySelector('.header-actions');
            
            if (headerActions) {
                clearInterval(check);
                this.agregarBoton();
                console.log('✅ Header encontrado, botón agregado');
            } else if (intentos >= maxIntentos) {
                clearInterval(check);
                console.log('⚠️ No se encontró header-actions');
            }
        }, 200);
    },
    
    agregarBoton() {
        // Buscar en desktop primero, luego en móvil
        let headerActions = document.querySelector('.header-actions');
        let desktopContainer = document.getElementById('theme-dropdown-desktop');
        let movilContainer = document.getElementById('theme-dropdown-container');
        
        if (document.getElementById('theme-dropdown')) return;
        
        const temaActualObj = this.temas.find(t => t.id === this.temaActual);
        const basePath = this.getBasePath();
        
        const dropdown = document.createElement('div');
        dropdown.id = 'theme-dropdown';
        dropdown.style.cssText = 'position: relative; display: inline-block;';
        
        dropdown.innerHTML = `
            <button id="theme-btn" style="display: flex; align-items: center; gap: 4px; padding: 5px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; color: var(--text-primary); font-size: 0.75rem;">
                <span>${temaActualObj.icono}</span>
                <span>${temaActualObj.nombre}</span>
                <span>▼</span>
            </button>
            <div id="theme-menu" style="position: absolute; top: 100%; right: 0; margin-top: 5px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; min-width: 120px; display: none; z-index: 1000;">
                ${this.temas.map(tema => `
                    <button data-theme="${tema.id}" style="display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 12px; background: none; border: none; cursor: pointer; color: var(--text-primary); font-size: 0.75rem;">
                        <span>${tema.icono}</span>
                        <span>${tema.nombre}</span>
                    </button>
                `).join('')}
            </div>
        `;
        
        // Insertar en el contenedor correspondiente
        if (desktopContainer) {
            desktopContainer.appendChild(dropdown);
            console.log('✅ Botón de tema agregado en desktop');
        } else if (movilContainer) {
            movilContainer.appendChild(dropdown);
            console.log('✅ Botón de tema agregado en móvil');
        } else if (headerActions) {
            headerActions.appendChild(dropdown);
            console.log('✅ Botón de tema agregado en header-actions');
        } else {
            console.log('⚠️ No se encontró contenedor para el botón de temas');
            return;
        }
        
        const btn = document.getElementById('theme-btn');
        const menu = document.getElementById('theme-menu');
        
        btn.onclick = (e) => {
            e.stopPropagation();
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        };
        
        document.querySelectorAll('#theme-menu button').forEach(opt => {
            opt.onclick = () => {
                const theme = opt.dataset.theme;
                this.cambiarTema(theme);
                menu.style.display = 'none';
                const temaObj = this.temas.find(t => t.id === theme);
                btn.innerHTML = `<span>${temaObj.icono}</span><span>${temaObj.nombre}</span><span>▼</span>`;
            };
        });
        
        document.addEventListener('click', () => {
            menu.style.display = 'none';
        });
    },
    
    cambiarTema(themeId) {
        const tema = this.temas.find(t => t.id === themeId);
        if (!tema) return;
        
        this.temaActual = themeId;
        this.aplicarTema(themeId);
        localStorage.setItem('barberhub_tema', themeId);
        
        if (window.app && window.app.estado) {
            window.app.estado.tema = themeId;
        }
        
        console.log(`🎨 Tema cambiado a: ${tema.nombre}`);
    },
    
    aplicarTema(themeId) {
        document.body.setAttribute('data-theme', themeId);
        document.documentElement.setAttribute('data-theme', themeId);
        
        let themeLink = document.getElementById('theme-css');
        if (!themeLink) {
            themeLink = document.createElement('link');
            themeLink.id = 'theme-css';
            themeLink.rel = 'stylesheet';
            document.head.appendChild(themeLink);
        }
        
        const basePath = this.getBasePath();
        themeLink.href = `${basePath}/src/themes/${themeId}.css`;
        console.log('Cargando tema:', themeLink.href);
    }
};

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeSwitcher.init());
} else {
    ThemeSwitcher.init();
}
