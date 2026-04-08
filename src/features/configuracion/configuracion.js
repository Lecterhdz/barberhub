// src/features/configuracion/configuracion.js

console.log('⚙️ Configuración cargada');

async function init() {
    console.log('⚙️ Inicializando configuración...');
    cargarConfiguracion();
    setupEventListeners();
}

function cargarConfiguracion() {
    const config = JSON.parse(localStorage.getItem('barberhub_config') || '{}');
    document.getElementById('config-nombre').value = config.nombre || '';
    document.getElementById('config-telefono').value = config.telefono || '';
    document.getElementById('config-direccion').value = config.direccion || '';
    document.getElementById('config-horario').value = config.horario || '';
    document.getElementById('config-tema').value = config.tema || 'dark-amber';
    document.getElementById('config-idioma').value = config.idioma || 'es';
    document.getElementById('config-notificaciones').checked = config.notificaciones || false;
    document.getElementById('config-sonidos').checked = config.sonidos || false;
    
    const licencia = JSON.parse(localStorage.getItem('barberhub_licencia') || '{}');
    document.getElementById('license-info').innerHTML = licencia.key ? 
        `✅ Licencia activa: <strong>${licencia.tipo}</strong><br>Expira: ${new Date(licencia.expiracion).toLocaleDateString()}` :
        '❌ No hay licencia activa';
}

function setupEventListeners() {
    document.getElementById('config-tema')?.addEventListener('change', (e) => {
        if (window.app) window.app.cambiarTema(e.target.value);
    });
    
    document.getElementById('btn-exportar-datos')?.addEventListener('click', () => {
        if (window.app) window.app.exportarDatos();
    });
    
    document.getElementById('btn-cambiar-licencia')?.addEventListener('click', () => {
        if (window.app) window.app.logout();
    });
    
    document.getElementById('btn-resetear-datos')?.addEventListener('click', async () => {
        if (confirm('¿Resetear todos los datos? Esta acción no se puede deshacer.')) {
            localStorage.clear();
            indexedDB.deleteDatabase('BarberHubDB');
            alert('Datos eliminados. La página se recargará.');
            location.reload();
        }
    });
    
    // Guardar configuración al cambiar
    const inputs = ['config-nombre', 'config-telefono', 'config-direccion', 'config-horario', 'config-idioma', 'config-notificaciones', 'config-sonidos'];
    inputs.forEach(id => {
        document.getElementById(id)?.addEventListener('change', guardarConfiguracion);
        document.getElementById(id)?.addEventListener('input', guardarConfiguracion);
    });
}

function guardarConfiguracion() {
    const config = {
        nombre: document.getElementById('config-nombre')?.value || '',
        telefono: document.getElementById('config-telefono')?.value || '',
        direccion: document.getElementById('config-direccion')?.value || '',
        horario: document.getElementById('config-horario')?.value || '',
        tema: document.getElementById('config-tema')?.value || 'dark-amber',
        idioma: document.getElementById('config-idioma')?.value || 'es',
        notificaciones: document.getElementById('config-notificaciones')?.checked || false,
        sonidos: document.getElementById('config-sonidos')?.checked || false
    };
    localStorage.setItem('barberhub_config', JSON.stringify(config));
    if (window.app) window.app.estado.configuracion = config;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export { init };
