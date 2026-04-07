// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - CONFIGURACIÓN DE RUTAS
// Archivo: src/config/routes.js
// ─────────────────────────────────────────────────────────────────────

// ✅ Definir y exportar rutas centralizadas
// Este módulo NO importa de otros archivos para evitar ciclos
// Usa window.app y window.router que se exportan globalmente

export const routes = {
    // ─────────────────────────────────────────────────────────────────
    // RUTAS PÚBLICAS (no requieren autenticación)
    // ─────────────────────────────────────────────────────────────────
    
    '/auth': {
        feature: 'auth',
        titulo: 'Iniciar Sesión',
        requiereAuth: false,
        permisos: ['public'],
        descripcion: 'Login con clave de licencia'
    },
    
    '/404': {
        feature: 'auth',
        titulo: 'Página No Encontrada',
        requiereAuth: false,
        permisos: ['public'],
        descripcion: 'Error 404'
    },
    
    // ─────────────────────────────────────────────────────────────────
    // RUTAS PROTEGIDAS (requieren licencia válida)
    // ─────────────────────────────────────────────────────────────────
    
    '/dashboard': {
        feature: 'dashboard',
        titulo: 'Panel Principal',
        requiereAuth: true,
        permisos: ['todos'],
        descripcion: 'Estadísticas y citas del día',
        icono: '📊'
    },
    
    '/citas': {
        feature: 'citas',
        titulo: 'Gestión de Citas',
        requiereAuth: true,
        permisos: ['todos'],
        descripcion: 'Agendar, ver y gestionar citas',
        icono: '📅'
    },
    
    '/clientes': {
        feature: 'clientes',
        titulo: 'Base de Clientes',
        requiereAuth: true,
        permisos: ['todos'],
        descripcion: 'Historial y preferencias de clientes',
        icono: '👥'
    },
    
    '/barberos': {
        feature: 'barberos',
        titulo: 'Equipo de Barberos',
        requiereAuth: true,
        permisos: ['admin'],
        descripcion: 'Gestión de barberos y comisiones',
        icono: '✂️'
    },
    
    '/servicios': {
        feature: 'servicios',
        titulo: 'Catálogo de Servicios',
        requiereAuth: true,
        permisos: ['admin'],
        descripcion: 'Precios y duración de servicios',
        icono: '💇'
    },
    
    '/productos': {
        feature: 'productos',
        titulo: 'Productos en Venta',
        requiereAuth: true,
        permisos: ['todos'],
        descripcion: 'Retail y control de inventario',
        icono: '🛍️'
    },
    
    '/reportes': {
        feature: 'reportes',
        titulo: 'Reportes y Estadísticas',
        requiereAuth: true,
        permisos: ['admin'],
        descripcion: 'Ingresos, rendimiento y exportación',
        icono: '📄'
    },
    
    '/configuracion': {
        feature: 'configuracion',
        titulo: 'Configuración',
        requiereAuth: true,
        permisos: ['admin'],
        descripcion: 'Ajustes de la barbería y respaldo',
        icono: '⚙️'
    }
};

// ✅ Exportación por defecto (opcional, para compatibilidad)
export default routes;

// ⚠️ IMPORTANTE: NO agregar "window.routes = routes" aquí
// Esto causa "Identifier 'routes' has already been declared"
// porque el módulo se ejecuta una vez por import + una vez por script tag
//
// Si necesitas acceso global, usa:
// - En router.js: import { routes } from '../config/routes.js'
// - En otros lugares: window.routes (solo si app.js lo asigna una vez)
