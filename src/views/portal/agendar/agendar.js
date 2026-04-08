// src/views/portal/agendar/agendar.js

console.log('📅 Portal - Agendar Cita');

// Estado local de la vista
let estado = {
    paso: 1,
    servicioSeleccionado: null,
    barberoSeleccionado: null,
    fechaSeleccionada: null,
    horaSeleccionada: null,
    servicios: [],
    barberos: [],
    fechasDisponibles: []
};

// ============================================
// INICIALIZACIÓN
// ============================================

async function init() {
    console.log('🚀 Inicializando agendar cita...');
    
    await cargarDatos();
    renderizarServicios();
    setupEventListeners();
}

async function cargarDatos() {
    // Obtener datos del caché global
    if (window.app && window.app.estado) {
        estado.servicios = window.app.estado.cache.servicios || [];
        estado.barberos = window.app.estado.cache.barberos || [];
    }
    
    // Si no hay datos, cargar de storage
    if (estado.servicios.length === 0) {
        estado.servicios = await window.storage?.obtenerTodos('servicios') || [];
    }
    if (estado.barberos.length === 0) {
        estado.barberos = await window.storage?.obtenerTodos('barberos') || [];
    }
    
    console.log(`📦 Datos cargados: ${estado.servicios.length} servicios, ${estado.barberos.length} barberos`);
}

// ============================================
// RENDERIZADO
// ============================================

function renderizarServicios() {
    const grid = document.getElementById('servicios-grid');
    if (!grid) return;
    
    if (estado.servicios.length === 0) {
        grid.innerHTML = '<div class="loading-spinner">No hay servicios disponibles</div>';
        return;
    }
    
    grid.innerHTML = estado.servicios.map(servicio => `
        <div class="servicio-card" data-id="${servicio.id}">
            <div class="servicio-icono">${servicio.icono || '✂️'}</div>
            <div class="servicio-nombre">${servicio.nombre}</div>
            <div class="servicio-precio">$${servicio.precio.toLocaleString()}</div>
            <div class="servicio-duracion">⏱️ ${servicio.duracion} min</div>
        </div>
    `).join('');
    
    // Agregar event listeners
    document.querySelectorAll('.servicio-card').forEach(card => {
        card.addEventListener('click', () => seleccionarServicio(parseInt(card.dataset.id)));
    });
}

function renderizarBarberos() {
    const grid = document.getElementById('barberos-grid');
    if (!grid) return;
    
    const barberosActivos = estado.barberos.filter(b => b.estado === 'activo');
    
    if (barberosActivos.length === 0) {
        grid.innerHTML = '<div class="loading-spinner">No hay barberos disponibles</div>';
        return;
    }
    
    grid.innerHTML = barberosActivos.map(barbero => `
        <div class="barbero-card" data-id="${barbero.id}">
            <div class="barbero-avatar">${barbero.nombre.charAt(0)}</div>
            <div class="barbero-nombre">${barbero.nombre}</div>
            <div class="barbero-especialidad">${barbero.especialidad}</div>
        </div>
    `).join('');
    
    document.querySelectorAll('.barbero-card').forEach(card => {
        card.addEventListener('click', () => seleccionarBarbero(parseInt(card.dataset.id)));
    });
}

function renderizarFechas() {
    const grid = document.getElementById('fechas-grid');
    if (!grid) return;
    
    // Generar próximos 14 días
    const fechas = [];
    const hoy = new Date();
    
    for (let i = 0; i < 14; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + i);
        fechas.push(fecha);
    }
    
    grid.innerHTML = fechas.map(fecha => `
        <div class="fecha-card" data-fecha="${fecha.toISOString().split('T')[0]}">
            <div class="fecha-dia">${fecha.getDate()}</div>
            <div class="fecha-nombre">${getNombreDia(fecha.getDay())}</div>
        </div>
    `).join('');
    
    document.querySelectorAll('.fecha-card').forEach(card => {
        card.addEventListener('click', () => seleccionarFecha(card.dataset.fecha));
    });
}

function renderizarHoras() {
    const grid = document.getElementById('horas-grid');
    if (!grid) return;
    
    const horas = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    
    // Obtener citas ocupadas (simulado - luego con datos reales)
    const citasOcupadas = [];
    
    grid.innerHTML = horas.map(hora => `
        <div class="hora-card ${citasOcupadas.includes(hora) ? 'disabled' : ''}" data-hora="${hora}">
            ${hora}
        </div>
    `).join('');
    
    document.querySelectorAll('.hora-card:not(.disabled)').forEach(card => {
        card.addEventListener('click', () => seleccionarHora(card.dataset.hora));
    });
}

function actualizarResumen() {
    const servicio = estado.servicios.find(s => s.id === estado.servicioSeleccionado);
    const barbero = estado.barberos.find(b => b.id === estado.barberoSeleccionado);
    
    document.getElementById('resumen-servicio').textContent = servicio?.nombre || '-';
    document.getElementById('resumen-barbero').textContent = barbero?.nombre || '-';
    document.getElementById('resumen-fecha').textContent = estado.fechaSeleccionada && estado.horaSeleccionada 
        ? `${formatearFecha(estado.fechaSeleccionada)} - ${estado.horaSeleccionada}`
        : '-';
    document.getElementById('resumen-total').textContent = servicio ? `$${servicio.precio.toLocaleString()}` : '$0';
}

// ============================================
// SELECCIONES
// ============================================

function seleccionarServicio(id) {
    estado.servicioSeleccionado = id;
    
    // Marcar como seleccionado
    document.querySelectorAll('.servicio-card').forEach(card => {
        card.classList.toggle('selected', parseInt(card.dataset.id) === id);
    });
    
    // Avanzar al paso 2
    avanzarPaso();
}

function seleccionarBarbero(id) {
    estado.barberoSeleccionado = id;
    
    document.querySelectorAll('.barbero-card').forEach(card => {
        card.classList.toggle('selected', parseInt(card.dataset.id) === id);
    });
    
    avanzarPaso();
}

function seleccionarFecha(fecha) {
    estado.fechaSeleccionada = fecha;
    
    document.querySelectorAll('.fecha-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.fecha === fecha);
    });
    
    renderizarHoras();
}

function seleccionarHora(hora) {
    estado.horaSeleccionada = hora;
    
    document.querySelectorAll('.hora-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.hora === hora);
    });
    
    avanzarPaso();
}

// ============================================
// NAVEGACIÓN DE PASOS
// ============================================

function avanzarPaso() {
    if (estado.paso === 1 && estado.servicioSeleccionado) {
        estado.paso = 2;
        cambiarPaso();
        renderizarBarberos();
    } else if (estado.paso === 2 && estado.barberoSeleccionado) {
        estado.paso = 3;
        cambiarPaso();
        renderizarFechas();
    } else if (estado.paso === 3 && estado.fechaSeleccionada && estado.horaSeleccionada) {
        estado.paso = 4;
        cambiarPaso();
        actualizarResumen();
    }
}

function retrocederPaso() {
    if (estado.paso > 1) {
        estado.paso--;
        cambiarPaso();
    }
}

function cambiarPaso() {
    // Ocultar todos los pasos
    for (let i = 1; i <= 4; i++) {
        const pasoDiv = document.getElementById(`paso-${i}`);
        if (pasoDiv) pasoDiv.style.display = 'none';
    }
    
    // Mostrar paso actual
    const pasoActual = document.getElementById(`paso-${estado.paso}`);
    if (pasoActual) pasoActual.style.display = 'block';
    
    // Actualizar indicador de pasos
    document.querySelectorAll('.paso').forEach((paso, index) => {
        const pasoNum = index + 1;
        paso.classList.remove('active', 'completado');
        if (pasoNum < estado.paso) {
            paso.classList.add('completado');
        } else if (pasoNum === estado.paso) {
            paso.classList.add('active');
        }
    });
    
    // Mostrar/ocultar botones
    const btnAnterior = document.getElementById('btn-anterior');
    const btnSiguiente = document.getElementById('btn-siguiente');
    
    if (btnAnterior) {
        btnAnterior.style.display = estado.paso > 1 ? 'block' : 'none';
    }
    
    if (btnSiguiente) {
        if (estado.paso === 4) {
            btnSiguiente.style.display = 'none';
        } else {
            btnSiguiente.style.display = 'block';
            btnSiguiente.textContent = 'Siguiente ▶';
        }
    }
}

// ============================================
// GUARDAR CITA
// ============================================

async function guardarCita(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('cliente-nombre').value;
    const telefono = document.getElementById('cliente-telefono').value;
    const email = document.getElementById('cliente-email').value;
    const notas = document.getElementById('cita-notas').value;
    
    if (!nombre || !telefono) {
        window.app?.mostrarNotificacion('Por favor completa nombre y teléfono', 'warning');
        return;
    }
    
    const servicio = estado.servicios.find(s => s.id === estado.servicioSeleccionado);
    const barbero = estado.barberos.find(b => b.id === estado.barberoSeleccionado);
    
    const nuevaCita = {
        id: Date.now(),
        clienteNombre: nombre,
        clienteTelefono: telefono,
        clienteEmail: email,
        barberoId: estado.barberoSeleccionado,
        barberoNombre: barbero?.nombre,
        servicioId: estado.servicioSeleccionado,
        servicioNombre: servicio?.nombre,
        precio: servicio?.precio,
        fecha: estado.fechaSeleccionada,
        hora: estado.horaSeleccionada,
        notas: notas,
        estado: 'pendiente',
        fechaCreacion: new Date().toISOString()
    };
    
    // Guardar en storage
    await window.storage?.guardar('citas', nuevaCita);
    
    // Mostrar modal de confirmación
    mostrarModalConfirmacion(nuevaCita);
    
    // Limpiar selección
    reiniciarSeleccion();
}

function mostrarModalConfirmacion(cita) {
    const modal = document.getElementById('confirmacion-modal');
    const detalle = document.getElementById('confirmacion-detalle');
    
    detalle.innerHTML = `
        <div><strong>Servicio:</strong> ${cita.servicioNombre}</div>
        <div><strong>Barbero:</strong> ${cita.barberoNombre}</div>
        <div><strong>Fecha:</strong> ${formatearFecha(cita.fecha)}</div>
        <div><strong>Hora:</strong> ${cita.hora}</div>
        <div><strong>Total:</strong> $${cita.precio.toLocaleString()}</div>
    `;
    
    modal.style.display = 'flex';
    
    const closeBtn = modal.querySelector('.modal-close');
    const aceptarBtn = document.getElementById('cerrar-modal-btn');
    
    closeBtn.onclick = () => modal.style.display = 'none';
    aceptarBtn.onclick = () => {
        modal.style.display = 'none';
        // Redirigir a mis citas o mantener en agendar
    };
}

function reiniciarSeleccion() {
    estado = {
        paso: 1,
        servicioSeleccionado: null,
        barberoSeleccionado: null,
        fechaSeleccionada: null,
        horaSeleccionada: null,
        servicios: estado.servicios,
        barberos: estado.barberos,
        fechasDisponibles: []
    };
    
    cambiarPaso();
    document.getElementById('cliente-form')?.reset();
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function getNombreDia(dia) {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dias[dia];
}

function formatearFecha(fecha) {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

function setupEventListeners() {
    const btnSiguiente = document.getElementById('btn-siguiente');
    const btnAnterior = document.getElementById('btn-anterior');
    const form = document.getElementById('cliente-form');
    
    if (btnSiguiente) {
        btnSiguiente.onclick = () => {
            if (estado.paso === 1 && !estado.servicioSeleccionado) {
                window.app?.mostrarNotificacion('Selecciona un servicio', 'warning');
            } else if (estado.paso === 2 && !estado.barberoSeleccionado) {
                window.app?.mostrarNotificacion('Selecciona un barbero', 'warning');
            } else if (estado.paso === 3 && (!estado.fechaSeleccionada || !estado.horaSeleccionada)) {
                window.app?.mostrarNotificacion('Selecciona fecha y hora', 'warning');
            } else {
                avanzarPaso();
            }
        };
    }
    
    if (btnAnterior) {
        btnAnterior.onclick = () => retrocederPaso();
    }
    
    if (form) {
        form.onsubmit = guardarCita;
    }
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
