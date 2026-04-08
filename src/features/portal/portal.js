// src/features/portal/portal.js

console.log('🚪 Portal Cliente cargado');

let servicios = [];
let barberos = [];
let citas = [];
let clienteActual = null;
let seleccion = {
    servicioId: null,
    barberoId: null,
    fecha: null,
    hora: null
};

// Inicializar
async function init() {
    console.log('🚪 Inicializando Portal Cliente...');
    await cargarDatos();
    setupEventListeners();
    cargarServicios();
    cargarCitasCliente();
}

// Cargar datos
async function cargarDatos() {
    try {
        servicios = await window.storage?.obtenerTodos('servicios') || getServiciosEjemplo();
        barberos = await window.storage?.obtenerTodos('barberos') || getBarberosEjemplo();
        citas = await window.storage?.obtenerTodos('citas') || [];
        
        // Cargar cliente de localStorage
        const clienteGuardado = localStorage.getItem('barberhub_cliente');
        if (clienteGuardado) {
            clienteActual = JSON.parse(clienteGuardado);
            cargarPerfil();
        }
    } catch (error) {
        console.error('Error cargando datos:', error);
        servicios = getServiciosEjemplo();
        barberos = getBarberosEjemplo();
    }
}

// Datos de ejemplo
function getServiciosEjemplo() {
    return [
        { id: 1, nombre: 'Corte de Cabello', precio: 350, duracion: 30, icono: '✂️' },
        { id: 2, nombre: 'Barba', precio: 200, duracion: 20, icono: '🧔' },
        { id: 3, nombre: 'Corte + Barba', precio: 500, duracion: 50, icono: '✨' },
        { id: 4, nombre: 'Coloración', precio: 800, duracion: 90, icono: '🎨' }
    ];
}

function getBarberosEjemplo() {
    return [
        { id: 1, nombre: 'Carlos Martínez', especialidad: 'Corte', estado: 'activo' },
        { id: 2, nombre: 'Miguel Rodríguez', especialidad: 'Barba', estado: 'activo' },
        { id: 3, nombre: 'Juan Pérez', especialidad: 'Todo', estado: 'activo' }
    ];
}

// Configurar eventos
function setupEventListeners() {
    // Navegación entre páginas
    document.querySelectorAll('.portal-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const pagina = btn.dataset.pagina;
            cambiarPagina(pagina);
        });
    });
    
    // Formulario de agendar cita
    document.getElementById('cliente-form-agendar')?.addEventListener('submit', confirmarCita);
    
    // Editar perfil
    document.getElementById('editar-perfil-btn')?.addEventListener('click', () => {
        const inputs = document.querySelectorAll('#perfil-form input');
        inputs.forEach(input => input.removeAttribute('readonly'));
        document.getElementById('editar-perfil-btn').style.display = 'none';
        document.getElementById('guardar-perfil-btn').style.display = 'block';
    });
    
    document.getElementById('perfil-form')?.addEventListener('submit', guardarPerfil);
    
    // Tabs de mis citas
    document.querySelectorAll('.citas-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            document.querySelectorAll('.citas-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            if (tabName === 'proximas') {
                document.getElementById('citas-proximas').style.display = 'block';
                document.getElementById('citas-historial').style.display = 'none';
                cargarCitasCliente('proximas');
            } else {
                document.getElementById('citas-proximas').style.display = 'none';
                document.getElementById('citas-historial').style.display = 'block';
                cargarCitasCliente('historial');
            }
        });
    });
    
    // Modal cancelar
    document.getElementById('cancelar-cerrar')?.addEventListener('click', () => {
        document.getElementById('cancelar-modal').style.display = 'none';
    });
}

// Cambiar página
function cambiarPagina(pagina) {
    document.querySelectorAll('.portal-nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.pagina === pagina) btn.classList.add('active');
    });
    
    document.querySelectorAll('.portal-pagina').forEach(p => p.style.display = 'none');
    document.getElementById(`pagina-${pagina}`).style.display = 'block';
    
    if (pagina === 'mis-citas') {
        cargarCitasCliente();
    } else if (pagina === 'mi-perfil') {
        cargarPerfil();
    }
}

// Cargar servicios
function cargarServicios() {
    const grid = document.getElementById('servicios-grid');
    if (!grid) return;
    
    grid.innerHTML = servicios.map(servicio => `
        <div class="servicio-card" onclick="seleccionarServicio(${servicio.id})" data-id="${servicio.id}">
            <div class="servicio-icon">${servicio.icono || '✂️'}</div>
            <div class="servicio-nombre">${servicio.nombre}</div>
            <div class="servicio-precio">$${servicio.precio}</div>
            <div class="servicio-duracion">⏱️ ${servicio.duracion} min</div>
        </div>
    `).join('');
}

// Seleccionar servicio
window.seleccionarServicio = function(id) {
    seleccion.servicioId = id;
    
    // Marcar como seleccionado
    document.querySelectorAll('.servicio-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.id == id) card.classList.add('selected');
    });
    
    // Mostrar paso 2 y cargar barberos
    document.getElementById('paso-barbero').style.display = 'block';
    cargarBarberos();
};

// Cargar barberos
function cargarBarberos() {
    const grid = document.getElementById('barberos-grid');
    if (!grid) return;
    
    const barberosActivos = barberos.filter(b => b.estado === 'activo');
    grid.innerHTML = barberosActivos.map(barbero => `
        <div class="barbero-card-portal" onclick="seleccionarBarbero(${barbero.id})" data-id="${barbero.id}">
            <div class="barbero-avatar">👨‍🦱</div>
            <div class="barbero-nombre-portal">${barbero.nombre}</div>
            <div class="barbero-especialidad-portal">${barbero.especialidad}</div>
        </div>
    `).join('');
}

// Seleccionar barbero
window.seleccionarBarbero = function(id) {
    seleccion.barberoId = id;
    
    document.querySelectorAll('.barbero-card-portal').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.id == id) card.classList.add('selected');
    });
    
    document.getElementById('paso-fecha').style.display = 'block';
    cargarFechasDisponibles();
};

// Cargar fechas disponibles
function cargarFechasDisponibles() {
    const fechasGrid = document.getElementById('fechas-grid');
    if (!fechasGrid) return;
    
    const fechas = [];
    const hoy = new Date();
    
    for (let i = 0; i < 14; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + i);
        fechas.push(fecha);
    }
    
    fechasGrid.innerHTML = fechas.map(fecha => `
        <div class="fecha-card" onclick="seleccionarFecha('${fecha.toISOString().split('T')[0]}')" data-fecha="${fecha.toISOString().split('T')[0]}">
            <div class="fecha-dia">${fecha.getDate()}</div>
            <div class="fecha-nombre">${getNombreDia(fecha.getDay())}</div>
        </div>
    `).join('');
}

// Seleccionar fecha
window.seleccionarFecha = function(fecha) {
    seleccion.fecha = fecha;
    
    document.querySelectorAll('.fecha-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.fecha === fecha) card.classList.add('selected');
    });
    
    cargarHorasDisponibles();
};

// Cargar horas disponibles
function cargarHorasDisponibles() {
    const horasGrid = document.getElementById('horas-grid');
    if (!horasGrid) return;
    
    const horas = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    
    // Obtener horas ocupadas
    const citasOcupadas = citas.filter(c => 
        c.fecha === seleccion.fecha && 
        c.barberoId === seleccion.barberoId &&
        c.estado !== 'cancelada'
    ).map(c => c.hora);
    
    horasGrid.innerHTML = horas.map(hora => `
        <div class="hora-card ${citasOcupadas.includes(hora) ? 'disabled' : ''}" 
             onclick="${!citasOcupadas.includes(hora) ? `seleccionarHora('${hora}')` : ''}"
             data-hora="${hora}">
            ${hora}
        </div>
    `).join('');
}

// Seleccionar hora
window.seleccionarHora = function(hora) {
    seleccion.hora = hora;
    
    document.querySelectorAll('.hora-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.hora === hora) card.classList.add('selected');
    });
    
    document.getElementById('paso-cliente').style.display = 'block';
    
    // Si ya hay cliente logueado, llenar datos
    if (clienteActual) {
        document.getElementById('cliente-nombre-agendar').value = clienteActual.nombre;
        document.getElementById('cliente-telefono-agendar').value = clienteActual.telefono;
        document.getElementById('cliente-email-agendar').value = clienteActual.email || '';
    }
};

// Confirmar cita
async function confirmarCita(event) {
    event.preventDefault();
    
    const servicio = servicios.find(s => s.id === seleccion.servicioId);
    const barbero = barberos.find(b => b.id === seleccion.barberoId);
    const nombre = document.getElementById('cliente-nombre-agendar').value;
    const telefono = document.getElementById('cliente-telefono-agendar').value;
    const email = document.getElementById('cliente-email-agendar').value;
    const notas = document.getElementById('cita-notas-agendar').value;
    
    if (!nombre || !telefono) {
        alert('Por favor completa tu nombre y teléfono');
        return;
    }
    
    // Crear o actualizar cliente
    let clienteId = clienteActual?.id;
    if (!clienteId) {
        const nuevoCliente = {
            id: Date.now(),
            nombre: nombre,
            telefono: telefono,
            email: email,
            visitas: 0,
            estado: 'activo'
        };
        await window.storage?.guardar('clientes', nuevoCliente);
        clienteId = nuevoCliente.id;
        clienteActual = nuevoCliente;
        localStorage.setItem('barberhub_cliente', JSON.stringify(clienteActual));
    }
    
    // Crear cita
    const nuevaCita = {
        id: Date.now(),
        clienteId: clienteId,
        clienteNombre: nombre,
        barberoId: seleccion.barberoId,
        barberoNombre: barbero.nombre,
        servicioId: seleccion.servicioId,
        servicioNombre: servicio.nombre,
        precio: servicio.precio,
        fecha: seleccion.fecha,
        hora: seleccion.hora,
        estado: 'pendiente',
        notas: notas,
        creadaPortal: true
    };
    
    await window.storage?.guardar('citas', nuevaCita);
    citas.push(nuevaCita);
    
    window.utils?.mostrarNotificacion('✅ Cita agendada con éxito', 'success');
    
    // Resetear selección
    seleccion = { servicioId: null, barberoId: null, fecha: null, hora: null };
    
    // Limpiar formulario
    document.getElementById('cliente-form-agendar').reset();
    document.querySelectorAll('.servicio-card, .barbero-card-portal, .fecha-card, .hora-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('paso-barbero').style.display = 'none';
    document.getElementById('paso-fecha').style.display = 'none';
    document.getElementById('paso-cliente').style.display = 'none';
}

// Cargar citas del cliente
async function cargarCitasCliente(tipo = 'proximas') {
    if (!clienteActual) return;
    
    const todasCitas = await window.storage?.obtenerTodos('citas') || [];
    const misCitas = todasCitas.filter(c => c.clienteId === clienteActual.id);
    
    const hoy = new Date().toISOString().split('T')[0];
    const proximas = misCitas.filter(c => c.fecha >= hoy && c.estado !== 'cancelada').sort((a, b) => a.fecha.localeCompare(b.fecha));
    const historial = misCitas.filter(c => c.fecha < hoy || c.estado === 'cancelada').sort((a, b) => b.fecha.localeCompare(a.fecha));
    
    const container = tipo === 'proximas' ? document.getElementById('citas-proximas') : document.getElementById('citas-historial');
    const citasMostrar = tipo === 'proximas' ? proximas : historial;
    
    if (citasMostrar.length === 0) {
        container.innerHTML = '<div class="loading-spinner">No tienes citas</div>';
        return;
    }
    
    container.innerHTML = citasMostrar.map(cita => `
        <div class="cita-card">
            <div class="cita-info">
                <div class="cita-fecha">📅 ${formatFecha(cita.fecha)} - ${cita.hora}</div>
                <div class="cita-servicio">✂️ ${cita.servicioNombre}</div>
                <div class="cita-barbero">💈 ${cita.barberoNombre}</div>
                <div class="cita-estado estado-badge estado-${cita.estado}">${getEstadoTexto(cita.estado)}</div>
            </div>
            ${cita.estado !== 'cancelada' && cita.fecha >= hoy ? `
                <div class="cita-acciones">
                    <button class="btn-cancelar" onclick="cancelarCitaPortal(${cita.id})">Cancelar</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Cancelar cita desde portal
window.cancelarCitaPortal = function(id) {
    window.currentCancelId = id;
    document.getElementById('cancelar-modal').style.display = 'flex';
    
    document.getElementById('confirmar-cancelar').onclick = async () => {
        const citasAll = await window.storage?.obtenerTodos('citas') || [];
        const index = citasAll.findIndex(c => c.id === id);
        if (index !== -1) {
            citasAll[index].estado = 'cancelada';
            await window.storage?.guardar('citas', citasAll[index]);
            window.utils?.mostrarNotificacion('Cita cancelada', 'warning');
            cargarCitasCliente();
        }
        document.getElementById('cancelar-modal').style.display = 'none';
    };
};

// Cargar perfil
function cargarPerfil() {
    if (!clienteActual) return;
    
    document.getElementById('perfil-nombre').value = clienteActual.nombre;
    document.getElementById('perfil-telefono').value = clienteActual.telefono;
    document.getElementById('perfil-email').value = clienteActual.email || '';
    document.getElementById('avatar-placeholder').textContent = clienteActual.nombre.charAt(0);
}

// Guardar perfil
async function guardarPerfil(event) {
    event.preventDefault();
    
    clienteActual.nombre = document.getElementById('perfil-nombre').value;
    clienteActual.telefono = document.getElementById('perfil-telefono').value;
    clienteActual.email = document.getElementById('perfil-email').value;
    
    await window.storage?.guardar('clientes', clienteActual);
    localStorage.setItem('barberhub_cliente', JSON.stringify(clienteActual));
    
    document.querySelectorAll('#perfil-form input').forEach(input => input.setAttribute('readonly', true));
    document.getElementById('editar-perfil-btn').style.display = 'block';
    document.getElementById('guardar-perfil-btn').style.display = 'none';
    
    window.utils?.mostrarNotificacion('Perfil actualizado', 'success');
}

// Funciones auxiliares
function getNombreDia(dia) {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dias[dia];
}

function formatFecha(fecha) {
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

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export { init };
