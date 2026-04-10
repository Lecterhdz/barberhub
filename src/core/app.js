// src/core/app.js
import { storage } from './storage.js';

console.log('🏗️ app.js cargado');

// ============================================
// LICENCIAS VÁLIDAS
// ============================================
const LICENCIAS_VALIDAS = {
    'BARBERHUB-DEMO-2026': { tipo: 'DEMO', dias: 7, max_citas: 50 },
    'BARBERHUB-BASICO-2026': { tipo: 'BASICO', dias: 365, max_citas: null },
    'BARBERHUB-PRO-2026': { tipo: 'PRO', dias: 365, max_citas: null },
    'BARBERHUB-SALON-2026': { tipo: 'SALON', dias: 365, max_citas: null }
};

export const app = {
    estado: {
        autenticado: false,
        licencia: null,
        vista: 'portal',
        cache: {
            barberos: [],
            servicios: [],
            clientes: [],
            citas: [],
            productos: [],
            ventas: [],
            cargado: false
        }
    },

    async init() {
        console.log('🚀 Inicializando App...');

        await storage.init();

        if (!this.estado.cache.cargado) {
            await this.cargarDatos();
            this.estado.cache.cargado = true;
        }

        await this.verificarAutenticacion();

        if (this.estado.autenticado) {
            await this.cargarDatosPrivados();
        }

        this.renderizarHeader();
        //this.inicializarThemeSwitcher();  // ✅ Agregar esta línea
        this.renderizarSidebar();

        const rutaInicial = window.location.hash.substring(1) || 
            (this.estado.autenticado ? '/admin/dashboard' : '/portal/agendar');
        
        if (window.router) {
            await window.router.cargarVista();
        }

        console.log('✅ App lista. Autenticado:', this.estado.autenticado);
    },

    async cargarDatos() {
        console.log('📦 Cargando datos...');

        let barberos = await storage.obtenerTodos('barberos');
        if (barberos.length === 0) {
            barberos = [
                { id: 1, nombre: 'Carlos Martínez', especialidad: 'Corte', telefono: '555-0101', estado: 'activo', comision: 40 },
                { id: 2, nombre: 'Miguel Rodríguez', especialidad: 'Barba', telefono: '555-0102', estado: 'activo', comision: 45 },
                { id: 3, nombre: 'Juan Pérez', especialidad: 'Todo', telefono: '555-0103', estado: 'activo', comision: 50 },
                { id: 4, nombre: 'Roberto Gómez', especialidad: 'Color', telefono: '555-0104', estado: 'activo', comision: 35 }
            ];
            for (const b of barberos) await storage.guardar('barberos', b);
        }
        this.estado.cache.barberos = barberos;

        let servicios = await storage.obtenerTodos('servicios');
        if (servicios.length === 0) {
            servicios = [
                { id: 1, nombre: 'Corte de Cabello', categoria: 'Corte', precio: 350, duracion: 30, estado: 'activo' },
                { id: 2, nombre: 'Barba', categoria: 'Barba', precio: 200, duracion: 20, estado: 'activo' },
                { id: 3, nombre: 'Corte + Barba', categoria: 'Paquete', precio: 500, duracion: 50, estado: 'activo' },
                { id: 4, nombre: 'Coloración', categoria: 'Color', precio: 800, duracion: 90, estado: 'activo' },
                { id: 5, nombre: 'Tratamiento Capilar', categoria: 'Tratamiento', precio: 400, duracion: 45, estado: 'activo' }
            ];
            for (const s of servicios) await storage.guardar('servicios', s);
        }
        this.estado.cache.servicios = servicios;

        console.log(`📦 ${barberos.length} barberos, ${servicios.length} servicios`);
    },

    async cargarDatosPrivados() {
        this.estado.cache.clientes = await storage.obtenerTodos('clientes') || [];
        this.estado.cache.citas = await storage.obtenerTodos('citas') || [];
        this.estado.cache.productos = await storage.obtenerTodos('productos') || [];
        this.estado.cache.ventas = await storage.obtenerTodos('ventas') || [];
        console.log('📦 Datos privados cargados');
    },

    async verificarAutenticacion() {
        const licenciaGuardada = localStorage.getItem('barberhub_licencia');
        if (licenciaGuardada) {
            try {
                const licencia = JSON.parse(licenciaGuardada);
                if (licencia.expiracion) {
                    const fechaExpiracion = new Date(licencia.expiracion);
                    if (fechaExpiracion > new Date()) {
                        this.estado.autenticado = true;
                        this.estado.licencia = licencia;
                        this.estado.vista = 'admin';
                        console.log('🔐 Sesión activa:', licencia.tipo);
                        return true;
                    } else {
                        localStorage.removeItem('barberhub_licencia');
                        console.log('⚠️ Licencia expirada');
                    }
                }
            } catch(e) {
                console.error('Error parseando licencia:', e);
            }
        }
        this.estado.autenticado = false;
        this.estado.vista = 'portal';
        return false;
    },
    
    // Reemplaza login con esto:
    async login(licenciaKey) {
        const key = licenciaKey.toUpperCase().trim();
        const licenciaInfo = LICENCIAS_VALIDAS[key];
        
        if (!licenciaInfo) {
            this.mostrarNotificacion('❌ Licencia inválida', 'error');
            return false;
        }
        
        const expiracion = new Date();
        expiracion.setDate(expiracion.getDate() + licenciaInfo.dias);
        
        const licencia = {
            key: key,
            tipo: licenciaInfo.tipo,
            expiracion: expiracion.toISOString(),
            max_citas: licenciaInfo.max_citas
        };
        
        localStorage.setItem('barberhub_licencia', JSON.stringify(licencia));
        
        this.estado.autenticado = true;
        this.estado.licencia = licencia;
        this.estado.vista = 'admin';
        
        await this.cargarDatosPrivados();
        
        this.renderizarHeader();
        this.renderizarSidebar();
        
        this.mostrarNotificacion(`✅ Bienvenido ${licencia.tipo}`, 'success');
        
        if (window.router) {
            window.router.cargarVista();
        }
        
        return true;
    },
    
    // Reemplaza logout con esto:
    logout() {
        if (confirm('¿Cerrar sesión?')) {
            localStorage.removeItem('barberhub_licencia');
            
            this.estado.autenticado = false;
            this.estado.licencia = null;
            this.estado.vista = 'portal';
            
            this.renderizarHeader();
            this.renderizarSidebar();
            
            if (window.router) {
                window.location.hash = '/portal/agendar';
                window.router.cargarVista();
            }

            
            this.mostrarNotificacion('Sesión cerrada', 'info');
        }
    },

    mostrarModalLogin() {
        const existingModal = document.getElementById('login-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'login-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); backdrop-filter: blur(5px);
            display: flex; justify-content: center; align-items: center;
            z-index: 2000;
        `;
        
        modal.innerHTML = `
            <div style="background: var(--bg-secondary); border-radius: 20px; padding: 30px; width: 90%; max-width: 400px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 3rem;">🔐</div>
                    <h2 style="color: var(--color-primary);">Iniciar Sesión</h2>
                    <p style="color: var(--text-secondary);">Ingresa tu clave de licencia</p>
                </div>
                <input type="text" id="licencia-input" placeholder="BARBERHUB-XXXX-XXXX" 
                       style="width: 100%; padding: 12px; margin-bottom: 20px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-primary); text-align: center; font-family: monospace;">
                <div style="margin-bottom: 20px;">
                    <details>
                        <summary style="color: var(--text-secondary); cursor: pointer; font-size: 0.8rem;">Claves de prueba</summary>
                        <div style="margin-top: 10px; font-size: 0.7rem; color: var(--text-secondary);">
                            <div>BARBERHUB-DEMO-2026 (7 días)</div>
                            <div>BARBERHUB-BASICO-2026 (365 días)</div>
                            <div>BARBERHUB-PRO-2026 (365 días)</div>
                            <div>BARBERHUB-SALON-2026 (365 días)</div>
                        </div>
                    </details>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button id="login-cancelar" style="flex: 1; padding: 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 10px; cursor: pointer;">Cancelar</button>
                    <button id="login-confirmar" style="flex: 1; padding: 12px; background: var(--color-primary); border: none; border-radius: 10px; color: white; cursor: pointer;">Ingresar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('login-cancelar')?.addEventListener('click', () => modal.remove());
        document.getElementById('login-confirmar')?.addEventListener('click', async () => {
            const licencia = document.getElementById('licencia-input').value;
            if (licencia) {
                await this.login(licencia);
                modal.remove();
            } else {
                alert('Ingresa una licencia');
            }
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    },

    toggleSidebar() {
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
    },

    renderizarHeader() {
        const header = document.getElementById('app-header');
        if (!header) return;
        
        const autenticado = this.estado.autenticado;
        const licencia = this.estado.licencia;
        const rutaActual = window.location.hash.substring(1);
        
        const isAgendar = rutaActual === '/portal/agendar' || rutaActual === '';
        const isMisCitas = rutaActual === '/portal/mis-citas';
        
        // Versión móvil: botones compactos
        const botonesMovil = !autenticado ? `
            <div class="botones-movil" style="display: flex; gap: 5px; align-items: center; flex-wrap: wrap; justify-content: center;">
                <a href="#/portal/agendar" class="nav-btn-movil" style="padding: 5px 10px; background: ${isAgendar ? 'var(--color-primary)' : 'var(--bg-tertiary)'}; border-radius: 8px; color: var(--text-primary); text-decoration: none; font-size: 0.7rem;">
                    📅 Agendar
                </a>
                <a href="#/portal/mis-citas" class="nav-btn-movil" style="padding: 5px 10px; background: ${isMisCitas ? 'var(--color-primary)' : 'var(--bg-tertiary)'}; border-radius: 8px; color: var(--text-primary); text-decoration: none; font-size: 0.7rem;">
                    📋 Mis Citas
                </a>
                <div id="theme-dropdown-container" style="display: inline-block;"></div>
                <button id="btn-login-movil" style="padding: 5px 10px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); font-size: 0.7rem;">🔐</button>
            </div>
        ` : `
            <div class="botones-movil" style="display: flex; gap: 5px; align-items: center; flex-wrap: wrap; justify-content: center;">
                <div class="license-badge" style="padding: 5px 10px; font-size: 0.7rem; background: rgba(76,175,80,0.2); border-radius: 20px;">✅ ${licencia.tipo}</div>
                <div id="theme-dropdown-container" style="display: inline-block;"></div>
                <button id="btn-logout-movil" style="padding: 5px 10px; background: rgba(244,67,54,0.1); border: none; border-radius: 8px; color: #f44336; font-size: 0.7rem;">🚪</button>
            </div>
        `;
        
        header.innerHTML = `
            <div class="header-content" style="display: flex; flex-direction: column; padding: 8px 12px; gap: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button id="hamburger-btn" style="display: none; background: none; border: none; font-size: 1.3rem; cursor: pointer; color: var(--text-primary);">☰</button>
                        <h1 class="header-title" style="font-size: 1rem; cursor: pointer; margin: 0;" onclick="window.location.hash='/portal/agendar'">💈 BarberHub</h1>
                    </div>
                    ${!autenticado ? `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div id="theme-dropdown-desktop" style="display: inline-block;"></div>
                            <button id="btn-login-desktop" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); padding: 5px 12px; border-radius: 8px; color: var(--text-primary); font-size: 0.7rem;">🔐 Admin</button>
                        </div>
                    ` : `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div class="license-badge" style="padding: 4px 8px; font-size: 0.7rem; background: rgba(76,175,80,0.2); border-radius: 20px;">✅ ${licencia.tipo}</div>
                            <button id="btn-logout-desktop" style="background: rgba(244,67,54,0.1); border: none; padding: 5px 12px; border-radius: 8px; color: #f44336; font-size: 0.7rem;">🚪</button>
                        </div>
                    `}
                </div>
                ${!autenticado ? `<div class="botones-movil-container" style="display: flex; justify-content: center; margin-top: 5px;">${botonesMovil}</div>` : ''}
            </div>
        `;
        
        // Mover ThemeSwitcher al contenedor correspondiente
        const themeDropdownDesktop = document.getElementById('theme-dropdown-desktop');
        const themeDropdownMovil = document.getElementById('theme-dropdown-container');
        const existingDropdown = document.querySelector('#theme-dropdown');
        
        if (existingDropdown) {
            if (window.innerWidth <= 768 && themeDropdownMovil) {
                themeDropdownMovil.appendChild(existingDropdown);
            } else if (themeDropdownDesktop) {
                themeDropdownDesktop.appendChild(existingDropdown);
            }
        }
        
        // Eventos
        document.getElementById('btn-login-desktop')?.addEventListener('click', () => this.mostrarModalLogin());
        document.getElementById('btn-login-movil')?.addEventListener('click', () => this.mostrarModalLogin());
        document.getElementById('btn-logout-desktop')?.addEventListener('click', () => this.logout());
        document.getElementById('btn-logout-movil')?.addEventListener('click', () => this.logout());
        
        // Escuchar cambios de tamaño para mover el dropdown
        window.addEventListener('resize', () => {
            const dropdown = document.querySelector('#theme-dropdown');
            if (dropdown) {
                if (window.innerWidth <= 768 && themeDropdownMovil && !themeDropdownMovil.contains(dropdown)) {
                    themeDropdownMovil.appendChild(dropdown);
                } else if (window.innerWidth > 768 && themeDropdownDesktop && !themeDropdownDesktop.contains(dropdown)) {
                    themeDropdownDesktop.appendChild(dropdown);
                }
            }
        });
        
        const hamburger = document.getElementById('hamburger-btn');
        if (hamburger) {
            hamburger.onclick = () => this.toggleSidebar();
        }
        
        window.dispatchEvent(new CustomEvent('header-ready'));
    },    


    renderizarSidebar() {
        const sidebar = document.getElementById('app-sidebar');
        if (!sidebar) return;
        
        if (!this.estado.autenticado) {
            sidebar.style.display = 'none';
            return;
        }
        
        sidebar.style.display = 'block';
        
        const menuItems = [
            { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
            { path: '/admin/clientes', icon: '👥', label: 'Clientes' },
            { path: '/admin/barberos', icon: '✂️', label: 'Barberos' },
            { path: '/admin/citas', icon: '📅', label: 'Citas' },
            { path: '/admin/servicios', icon: '💈', label: 'Servicios' },
            { path: '/admin/inventario', icon: '📦', label: 'Inventario' },
            { path: '/admin/caja', icon: '💰', label: 'Caja' },
            { path: '/admin/reportes', icon: '📈', label: 'Reportes' }
        ];
        
        sidebar.innerHTML = `
            <div class="sidebar-container" style="padding: 20px 0;">
                <div class="sidebar-header" style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid var(--border-color); margin-bottom: 10px;">
                    <h3 style="margin: 0;">💈 BarberHub</h3>
                    <p style="font-size: 0.7rem; color: var(--text-secondary); margin: 5px 0 0;">Panel Admin</p>
                </div>
                <nav class="sidebar-nav" style="display: flex; flex-direction: column; gap: 5px; padding: 10px;">
                    ${menuItems.map(item => `
                        <a href="#" class="sidebar-link" data-path="${item.path}" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; color: var(--text-primary); text-decoration: none; border-radius: 10px; transition: all 0.2s;">
                            <span style="font-size: 1.2rem;">${item.icon}</span>
                            <span>${item.label}</span>
                        </a>
                    `).join('')}
                </nav>
            </div>
        `;
        
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const path = link.getAttribute('data-path');
                if (window.router) {
                    window.router.navegar(path);
                }
                if (window.innerWidth <= 768) {
                    this.toggleSidebar();
                }
            });
        });
        
        const currentPath = window.location.hash.substring(1);
        document.querySelectorAll('.sidebar-link').forEach(link => {
            const linkPath = link.getAttribute('data-path');
            if (linkPath === currentPath) {
                link.style.background = 'var(--color-primary)';
                link.style.color = 'white';
            }
        });
    },
    inicializarThemeSwitcher() {
        // Esperar a que el header esté listo
        const checkInterval = setInterval(() => {
            const headerActions = document.querySelector('.header-actions');
            if (headerActions && !document.querySelector('.theme-dropdown')) {
                clearInterval(checkInterval);
                this.crearThemeDropdown(headerActions);
            }
        }, 100);
        
        setTimeout(() => clearInterval(checkInterval), 5000);
    },

    crearThemeDropdown(headerActions) {
        const temas = [
            { id: 'dark-amber', nombre: 'Ámbar', icono: '🌙', color: '#ff6b35' },
            { id: 'dark-neon', nombre: 'Neón', icono: '💚', color: '#00ff88' },
            { id: 'light-clean', nombre: 'Claro', icono: '☀️', color: '#ff9f4a' }
        ];
        
        const temaActual = localStorage.getItem('barberhub_tema') || 'dark-amber';
        const temaObj = temas.find(t => t.id === temaActual);
        
        const dropdown = document.createElement('div');
        dropdown.className = 'theme-dropdown';
        dropdown.style.cssText = 'position: relative; margin-right: 10px;';
        
        dropdown.innerHTML = `
            <button class="theme-dropdown-btn" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 10px; cursor: pointer; color: var(--text-primary);">
                <span>${temaObj.icono}</span>
                <span>${temaObj.nombre}</span>
                <span>▼</span>
            </button>
            <div class="theme-dropdown-menu" style="position: absolute; top: 100%; right: 0; margin-top: 5px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 10px; min-width: 150px; display: none; z-index: 1000;">
                ${temas.map(tema => `
                    <button class="theme-option" data-theme="${tema.id}" style="display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 15px; background: none; border: none; cursor: pointer; color: var(--text-primary);">
                        <span>${tema.icono}</span>
                        <span>${tema.nombre}</span>
                    </button>
                `).join('')}
            </div>
        `;
        
        headerActions.insertBefore(dropdown, headerActions.firstChild);
        
        const btn = dropdown.querySelector('.theme-dropdown-btn');
        const menu = dropdown.querySelector('.theme-dropdown-menu');
        
        btn.onclick = (e) => {
            e.stopPropagation();
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        };
        
        dropdown.querySelectorAll('.theme-option').forEach(opt => {
            opt.onclick = () => {
                const theme = opt.dataset.theme;
                this.cambiarTema(theme);
                menu.style.display = 'none';
                const nuevoTema = temas.find(t => t.id === theme);
                btn.innerHTML = `<span>${nuevoTema.icono}</span><span>${nuevoTema.nombre}</span><span>▼</span>`;
            };
        });
        
        document.addEventListener('click', () => {
            menu.style.display = 'none';
        });
        
        console.log('✅ Theme dropdown creado');
    },

    
    cambiarTema(tema) {
        localStorage.setItem('barberhub_tema', tema);
        document.body.setAttribute('data-theme', tema);
        document.documentElement.setAttribute('data-theme', tema);
        
        // Actualizar CSS link
        let themeLink = document.getElementById('theme-css');
        if (!themeLink) {
            themeLink = document.createElement('link');
            themeLink.id = 'theme-css';
            themeLink.rel = 'stylesheet';
            document.head.appendChild(themeLink);
        }
        themeLink.href = `/src/themes/${tema}.css`;
        
        this.mostrarNotificacion(`Tema cambiado a ${tema}`, 'success');
    },
    mostrarNotificacion(mensaje, tipo = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; background: var(--bg-secondary); 
            padding: 12px 20px; border-radius: 10px; z-index: 2000;
            border-left: 4px solid ${tipo === 'success' ? '#4caf50' : tipo === 'error' ? '#f44336' : '#ff9800'};
            animation: slideIn 0.3s ease;
        `;
        notification.innerHTML = `<div style="display: flex; align-items: center; gap: 10px;"><span>${tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : 'ℹ️'}</span><p style="margin: 0;">${mensaje}</p></div>`;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
};

window.app = app;
