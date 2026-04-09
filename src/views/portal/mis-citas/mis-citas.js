// src/views/portal/mis-citas/mis-citas.js

console.log('📋 Portal - Mis Citas');

let estado = {
    telefono: '',
    citas: [],
    citaSeleccionada: null,
    tabActivo: 'proximas'
};

// ============================================
// INICIALIZACIÓN
// ============================================

async function init() {
    console.log('🚀 Inicializando Mis Citas...');
    
    setupEventListeners();
    
    const telefonoGuardado = sessionStorage.getItem('cliente_telefono');
    if (telefonoGuardado) {
        document.getElementById('telefono-busqueda').value = telefonoGuardado;
        await buscarCitas();
    }
}

async function buscarCitas() {
    const telefono = document.getElementById('telefono-busqueda').value.trim();
    
    if (!telefono) {
        window.app?.mostrarNotificacion('Ingresa tu número de teléfono', 'warning');
        return;
    }
    
    estado.telefono = telefono;
    sessionStorage.setItem('cliente_telefono', telefono);
    
    document.getElementById('resultados-container').style.display = 'block';
    document.getElementById('citas-proximas').innerHTML = '<div class="loading-spinner">Buscando tus citas...</div>';
    document.getElementById('citas-historial').innerHTML = '<div class="loading-spinner">Buscando tus citas...</div>';
    
    await cargarCitas();
    renderizarCitas();
}

async function cargarCitas() {
    try {
        const todasCitas = await window.storage?.obtenerTodos('citas') || [];
        
        estado.citas = todasCitas.filter(cita => 
            cita.clienteTelefono === estado.telefono ||
            cita.clienteTelefono?.replace(/\s/g, '') === estado.telefono
        );
        
        console.log(`📞 Encontradas ${estado.citas.length} citas`);
    } catch (error) {
        console.error('Error cargando citas:', error);
        estado.citas = [];
    }
}

function renderizarCitas() {
    const hoy = new Date().toISOString().split('T')[0];
    
    const proximas = estado.citas
        .filter(c => c.fecha >= hoy && c.estado !== 'cancelada')
        .sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora || '').localeCompare(b.hora || ''));
    
    const historial = estado.citas
        .filter(c => c.fecha < hoy || c.estado === 'cancelada')
        .sort((a, b) => b.fecha.localeCompare(a.fecha));
    
    const proximasContainer = document.getElementById('citas-proximas');
    if (proximas.length === 0) {
        proximasContainer.innerHTML = '<div class="sin-resultados">No tienes próximas citas</div>';
    } else {
        proximasContainer.innerHTML = proximas.map(cita => renderizarCitaCard(cita)).join('');
    }
    
    const historialContainer = document.getElementById('citas-historial');
    if (historial.length === 0) {
        historialContainer.innerHTML = '<div class="sin-resultados">No hay citas en el historial</div>';
    } else {
        historialContainer.innerHTML = historial.map(cita => renderizarCitaCard(cita)).join('');
    }
}

function renderizarCitaCard(cita) {
    const puedeCancelar = cita.estado !== 'cancelada' && cita.estado !== 'completada' && cita.fecha >= new Date().toISOString().split('T')[0];
    
    let estadoTexto = '';
    let estadoClass = '';
    
    switch(cita.estado) {
        case 'pendiente': estadoTexto = '⏳ Pendiente'; estadoClass = 'estado-pendiente'; break;
        case 'confirmada': estadoTexto = '✅ Confirmada'; estadoClass = 'estado-confirmada'; break;
        case 'completada': estadoTexto = '🎉 Completada'; estadoClass = 'estado-completada'; break;
        case 'cancelada': estadoTexto = '❌ Cancelada'; estadoClass = 'estado-cancelada'; break;
        default: estadoTexto = '📌 Pendiente'; estadoClass = 'estado-pendiente';
    }
    
    return `
        <div class="cita-card" data-id="${cita.id}">
            <div class="cita-info">
                <div class="cita-fecha">📅 ${formatearFecha(cita.fecha)} • ${cita.hora || '--:--'}</div>
                <div class="cita-servicio">✂️ ${escapeHtml(cita.servicioNombre)} - $${(cita.precio || 0).toLocaleString()}</div>
                <div class="cita-barbero">💈 ${escapeHtml(cita.barberoNombre)}</div>
                <div class="cita-estado-badge ${estadoClass}">${estadoTexto}</div>
            </div>
            ${puedeCancelar ? `
                <div class="cita-acciones">
                    <button class="btn-cancelar" onclick="cancelarCita(${cita.id})">❌ Cancelar</button>
                </div>
            ` : ''}
        </div>
    `;
}

// ============================================
// CANCELAR CITA
// ============================================

window.cancelarCita = async function(id) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.')) {
        return;
    }
    
    const cita = estado.citas.find(c => c.id === id);
    if (!cita) return;
    
    cita.estado = 'cancelada';
    
    await window.storage?.guardar('citas', cita);
    
    window.app?.mostrarNotificacion('Cita cancelada', 'warning');
    
    await cargarCitas();
    renderizarCitas();
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function cambiarTab(tab) {
    estado.tabActivo = tab;
    
    document.querySelectorAll('.citas-tab').forEach(t => {
        t.classList.remove('active');
        if (t.dataset.tab === tab) t.classList.add('active');
    });
    
    document.getElementById('citas-proximas').style.display = tab === 'proximas' ? 'block' : 'none';
    document.getElementById('citas-historial').style.display = tab === 'historial' ? 'block' : 'none';
}

function setupEventListeners() {
    const btnBuscar = document.getElementById('btn-buscar');
    const inputTelefono = document.getElementById('telefono-busqueda');
    
    if (btnBuscar) {
        btnBuscar.onclick = buscarCitas;
    }
    
    if (inputTelefono) {
        inputTelefono.onkeypress = (e) => {
            if (e.key === 'Enter') buscarCitas();
        };
    }
    
    document.querySelectorAll('.citas-tab').forEach(tab => {
        tab.onclick = () => cambiarTab(tab.dataset.tab);
    });
}

// ============================================
// INICIALIZAR
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export { init };
