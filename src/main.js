// src/main.js
console.log('1. main.js iniciado');

import { app } from './core/app.js';
import { router } from './core/router.js';
import { ThemeSwitcher } from './components/ThemeSwitcher.js';

console.log('2. Importación completada');
console.log('3. ThemeSwitcher importado:', ThemeSwitcher);

window.app = app;
window.router = router;
window.ThemeSwitcher = ThemeSwitcher;

async function iniciar() {
    console.log('5. Iniciando secuencia...');
    
    await app.init();
    console.log('6. App lista');
    
    // ✅ Inicializar ThemeSwitcher explícitamente después de que el header esté listo
    setTimeout(() => {
        if (window.ThemeSwitcher && window.ThemeSwitcher.init) {
            window.ThemeSwitcher.init();
            console.log('🎨 ThemeSwitcher inicializado');
        } else {
            console.log('❌ ThemeSwitcher no disponible');
        }
    }, 500);
    
    await router.cargarVista();
    console.log('7. Vista inicial cargada');
    
    window.addEventListener('hashchange', () => router.cargarVista());
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
} else {
    iniciar();
}