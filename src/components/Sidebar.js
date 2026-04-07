// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - SIDEBAR COMPONENT
// ─────────────────────────────────────────────────────────────────────

// ✅ Import con nombre exacto del export
import { router } from '../core/router.js';

console.log('🧩 Sidebar Component cargado');

export const Sidebar = {
    items: [
        { icon: '📊', label: 'Dashboard', ruta: '/dashboard' },
        { icon: '📅', label: 'Citas', ruta: '/citas' },
        { icon: '👥', label: 'Clientes', ruta: '/clientes' },
        { icon: '✂️', label: 'Barberos', ruta: '/barberos' },
        { icon: '💇', label: 'Servicios', ruta: '/servicios' },
        { icon: '🛍️', label: 'Productos', ruta: '/productos' },
        { icon: '📄', label: 'Reportes', ruta: '/reportes' }
    ],

    render: function() {
        const sidebar = document.getElementById('app-sidebar');
        if (!sidebar) { console.error('❌ No se encontró #app-sidebar'); return; }
        
        sidebar.innerHTML = `
            <nav class="sidebar">
                <div class="sidebar-header">
                    <h2>💈 BarberHub</h2>
                    <p>Gestión Inteligente</p>
                </div>
                <ul class="sidebar-menu">
                    ${this.items.map(item => `
                        <li>
                            <a href="#" data-ruta="${item.ruta}" 
                               class="sidebar-link"
                               onclick="window.router.navegar('${item.ruta}'); return false;">
                                <span class="icon">${item.icon}</span>
                                <span class="label">${item.label}</span>
                            </a>
                        </li>
                    `).join('')}
                </ul>
                <div class="sidebar-footer">
                    <button onclick="window.app.logout()" class="btn-logout">🚪 Cerrar Sesión</button>
                </div>
            </nav>
        `;
        console.log('✅ Sidebar renderizado');
    }
};

export default Sidebar;
