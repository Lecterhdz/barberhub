// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - ROUTER (IMPORTS RELATIVOS AL HTML)
// ─────────────────────────────────────────────────────────────────────

// ✅ IMPORTANTE: Paths relativos al index.html (raíz del repo)
import { routes } from './src/config/routes.js';
import { app } from './src/core/app.js';

console.log('🧭 Router cargado');

export const routes = {
    '/auth': { feature: 'auth', titulo: 'Iniciar Sesión', requiereAuth: false, permisos: ['public'] },
    '/dashboard': { feature: 'dashboard', titulo: 'Dashboard', requiereAuth: true, permisos: ['todos'] },
    '/404': { feature: 'auth', titulo: 'Error', requiereAuth: false, permisos: ['public'] }
};
window.routes = routes;

window.router = router;
