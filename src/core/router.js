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
    '/404': { 
        feature: 'auth', 
        titulo: 'Error', 
        requiereAuth: false, 
        permisos: ['public'] 
    }
};
