// src/components/Sidebar.js

export const Sidebar = {
    render: function() {
        const sidebar = document.getElementById('app-sidebar');
        if (!sidebar) return;
        
        const menuItems = [
            { path: '/dashboard', icon: '📊', label: 'Dashboard' },
            { path: '/clientes', icon: '👥', label: 'Clientes' },
            { path: '/cortes', icon: '✂️', label: 'Cortes' },
            { path: '/inventario', icon: '📦', label: 'Inventario' },
            { path: '/caja', icon: '💰', label: 'Caja' },
            { path: '/reportes', icon: '📈', label: 'Reportes' },
            { path: '/configuracion', icon: '⚙️', label: 'Configuración' }
        ];
        
        sidebar.innerHTML = `
            <div class="sidebar-container">
                <div class="sidebar-header">
                    <h3>💈 BarberHub</h3>
                </div>
                <nav class="sidebar-nav">
                    ${menuItems.map(item => `
                        <a href="#${item.path}" data-path="${item.path}">
                            ${item.icon} ${item.label}
                        </a>
                    `).join('')}
                </nav>
            </div>
        `;
        
        // Agregar event listeners
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const path = link.getAttribute('data-path');
                if (window.router && window.router.navegar) {
                    window.router.navegar(path);
                }
            });
        });
    }
};
