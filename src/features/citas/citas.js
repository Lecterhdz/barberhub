// src/features/citas/citas.js

console.log('📅 Citas feature cargado');

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

// Inicializar
async function init() {
    console.log('📅 Inicializando gestión de citas...');
    await cargarDatos();
    setupEventListeners();
    renderizarVista();
    setupModalClose();  // ✅ AGREGAR ESTA LÍNEA
}

// Cargar todos los datos necesarios
async function cargarDatos() {
    try {
        citas = await window.storage?.obtenerTodos('citas') || getCitasEjemplo();
        clientes = await window.storage?.obtenerTodos('clientes') || [];
        barberos = await window.storage?.obtenerTodos('barberos') || [];
        servicios = await window.storage?.obtenerTodos('servicios') || getServiciosEjemplo();
        
        if (clientes.length === 0) {
            clientes = getClientesEjemplo();
        }
        if (barberos.length === 0) {
            barberos = getBarberosEjemplo();
        }
        
        await cargarSelectores();
    } catch (error) {
        console.error('Error cargando datos:', error);
        citas = getCitasEjemplo();
        clientes = getClientesEjemplo();
        barberos = getBarberosEjemplo();
        servicios = getServiciosEjemplo();
    }
}

// Datos de ejemplo
function getCitasEjemplo() {
    const hoy = new Date();
    const mañana = new Date(hoy);
    mañana.setDate(hoy.getDate() + 1);
    
    return [
        { id: 1, clienteId: 1, clienteNombre: 'Carlos López', barberoId: 1, barberoNombre: 'Carlos M.', servicioId: 1, servicioNombre: 'Corte de Cabello', precio: 350, fecha: hoy.toISOString().split('T')[0], hora: '10:00', estado: 'confirmada', notas: '' },
        { id: 2, clienteId: 2, clienteNombre: 'Miguel Ángel', barberoId: 2, barberoNombre: 'Miguel R.', servicioId: 2, servicioNombre: 'Barba', precio: 200, fecha: hoy.toISOString().split('T')[0], hora: '11:30', estado: 'pendiente', notas: '' },
        { id: 3, clienteId: 3, clienteNombre: 'Juan Pérez', barberoId: 3, barberoNombre: 'Juan P.', servicioId: 3, servicioNombre: 'Corte + Barba', precio: 500, fecha: hoy.toISOString().split('T')[0], hora: '14:00', estado: 'confirmada', notas: '' },
        { id: 4, clienteId: 4, clienteNombre: 'Roberto Gómez', barberoId: 1, barberoNombre: 'Carlos M.', servicioId: 1, servicioNombre: 'Corte de Cabello', precio: 350, fecha: mañana.toISOString().split('T')[0], hora: '09:00', estado: 'pendiente', notas: '' }
    ];
}

function getClientesEjemplo() {
    return [
        { id: 1, nombre: 'Carlos López', telefono: '555-1234' },
        { id: 2, nombre: 'Miguel Ángel', telefono: '555-5678' },
        { id: 3, nombre: 'Juan Pérez', telefono: '555-9012' },
        { id: 4, nombre: 'Roberto Gómez', telefono: '555-3456' }
    ];
}

function getBarberosEjemplo() {
    return [
        { id: 1, nombre: 'Carlos Martínez', especialidad: 'Corte' },
        { id: 2, nombre: 'Miguel Rodríguez', especialidad: 'Barba' },
        { id: 3, nombre: 'Juan Pérez', especialidad: 'Todo' }
    ];
}

function getServiciosEjemplo() {
    return [
        { id: 1, nombre: 'Corte de Cabello', precio: 350, duracion: 30 },
        { id: 2, nombre: 'Barba', precio: 200, duracion: 20 },
        { id: 3, nombre: 'Corte + Barba', precio: 500, duracion: 50 },
        { id: 4, nombre: 'Coloración', precio: 800, duracion: 90 }
    ];
}

// Cargar selectores
async function cargarSelectores() {
    const clienteSelect = document.getElementById('cita-cliente');
    const barberoSelect = document.getElementById('cita-barbero');
    const servicioSelect = document.getElementById('cita-servicio');
    const filtroBarbero = document.getElementById('filtro-barbero');
    
    if (clienteSelect) {
        clienteSelect.innerHTML = '<option value="">Seleccionar cliente</option>' +
            clientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    }
    
    if (barberoSelect) {
        barberoSelect.innerHTML = '<option value="">Seleccionar barbero</option>' +
            barberos.filter(b => b.estado === 'activo').map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');
    }
    
    if (servicioSelect) {
        servicioSelect.innerHTML = '<option value="">Seleccionar servicio</option>' +
            servicios.map(s => `<option value="${s.id}">${s.nombre} - $${s.precio}</option>`).join('');
    }
    
    if (filtroBarbero) {
        filtroBarbero.innerHTML = '<option value="todos">Todos los barberos</option>' +
            barberos.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');
    }
}

// Configurar eventos
function setupEventListeners() {
    document.getElementById('btn-nueva-cita')?.addEventListener('click', nuevaCita);
    document.getElementById('cancelar-modal')?.addEventListener('click', cerrarModal);
    document.getElementById('cita-form')?.addEventListener('submit', guardarCita);
    document.getElementById('cerrar-ver-modal')?.addEventListener('click', () => cerrarModal('cita-ver-modal'));
    document.getElementById('editar-desde-ver')?.addEventListener('click', editarDesdeVer);
    
    // Cambio de servicio para actualizar precio
    document.getElementById('cita-servicio')?.addEventListener('change', (e) => {
        const servicio = servicios.find(s => s.id == e.target.value);
        if (servicio) {
            document.getElementById('cita-precio').value = `$${servicio.precio}`;
        }
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
    
    // Cerrar modales con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModal();
        }
    });
}
function setupModalClose() {
    // Modal de cita
    const modal = document.getElementById('cita-modal');
    if (modal) {
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }
        // Cerrar al hacer clic fuera
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
    }
    
    // Modal de ver cita
    const verModal = document.getElementById('cita-ver-modal');
    if (verModal) {
        const closeBtn = verModal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                verModal.style.display = 'none';
            };
        }
        verModal.onclick = (e) => {
            if (e.target === verModal) {
                verModal.style.display = 'none';
            }
        };
    }
}
// Renderizar vista según currentView
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

// Renderizar calendario
function renderizarCalendario() {
    const grid = document.getElementById('calendario-grid');
    if (!grid) return;
    
    const inicioSemana = new Date(currentFechaInicio);
    inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay() + 1);
    
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const hoy = new Date().toDateString();
    
    let html = '';
    for (let i = 0; i < 7; i++) {
        const fecha = new Date(inicioSemana);
        fecha.setDate(inicioSemana.getDate() + i);
        const fechaStr = fecha.toISOString().split('T')[0];
        const citasDelDia = filtrarCitas().filter(c => c.fecha === fechaStr);
        
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
                            <div class="cita-cliente-calendario">${cita.clienteNombre}</div>
                            <div class="cita-servicio-calendario">${cita.servicioNombre}</div>
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

// Filtrar citas
function filtrarCitas() {
    let filtered = [...citas];
    
    if (currentFiltros.fecha === 'hoy') {
        const hoy = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(c => c.fecha === hoy);
    } else if (currentFiltros.fecha === 'manana') {
        const mañana = new Date();
        mañana.setDate(mañana.getDate() + 1);
        filtered = filtered.filter(c => c.fecha === mañana.toISOString().split('T')[0]);
    } else if (currentFiltros.fecha === 'semana') {
        const hoy = new Date();
        const finSemana = new Date();
        finSemana.setDate(hoy.getDate() + 7);
        filtered = filtered.filter(c => c.fecha >= hoy.toISOString().split('T')[0] && c.fecha <= finSemana.toISOString().split('T')[0]);
    } else if (currentFiltros.fecha === 'personalizada' && currentFechaInicio) {
        filtered = filtered.filter(c => c.fecha === currentFechaInicio.toISOString().split('T')[0]);
    }
    
    if (currentFiltros.barbero !== 'todos') {
        filtered = filtered.filter(c => c.barberoId == currentFiltros.barbero);
    }
    
    if (currentFiltros.estado !== 'todos') {
        filtered = filtered.filter(c => c.estado === currentFiltros.estado);
    }
    
    return filtered.sort((a, b) => a.hora.localeCompare(b.hora));
}

// Renderizar lista
function renderizarLista() {
    const tbody = document.getElementById('citas-table-body');
    if (!tbody) return;
    
    const filtered = filtrarCitas();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    
    if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No hay citas registradas</td></tr>`;
        return;
    }
    
    tbody.innerHTML = paginated.map(cita => `
        <tr onclick="verCita(${cita.id})">
            <td>${formatearFecha(cita.fecha)}</td>
            <td>${cita.hora}</td>
            <td>${cita.clienteNombre}</td>
            <td>${cita.servicioNombre}</td>
            <td>${cita.barberoNombre}</td>
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

// Funciones auxiliares
function formatearFecha(fecha) {
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

// Nueva cita
function nuevaCita() {
    editingId = null;
    document.getElementById('modal-title').textContent = 'Nueva Cita';
    document.getElementById('cita-form').reset();
    document.getElementById('cita-fecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('cita-estado').value = 'pendiente';
    document.getElementById('cita-modal').style.display = 'flex';
    cargarHorasDisponibles();
}

// Ver cita
window.verCita = function(id) {
    const cita = citas.find(c => c.id === id);
    if (!cita) return;
    
    const detalle = document.getElementById('cita-detalle');
    detalle.innerHTML = `
        <div class="cita-detalle-info">
            <div class="info-row">
                <label>📅 Fecha:</label>
                <span>${formatearFecha(cita.fecha)}</span>
            </div>
            <div class="info-row">
                <label>⏰ Hora:</label>
                <span>${cita.hora}</span>
            </div>
            <div class="info-row">
                <label>👤 Cliente:</label>
                <span>${cita.clienteNombre}</span>
            </div>
            <div class="info-row">
                <label>✂️ Servicio:</label>
                <span>${cita.servicioNombre}</span>
            </div>
            <div class="info-row">
                <label>💈 Barbero:</label>
                <span>${cita.barberoNombre}</span>
            </div>
            <div class="info-row">
                <label>💰 Precio:</label>
                <span>$${cita.precio}</span>
            </div>
            <div class="info-row">
                <label>📌 Estado:</label>
                <span class="estado-badge estado-${cita.estado}">${getEstadoTexto(cita.estado)}</span>
            </div>
            ${cita.notas ? `
            <div class="info-row">
                <label>📝 Notas:</label>
                <span>${cita.notas}</span>
            </div>
            ` : ''}
        </div>
    `;
    
    window.currentCitaId = id;
    document.getElementById('cita-ver-modal').style.display = 'flex';
};

// Editar cita
window.editarCita = function(id) {
    const cita = citas.find(c => c.id === id);
    if (!cita) return;
    
    editingId = id;
    document.getElementById('modal-title').textContent = 'Editar Cita';
    document.getElementById('cita-cliente').value = cita.clienteId;
    document.getElementById('cita-barbero').value = cita.barberoId;
    document.getElementById('cita-servicio').value = cita.servicioId;
    document.getElementById('cita-precio').value = `$${cita.precio}`;
    document.getElementById('cita-fecha').value = cita.fecha;
    document.getElementById('cita-estado').value = cita.estado;
    document.getElementById('cita-notas').value = cita.notas || '';
    document.getElementById('cita-modal').style.display = 'flex';
    cargarHorasDisponibles(cita.hora);
};

function editarDesdeVer() {
    cerrarModal('cita-ver-modal');
    if (window.currentCitaId) {
        editarCita(window.currentCitaId);
    }
}

// Eliminar cita
window.eliminarCita = async function(id) {
    const confirmar = await window.utils?.confirmar('¿Eliminar esta cita?');
    if (confirmar) {
        citas = citas.filter(c => c.id !== id);
        await guardarCitas();
        renderizarVista();
        window.utils?.mostrarNotificacion('Cita eliminada', 'success');
    }
};

// Guardar cita
async function guardarCita(event) {
    event.preventDefault();
    
    const clienteId = parseInt(document.getElementById('cita-cliente').value);
    const barberoId = parseInt(document.getElementById('cita-barbero').value);
    const servicioId = parseInt(document.getElementById('cita-servicio').value);
    const cliente = clientes.find(c => c.id === clienteId);
    const barbero = barberos.find(b => b.id === barberoId);
    const servicio = servicios.find(s => s.id === servicioId);
    
    const citaData = {
        clienteId: clienteId,
        clienteNombre: cliente?.nombre || '',
        barberoId: barberoId,
        barberoNombre: barbero?.nombre || '',
        servicioId: servicioId,
        servicioNombre: servicio?.nombre || '',
        precio: servicio?.precio || 0,
        fecha: document.getElementById('cita-fecha').value,
        hora: document.getElementById('cita-hora').value,
        estado: document.getElementById('cita-estado').value,
        notas: document.getElementById('cita-notas').value
    };
    
    if (editingId) {
        const index = citas.findIndex(c => c.id === editingId);
        if (index !== -1) {
            citaData.id = editingId;
            citas[index] = { ...citas[index], ...citaData };
        }
        window.utils?.mostrarNotificacion('Cita actualizada', 'success');
    } else {
        citaData.id = Date.now();
        citas.push(citaData);
        window.utils?.mostrarNotificacion('Cita agregada', 'success');
    }
    
    await guardarCitas();
    renderizarVista();
    cerrarModal();
}

async function guardarCitas() {
    try {
        for (const cita of citas) {
            await window.storage?.guardar('citas', cita);
        }
    } catch (error) {
        console.error('Error guardando citas:', error);
    }
}

function cargarHorasDisponibles(horaSeleccionada = null) {
    const select = document.getElementById('cita-hora');
    const horas = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];
    
    select.innerHTML = '<option value="">Seleccionar hora</option>' +
        horas.map(h => `<option value="${h}" ${horaSeleccionada === h ? 'selected' : ''}>${h}</option>`).join('');
}

function cerrarModal(modalId = 'cita-modal') {
    document.getElementById(modalId).style.display = 'none';
}

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export { init, cargarDatos };
