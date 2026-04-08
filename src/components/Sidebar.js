// src/components/Sidebar.js

export const Sidebar = {
    render: function() {
        const sidebar = document.getElementById('app-sidebar');
        if (!sidebar) {
            console.warn('⚠️ Elemento app-sidebar no encontrado');
            return;
        }
        
        const menuItems = [
            { path: '/dashboard', icon: '📊', label: 'Dashboard' },
            { path: '/clientes', icon: '👥', label: 'Clientes' },
            { path: '/citas', icon: '📅', label: 'Citas' },
            { path: '/barberos', icon: '✂️', label: 'Barberos' },
            { path: '/servicios', icon: '💈', label: 'Servicios' },
            { path: '/inventario', icon: '📦', label: 'Inventario' },
            { path: '/caja', icon: '💰', label: 'Caja' },
            { path: '/reportes', icon: '📈', label: 'Reportes' },
            { path: '/configuracion', icon: '⚙️', label: 'Configuración' }
        ];
        
        const isAuthenticated = window.app && window.app.estado && window.app.estado.licencia;
        
        const html = `
            <div class="sidebar-container">
                <div class="sidebar-header">
                    <h3>💈 BarberHub</h3>
                </div>
                <nav class="sidebar-nav">
                    ${menuItems.map(item => `
                        <a href="#${item.path}" data-path="${item.path}" class="sidebar-link">
                            <span class="sidebar-icon">${item.icon}</span>
                            <span class="sidebar-label">${item.label}</span>
                        </a>
                    `).join('')}
                </nav>
                ${isAuthenticated ? `
                    <div class="sidebar-footer">
                        <button class="sidebar-logout" onclick="window.app.logout()">
                            <span class="sidebar-icon">🚪</span>
                            <span class="sidebar-label">Cerrar Sesión</span>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        sidebar.innerHTML = html;
        
        // Agregar botón hamburguesa si no existe
        this.addHamburgerButton();
        
        // Agregar overlay
        this.addOverlay();
        
        // Adjuntar event listeners
        this.attachEventListeners();
        
        // Marcar link activo
        this.setActiveLink();
    },
    
    addHamburgerButton: function() {
        if (document.querySelector('.hamburger-btn')) return;
        
        const button = document.createElement('button');
        button.className = 'hamburger-btn';
        button.innerHTML = `
            <div class="hamburger-icon">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        
        button.addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        document.body.appendChild(button);
    },
    
    addOverlay: function() {
        if (document.querySelector('.sidebar-overlay')) return;
        
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', () => {
            this.closeSidebar();
        });
        
        document.body.appendChild(overlay);
    },
    
    toggleSidebar: function() {
        const sidebar = document.getElementById('app-sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        const hamburger = document.querySelector('.hamburger-btn');
        
        if (sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            hamburger.classList.remove('active');
        } else {
            sidebar.classList.add('open');
            overlay.classList.add('active');
            hamburger.classList.add('active');
        }
    },
    
    closeSidebar: function() {
        const sidebar = document.getElementById('app-sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        const hamburger = document.querySelector('.hamburger-btn');
        
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
        hamburger.classList.remove('active');
    },
    
    attachEventListeners: function() {
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const path = link.getAttribute('data-path');
                if (window.router && window.router.navegar) {
                    window.router.navegar(path);
                    // Cerrar sidebar en móvil después de navegar
                    if (window.innerWidth <= 768) {
                        this.closeSidebar();
                    }
                }
            });
        });
    },
    
    setActiveLink: function() {
        let currentPath = window.location.hash.substring(1);
        if (!currentPath) currentPath = '/';
        
        document.querySelectorAll('.sidebar-link').forEach(link => {
            const linkPath = link.getAttribute('data-path');
            if (linkPath === currentPath) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
};
