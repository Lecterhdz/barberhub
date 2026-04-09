// src/views/admin/citas/citas.js

console.log('📅 Admin - Citas');

// Estado local
let citas = [];
let clientes = [];
let barberos = [];
let servicios = [];
let currentView = 'calendario';
let currentFechaInicio = new Date();
let currentPage = 1;
let itemsPerPage = 10;
let currentFiltros = {
    barbero: 'todos',
    estado: 'todos',
    fecha: 'hoy'
};
let editingId = null;

// ============================================
// INICIALIZACIÓN
// ============================================

async function init() {
    console.log('🚀 Inicializando gestión de citas...');
    
    await cargarDatos();
    setupEventListeners();
    setupModalClose();
    renderizarVista();
}

async function cargarDatos() {
    // Obtener del caché global
    if (window.app && window.app.estado) {
        citas = window.app.estado.cache.citas || [];
        clientes = window.app.estado.cache.clientes || [];
        barberos = window.app.estado.cache.barberos || [];
        servicios = window.app.estado.cache.servicios || [];
    } else {
        citas = await window.storage?.obtenerTodos('citas') || [];
        clientes = await window.storage?.obtenerTodos('clientes') || [];
        barberos = await window.storage?.obtenerTodos('barberos') || [];
        servicios = await window.storage?.obtenerTodos('servicios') || [];
    }
    
    await cargarSelectores();
    console.log(`📦 ${citas.length} citas cargadas`);
}

async function cargarSelectores() {
    const clienteSelect = document.getElementById('cita-cliente');
    const barberoSelect = document.getElementById('cita-barbero');
    const servicioSelect = document.getElementById('cita-servicio');
    const filtroBarbero = document.getElementById('filtro-barbero');
    
    if (clienteSelect) {
        clienteSelect.innerHTML = '<option value="">Seleccionar cliente</option>' +
            clientes.map(c => `<option value="${c.id}">${escapeHtml(c.nombre)}</option>`).join('');
    }
    
    if (barberoSelect) {
        barberoSelect.innerHTML = '<option value="">Seleccionar barbero</option>' +
            barberos.filter(b => b.estado === 'activo').map(b => `<option value="${b.id}">${escapeHtml(b.nombre)}</option>`).join('');
    }
    
    if (servicioSelect) {
        servicioSelect.innerHTML = '<option value="">Seleccionar servicio</option>' +
            servicios.map(s => `<option value="${s.id}" data-precio="${s.precio}">${escapeHtml(s.nombre)} - $${s.precio}</option>`).join('');
    }
    
    if (filtroBarbero) {
        filtroBarbero.innerHTML = '<option value="todos">Todos los barberos</option>' +
            barberos.map(b => `<option value="${b.id}">${escapeHtml(b.nombre)}</option>`).join('');
    }
}

// ============================================
// FILTRADO
// ============================================

function filtrarCitas() {
    let filtered = [...citas];
    
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];
    
    if (currentFiltros.fecha === 'hoy') {
        filtered = filtered.filter(c => c.fecha === hoyStr);
    } else if (currentFiltros.fecha === 'manana') {
        const manana = new Date(hoy);
        manana.setDate(hoy.getDate() + 1);
        filtered = filtered.filter(c => c.fecha === manana.toISOString().split('T')[0]);
    } else if (currentFiltros.fecha === 'semana') {
        const finSemana = new Date(hoy);
        finSemana.setDate(hoy.getDate() + 7);
        filtered = filtered.filter(c => c.fecha >= hoyStr && c.fecha <= finSemana.toISOString().split('T')[0]);
    }
    
    if (currentFiltros.barbero !== 'todos') {
        filtered = filtered.filter(c => c.barberoId == currentFiltros.barbero);
    }
    
    if (currentFiltros.estado !== 'todos') {
        filtered = filtered.filter(c => c.estado === currentFiltros.estado);
    }
    
    return filtered.sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora || '').localeCompare(b.hora || ''));
}

// ============================================
// RENDERIZADO DE VISTAS
// ============================================

function renderizarVista() {
    if (currentView === 'calendario') {
        document.getElementById('vista-calendario').style.display = 'block';
        document.getElementById('vista-lista').style.display = 'none';
        renderizarCalendario();
    } else {
        document.getElementById('vista-calendario').style.display = 'none';
        document.getElementById('vista-lista').style.display = 'block';
        currentPage = 1;
        renderizarLista();
    }
}

function renderizarCalendario() {
    const grid = document.getElementById('calendario-grid');
    if (!grid) return;
    
    const inicioSemana = new Date(currentFechaInicio);
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay() + 1);
    
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const hoy = new Date().toDateString();
    const citasFiltradas = filtrarCitas();
    
    let html = '';
    for (let i = 0; i < 7; i++) {
        const fecha = new Date(inicioSemana);
        fecha.setDate(inicioSemana.getDate() + i);
        const fechaStr = fecha.toISOString().split('T')[0];
        const citasDelDia = citasFiltradas.filter(c => c.fecha === fechaStr);
        
        html += `
            <div class="calendario-dia">
                <div class="dia-header ${fecha.toDateString() === hoy ? 'fecha-actual' : ''}">
                    <div>${diasSemana[i]}</div>
                    <small>${fecha.getDate()}/${fecha.getMonth() + 1}</small>
                </div>
                <div class="dia-citas">
                    ${citasDelDia.map(cita => `
                        <div class="cita-item-calendario" onclick="verCita(${cita.id})">
                            <div class="cita-hora-calendario">🕐 ${cita.hora}</div>
                            <div class="cita-cliente-calendario">${escapeHtml(cita.clienteNombre)}</div>
                            <div class="cita-servicio-calendario">${escapeHtml(cita.servicioNombre)}</div>
                        </div>
                    `).join('')}
                    ${citasDelDia.length === 0 ? '<div style="padding: 5px; color: var(--text-secondary); font-size: 0.7rem;">Sin citas</div>' : ''}
                </div>
            </div>
        `;
    }
    
    grid.innerHTML = html;
    
    // Actualizar título de la semana
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);
    document.getElementById('semana-actual').textContent = 
        `${inicioSemana.getDate()}/${inicioSemana.getMonth() + 1} - ${finSemana.getDate()}/${finSemana.getMonth() + 1}`;
}

function renderizarLista() {
    const tbody = document.getElementById('citas-table-body');
    if (!tbody) return;
    
    const filtered = filtrarCitas();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    
    if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No hay citas registradas</td></tr>`;
        document.getElementById('page-info-lista').textContent = 'Página 1 de 1';
        return;
    }
    
    tbody.innerHTML = paginated.map(cita => `
        <tr> onclick="verCita(${cita.id})">
            <td>${formatearFecha(cita.fecha)}</td>
            <td>${cita.hora}</td>
            <td>${escapeHtml(cita.clienteNombre)}</td>
            <td>${escapeHtml(cita.servicioNombre)}</td>
            <td>${escapeHtml(cita.barberoNombre)}</td>
            <td><span class="estado-badge estado-${cita.estado}">${getEstadoTexto(cita.estado)}</span></td>
            <td onclick="event.stopPropagation()">
                <div class="acciones-cita">
                    <button class="btn-icon-sm" onclick="editarCita(${cita.id})" title="Editar">✏️</button>
                    <button class="btn-icon-sm" onclick="eliminarCita(${cita.id})" title="Eliminar">🗑️</button>
                </div>
            </td>
         </tr>
    `).join('');
    
    document.getElementById('page-info-lista').textContent = `Página ${currentPage} de ${totalPages || 1}`;
    document.getElementById('prev-page-lista').disabled = currentPage === 1;
    document.getElementById('next-page-lista').disabled = currentPage === totalPages || totalPages === 0;
}

// ============================================
// CRUD DE CITAS
// ============================================

window.verCita = function(id) {
    const cita = citas.find(c => c.id === id);
    if (!cita) return;
    
    const detalle = document.getElementById('cita-detalle');
    detalle.innerHTML = `
        <div class="cita-detalle-info">
            <div class="info-row"><label>📅 Fecha:</label><span>${formatearFecha(cita.fecha)}</span></div>
            <div class="info-row"><label>⏰ Hora:</label><span>${cita.hora}</span></div>
            <div class="info-row"><label>👤 Cliente:</label><span>${escapeHtml(cita.clienteNombre)}</span></div>
            <div class="info-row"><label>📞 Teléfono:</label><span>${cita.clienteTelefono || 'No registrado'}</span></div>
            <div class="info-row"><label>✂️ Servicio:</label><span>${escapeHtml(cita.servicioNombre)}</span></div>
            <div class="info-row"><label>💈 Barbero:</label><span>${escapeHtml(cita.barberoNombre)}</span></div>
            <div class="info-row"><label>💰 Precio:</label><span>$${cita.precio.toLocaleString()}</span></div>
            <div class="info-row"><label>📌 Estado:</label><span class="estado-badge estado-${cita.estado}">${getEstadoTexto(cita.estado)}</span></div>
            ${cita.notas ? `<div class="info-row"><label>📝 Notas:</label><span>${escapeHtml(cita.notas)}</span></div>` : ''}
        </div>
    `;
    
    window.currentCitaId = id;
    
    // Mostrar botón cancelar solo si no está cancelada o completada
    const cancelarBtn = document.getElementById('cancelar-ver-modal');
    if (cancelarBtn) {
        cancelarBtn.style.display = (cita.estado !== 'cancelada' && cita.estado !== 'completada') ? 'block' : 'none';
    }
    
    document.getElementById('cita-ver-modal').style.display = 'flex';
};

window.editarCita = function(id) {
    const cita = citas.find(c => c.id === id);
    if (!cita) return;
    
    editingId = id;
    document.getElementById('modal-title').textContent = 'Editar Cita';
    document.getElementById('cita-cliente').value = cita.clienteId || '';
    document.getElementById('cita-barbero').value = cita.barberoId;
    document.getElementById('cita-servicio').value = cita.servicioId;
    document.getElementById('cita-precio').value = `$${cita.precio}`;
    document.getElementById('cita-fecha').value = cita.fecha;
    document.getElementById('cita-estado').value = cita.estado;
    document.getElementById('cita-notas').value = cita.notas || '';
    document.getElementById('cita-modal').style.display = 'flex';
    cargarHorasDisponibles(cita.hora);
};

window.eliminarCita = async function(id) {
    if (confirm('¿Eliminar esta cita?')) {
        citas = citas.filter(c => c.id !== id);
        await guardarCitas();
        renderizarVista();
        window.app?.mostrarNotificacion('Cita eliminada', 'success');
    }
};

function nuevaCita() {
    editingId = null;
    document.getElementById('modal-title').textContent = 'Nueva Cita';
    document.getElementById('cita-form').reset();
    document.getElementById('cita-fecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('cita-estado').value = 'pendiente';
    document.getElementById('cita-modal').style.display = 'flex';
    cargarHorasDisponibles();
}

async function guardarCita(e) {
    e.preventDefault();
    
    const clienteId = document.getElementById('cita-cliente').value;
    const barberoId = parseInt(document.getElementById('cita-barbero').value);
    const servicioId = parseInt(document.getElementById('cita-servicio').value);
    const servicio = servicios.find(s => s.id === servicioId);
    const barbero = barberos.find(b => b.id === barberoId);
    const cliente = clientes.find(c => c.id == clienteId);
    
    const citaData = {
        clienteId: clienteId || null,
        clienteNombre: cliente?.nombre || 'Cliente general',
        clienteTelefono: cliente?.telefono || '',
        barberoId: barberoId,
        barberoNombre: barbero?.nombre || '',
        servicioId: servicioId,
        servicioNombre: servicio?.nombre || '',
        precio: servicio?.precio || 0,
        fecha: document.getElementById('cita-fecha').value,
        hora: document.getElementById('cita-hora').value,
        estado: document.getElementById('cita-estado').value,
        notas: document.getElementById('cita-notas').value,
        fechaCreacion: new Date().toISOString()
    };
    
    if (editingId) {
        const index = citas.findIndex(c => c.id === editingId);
        if (index !== -1) {
            citaData.id = editingId;
            citas[index] = { ...citas[index], ...citaData };
        }
        window.app?.mostrarNotificacion('Cita actualizada', 'success');
    } else {
        citaData.id = Date.now();
        citas.push(citaData);
        window.app?.mostrarNotificacion('Cita agregada', 'success');
    }
    
    await guardarCitas();
    renderizarVista();
    cerrarModal();
}

async function guardarCitas() {
    for (const cita of citas) {
        await window.storage?.guardar('citas', cita);
    }
    
    // Actualizar caché global
    if (window.app && window.app.estado) {
        window.app.estado.cache.citas = citas;
    }
}

function cargarHorasDisponibles(horaSeleccionada = null) {
    const select = document.getElementById('cita-hora');
    const horas = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];
    
    select.innerHTML = '<option value="">Seleccionar hora</option>' +
        horas.map(h => `<option value="${h}" ${horaSeleccionada === h ? 'selected' : ''}>${h}</option>`).join('');
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES');
}

function getEstadoTexto(estado) {
    const estados = {
        'pendiente': 'Pendiente',
        'confirmada': 'Confirmada',
        'completada': 'Completada',
        'cancelada': 'Cancelada'
    };
    return estados[estado] || estado;
}

function cerrarModal() {
    document.getElementById('cita-modal').style.display = 'none';
    document.getElementById('cita-ver-modal').style.display = 'none';
}

function setupModalClose() {
    const modal = document.getElementById('cita-modal');
    if (modal) {
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
        modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    }
    
    const verModal = document.getElementById('cita-ver-modal');
    if (verModal) {
        const closeBtn = verModal.querySelector('.modal-close');
        if (closeBtn) closeBtn.onclick = () => verModal.style.display = 'none';
        verModal.onclick = (e) => { if (e.target === verModal) verModal.style.display = 'none'; };
    }
}

function editarDesdeVer() {
    cerrarModal('cita-ver-modal');
    if (window.currentCitaId) {
        editarCita(window.currentCitaId);
    }
}

async function cancelarDesdeVer() {
    if (confirm('¿Cancelar esta cita?')) {
        await cancelarCita(window.currentCitaId);
        cerrarModal('cita-ver-modal');
    }
}

async function cancelarCita(id) {
    const index = citas.findIndex(c => c.id === id);
    if (index !== -1) {
        citas[index].estado = 'cancelada';
        await guardarCitas();
        renderizarVista();
        window.app?.mostrarNotificacion('Cita cancelada', 'warning');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// EVENTOS
// ============================================

function setupEventListeners() {
    document.getElementById('btn-nueva-cita')?.addEventListener('click', nuevaCita);
    document.getElementById('cancelar-modal')?.addEventListener('click', cerrarModal);
    document.getElementById('cita-form')?.addEventListener('submit', guardarCita);
    document.getElementById('cerrar-ver-modal')?.addEventListener('click', () => cerrarModal('cita-ver-modal'));
    document.getElementById('editar-ver-modal')?.addEventListener('click', editarDesdeVer);
    document.getElementById('cancelar-ver-modal')?.addEventListener('click', cancelarDesdeVer);
    
    // Cambio de servicio para actualizar precio
    document.getElementById('cita-servicio')?.addEventListener('change', (e) => {
        const option = e.target.options[e.target.selectedIndex];
        const precio = option?.dataset?.precio || 0;
        document.getElementById('cita-precio').value = precio ? `$${precio}` : '';
    });
    
    // Vista toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentView = btn.dataset.view;
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderizarVista();
        });
    });
    
    // Filtros de fecha
    document.querySelectorAll('.filtro-fecha-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFiltros.fecha = btn.dataset.fecha;
            document.querySelectorAll('.filtro-fecha-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderizarVista();
        });
    });
    
    document.getElementById('fecha-personalizada')?.addEventListener('change', (e) => {
        currentFiltros.fecha = 'personalizada';
        currentFechaInicio = new Date(e.target.value);
        renderizarVista();
    });
    
    document.getElementById('filtro-barbero')?.addEventListener('change', (e) => {
        currentFiltros.barbero = e.target.value;
        renderizarVista();
    });
    
    document.getElementById('filtro-estado')?.addEventListener('change', (e) => {
        currentFiltros.estado = e.target.value;
        renderizarVista();
    });
    
    // Navegación calendario
    document.getElementById('semana-anterior')?.addEventListener('click', () => {
        currentFechaInicio.setDate(currentFechaInicio.getDate() - 7);
        renderizarCalendario();
    });
    
    document.getElementById('semana-siguiente')?.addEventListener('click', () => {
        currentFechaInicio.setDate(currentFechaInicio.getDate() + 7);
        renderizarCalendario();
    });
    
    // Paginación lista
    document.getElementById('prev-page-lista')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderizarLista();
        }
    });
    
    document.getElementById('next-page-lista')?.addEventListener('click', () => {
        const totalPages = Math.ceil(filtrarCitas().length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderizarLista();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModal();
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
