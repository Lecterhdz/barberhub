// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - CONFIGURACIÓN DE RUTAS
// ─────────────────────────────────────────────────────────────────────

export const routes = {
    '/auth': {
        feature: 'auth',
        titulo: 'Iniciar Sesión',
        requiereAuth: false,
        permisos: ['public']
    },
    '/dashboard': {
        feature: 'dashboard',
        titulo: 'Dashboard',
        requiereAuth: true,
        permisos: ['todos']
    },
    '/citas': {
        feature: 'citas',
        titulo: 'Citas',
        requiereAuth: true,
        permisos: ['todos']
    },
    '/clientes': {
        feature: 'clientes',
        titulo: 'Clientes',
        requiereAuth: true,
        permisos: ['todos']
    },
    '/barberos': {
        feature: 'barberos',
        titulo: 'Barberos',
        requiereAuth: true,
        permisos: ['admin']
    },
    '/servicios': {
        feature: 'servicios',
        titulo: 'Servicios',
        requiereAuth: true,
        permisos: ['admin']
    },
    '/productos': {
        feature: 'productos',
        titulo: 'Productos',
        requiereAuth: true,
        permisos: ['todos']
    },
    '/reportes': {
        feature: 'reportes',
        titulo: 'Reportes',
        requiereAuth: true,
        permisos: ['admin']
    },
    '/404': {
        feature: 'auth',
        titulo: 'Error',
        requiereAuth: false,
        permisos: ['public']
    }
};

// Exportar para uso global
window.routes = routes;
