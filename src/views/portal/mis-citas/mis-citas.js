// src/views/portal/mis-citas/mis-citas.js

console.log('📋 Portal - Mis Citas');

// Estado local
let estado = {
    telefono: '',
    citas: [],
    citasFiltradas: [],
    citaSeleccionada: null,
    tabActivo: 'proximas'
};

// ============================================
// INICIALIZACIÓN
// ============================================

async function init() {
    console.log('🚀 Inicializando Mis Citas...');
    
    setupEventListeners();
    
    // Verificar si hay teléfono guardado en sesión
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
    
    // Guardar en sesión
    sessionStorage.setItem('cliente_telefono', telefono);
    
    // Mostrar loader
    const resultadosContainer = document.getElementById('resultados-container');
    resultadosContainer.style.display = 'block';
    
    document.getElementById('citas-proximas').innerHTML = '<div class="loading-spinner">Buscando tus citas...</div>';
    document.getElementById('citas-historial').innerHTML = '<div class="loading-spinner">Buscando tus citas...</div>';
    
    // Cargar citas
    await cargarCitas();
    
    // Renderizar
    renderizarCitas();
}

async function cargarCitas() {
    try {
        const todasCitas = await window.storage?.obtenerTodos('citas') || [];
        
        // Filtrar por teléfono
        estado.citas = todasCitas.filter(cita => 
            cita.clienteTelefono === estado.telefono ||
            cita.clienteTelefono?.replace(/\s/g, '') === estado.telefono ||
            cita.clienteTelefono?.includes(estado.telefono)
        );
        
        console.log(`📞 Encontradas ${estado.citas.length} citas para ${estado.telefono}`);
        
    } catch (error) {
        console.error('Error cargando citas:', error);
        estado.citas = [];
    }
}

function renderizarCitas() {
    const hoy = new Date().toISOString().split('T')[0];
    
    // Separar próximas y historial
    const proximas = estado.citas
        .filter(c => c.fecha >= hoy && c.estado !== 'cancelada')
        .sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora || '').localeCompare(b.hora || ''));
    
    const historial = estado.citas
        .filter(c => c.fecha < hoy || c.estado === 'cancelada')
        .sort((a, b) => b.fecha.localeCompare(a.fecha));
    
    // Renderizar próximas
    const proximasContainer = document.getElementById('citas-proximas');
    if (proximas.length === 0) {
        proximasContainer.innerHTML = '<div class="sin-resultados">No tienes próximas citas</div>';
    } else {
        proximasContainer.innerHTML = proximas.map(cita => renderizarCitaCard(cita)).join('');
    }
    
    // Renderizar historial
    const historialContainer = document.getElementById('citas-historial');
    if (historial.length === 0) {
        historialContainer.innerHTML = '<div class="sin-resultados">No hay citas en el historial</div>';
    } else {
        historialContainer.innerHTML = historial.map(cita => renderizarCitaCard(cita)).join('');
    }
}

function renderizarCitaCard(cita) {
    const puedeCancelar = cita.estado !== 'cancelada' && cita.estado !== 'completada';
    const puedeReprogramar = cita.estado !== 'cancelada' && cita.estado !== 'completada';
    
    return `
        <div class="cita-card" data-id="${cita.id}">
            <div class="cita-info">
                <div class="cita-fecha">
                    📅 ${formatearFecha(cita.fecha)} • ${cita.hora || '--:--'}
                </div>
                <div class="cita-servicio">
                    ✂️ ${cita.servicioNombre || 'Servicio'} 
                    ${cita.precio ? `- $${cita.precio.toLocaleString()}` : ''}
                </div>
                <div class="cita-barbero">💈 ${cita.barberoNombre || 'Barbero asignado'}</div>
                <div class="cita-estado-badge estado-${cita.estado || 'pendiente'}">
                    ${getEstadoTexto(cita.estado)}
                </div>
            </div>
            <div class="cita-acciones">
                <button class="btn-accion btn-detalle" onclick="verDetalleCita(${cita.id})">
                    👁️ Ver
                </button>
                ${puedeReprogramar ? `
                    <button class="btn-accion btn-reprogramar" onclick="reprogramarCita(${cita.id})">
                        🔄 Reprogramar
                    </button>
                ` : ''}
                ${puedeCancelar ? `
                    <button class="btn-accion btn-cancelar" onclick="cancelarCita(${cita.id})">
                        ❌ Cancelar
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// ============================================
// ACCIONES DE CITAS
// ============================================

window.verDetalleCita = function(id) {
    const cita = estado.citas.find(c => c.id === id);
    if (!cita) return;
    
    const modal = document.getElementById('detalle-modal');
    const contenido = document.getElementById('detalle-contenido');
    
    contenido.innerHTML = `
        <div class="detalle-item">
            <strong>📅 Fecha:</strong> ${formatearFecha(cita.fecha)}
        </div>
        <div class="detalle-item">
            <strong>⏰ Hora:</strong> ${cita.hora || '--:--'}
        </div>
        <div class="detalle-item">
            <strong>✂️ Servicio:</strong> ${cita.servicioNombre || 'Servicio'}
        </div>
        <div class="detalle-item">
            <strong>💈 Barbero:</strong> ${cita.barberoNombre || 'Barbero asignado'}
        </div>
        <div class="detalle-item">
            <strong>💰 Total:</strong> $${(cita.precio || 0).toLocaleString()}
        </div>
        <div class="detalle-item">
            <strong>📌 Estado:</strong> 
            <span class="estado-badge estado-${cita.estado}">${getEstadoTexto(cita.estado)}</span>
        </div>
        ${cita.notas ? `
            <div class="detalle-item">
                <strong>📝 Notas:</strong> ${cita.notas}
            </div>
        ` : ''}
    `;
    
    modal.style.display = 'flex';
};

window.cancelarCita = function(id) {
    const cita = estado.citas.find(c => c.id === id);
    if (!cita) return;
    
    estado.citaSeleccionada = cita;
    
    const modal = document.getElementById('cancelar-modal');
    const infoContainer = document.getElementById('cita-cancelar-info');
    
    infoContainer.innerHTML = `
        <div><strong>Servicio:</strong> ${cita.servicioNombre}</div>
        <div><strong>Fecha:</strong> ${formatearFecha(cita.fecha)}</div>
        <div><strong>Hora:</strong> ${cita.hora}</div>
    `;
    
    modal.style.display = 'flex';
};

window.reprogramarCita = function(id) {
    const cita = estado.citas.find(c => c.id === id);
    if (!cita) return;
    
    estado.citaSeleccionada = cita;
    
    const modal = document.getElementById('reprogramar-modal');
    const infoContainer = document.getElementById('cita-reprogramar-info');
    
    infoContainer.innerHTML = `
        <div><strong>Cita actual:</strong></div>
        <div>${formatearFecha(cita.fecha)} - ${cita.hora}</div>
        <div>${cita.servicioNombre} con ${cita.barberoNombre}</div>
    `;
    
    // Generar fechas disponibles
    const fechaInput = document.getElementById('nueva-fecha');
    const hoy = new Date();
    fechaInput.min = hoy.toISOString().split('T')[0];
    fechaInput.value = cita.fecha;
    
    // Generar horas
    cargarHorasDisponibles(cita.fecha);
    
    fechaInput.onchange = () => cargarHorasDisponibles(fechaInput.value);
    
    modal.style.display = 'flex';
};

async function confirmarCancelar() {
    if (!estado.citaSeleccionada) return;
    
    const cita = estado.citaSeleccionada;
    cita.estado = 'cancelada';
    
    await window.storage?.guardar('citas', cita);
    
    window.app?.mostrarNotificacion('Cita cancelada', 'warning');
    
    cerrarModales();
    await cargarCitas();
    renderizarCitas();
}

async function confirmarReprogramar() {
    if (!estado.citaSeleccionada) return;
    
    const nuevaFecha = document.getElementById('nueva-fecha').value;
    const nuevaHora = document.getElementById('nueva-hora').value;
    
    if (!nuevaFecha || !nuevaHora) {
        window.app?.mostrarNotificacion('Selecciona nueva fecha y hora', 'warning');
        return;
    }
    
    const cita = estado.citaSeleccionada;
    cita.fecha = nuevaFecha;
    cita.hora = nuevaHora;
    cita.estado = 'pendiente';
    
    await window.storage?.guardar('citas', cita);
    
    window.app?.mostrarNotificacion('Cita reprogramada', 'success');
    
    cerrarModales();
    await cargarCitas();
    renderizarCitas();
}

function cargarHorasDisponibles(fecha) {
    const select = document.getElementById('nueva-hora');
    const horas = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    
    select.innerHTML = '<option value="">Seleccionar hora</option>' +
        horas.map(h => `<option value="${h}">${h}</option>`).join('');
    
    if (estado.citaSeleccionada?.hora) {
        select.value = estado.citaSeleccionada.hora;
    }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

function getEstadoTexto(estado) {
    const estados = {
        'pendiente': 'Pendiente',
        'confirmada': 'Confirmada',
        'completada': 'Completada',
        'cancelada': 'Cancelada'
    };
    return estados[estado] || 'Pendiente';
}

function cerrarModales() {
    document.getElementById('cancelar-modal').style.display = 'none';
    document.getElementById('reprogramar-modal').style.display = 'none';
    document.getElementById('detalle-modal').style.display = 'none';
}

// ============================================
// CAMBIO DE TABS
// ============================================

function cambiarTab(tab) {
    estado.tabActivo = tab;
    
    // Actualizar clases de tabs
    document.querySelectorAll('.citas-tab').forEach(t => {
        t.classList.remove('active');
        if (t.dataset.tab === tab) t.classList.add('active');
    });
    
    // Mostrar/ocultar contenedores
    document.getElementById('citas-proximas').style.display = tab === 'proximas' ? 'flex' : 'none';
    document.getElementById('citas-historial').style.display = tab === 'historial' ? 'flex' : 'none';
}

// ============================================
// EVENTOS
// ============================================

function setupEventListeners() {
    // Búsqueda
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
    
    // Tabs
    document.querySelectorAll('.citas-tab').forEach(tab => {
        tab.onclick = () => cambiarTab(tab.dataset.tab);
    });
    
    // Modales
    document.getElementById('cancelar-cerrar')?.addEventListener('click', () => {
        document.getElementById('cancelar-modal').style.display = 'none';
    });
    
    document.getElementById('confirmar-cancelar')?.addEventListener('click', confirmarCancelar);
    
    document.getElementById('reprogramar-cerrar')?.addEventListener('click', () => {
        document.getElementById('reprogramar-modal').style.display = 'none';
    });
    
    document.getElementById('confirmar-reprogramar')?.addEventListener('click', confirmarReprogramar);
    
    document.getElementById('detalle-cerrar')?.addEventListener('click', () => {
        document.getElementById('detalle-modal').style.display = 'none';
    });
    
    // Cerrar modales con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModales();
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
