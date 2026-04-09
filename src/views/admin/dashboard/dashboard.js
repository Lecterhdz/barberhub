// src/views/admin/dashboard/dashboard.js

console.log('📊 Dashboard Admin');

// Chart instance
let revenueChart = null;

// Estado local
let dashboardData = {
    citas: [],
    clientes: [],
    servicios: [],
    barberos: [],
    ventas: []
};

// ============================================
// INICIALIZACIÓN
// ============================================

async function init() {
    console.log('🚀 Inicializando Dashboard Admin...');
    
    await cargarDatos();
    actualizarFecha();
    renderizarStats();
    renderizarCitasHoy();
    renderizarProximasCitas();
    renderizarServiciosPopulares();
    renderizarActividadReciente();
    inicializarGrafico();
    setupEventListeners();
}

async function cargarDatos() {
    // Obtener datos del caché global
    if (window.app && window.app.estado) {
        dashboardData.clientes = window.app.estado.cache.clientes || [];
        dashboardData.citas = window.app.estado.cache.citas || [];
        dashboardData.servicios = window.app.estado.cache.servicios || [];
        dashboardData.barberos = window.app.estado.cache.barberos || [];
        dashboardData.ventas = window.app.estado.cache.ventas || [];
    }
    
    // Si no hay datos, cargar de storage
    if (dashboardData.citas.length === 0) {
        dashboardData.citas = await window.storage?.obtenerTodos('citas') || [];
    }
    if (dashboardData.clientes.length === 0) {
        dashboardData.clientes = await window.storage?.obtenerTodos('clientes') || [];
    }
    if (dashboardData.servicios.length === 0) {
        dashboardData.servicios = await window.storage?.obtenerTodos('servicios') || [];
    }
    
    console.log(`📦 Datos cargados: ${dashboardData.citas.length} citas, ${dashboardData.clientes.length} clientes`);
}

// ============================================
// ESTADÍSTICAS
// ============================================

function renderizarStats() {
    const hoy = new Date().toISOString().split('T')[0];
    const citasHoy = dashboardData.citas.filter(c => c.fecha === hoy);
    const ingresosHoy = citasHoy.reduce((sum, c) => sum + (c.precio || 0), 0);
    const barberosActivos = dashboardData.barberos.filter(b => b.estado === 'activo').length;
    
    document.getElementById('citas-hoy').textContent = citasHoy.length;
    document.getElementById('clientes-totales').textContent = dashboardData.clientes.length;
    document.getElementById('ingresos-hoy').textContent = `$${ingresosHoy.toLocaleString()}`;
    document.getElementById('barberos-activos').textContent = barberosActivos;
    
    // Tendencias (simuladas - luego con datos reales)
    document.getElementById('citas-trend').textContent = '+12%';
    document.getElementById('clientes-trend').textContent = `+${Math.floor(dashboardData.clientes.length * 0.1) || 5}`;
    document.getElementById('ingresos-trend').textContent = '+8%';
    document.getElementById('barberos-trend').textContent = '+0';
}

// ============================================
// CITAS
// ============================================

function renderizarCitasHoy() {
    const container = document.getElementById('citas-hoy-lista');
    if (!container) return;
    
    const hoy = new Date().toISOString().split('T')[0];
    const citasHoy = dashboardData.citas
        .filter(c => c.fecha === hoy)
        .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''))
        .slice(0, 5);
    
    if (citasHoy.length === 0) {
        container.innerHTML = '<div class="loading-spinner">No hay citas para hoy</div>';
        return;
    }
    
    container.innerHTML = citasHoy.map(cita => `
        <div class="cita-item" onclick="window.router?.navegar('/admin/citas')">
            <div class="cita-info">
                <div class="cita-cliente">${cita.clienteNombre || 'Cliente'}</div>
                <div class="cita-hora">🕐 ${cita.hora || '--:--'} • ${cita.servicioNombre || 'Servicio'}</div>
            </div>
            <div class="cita-estado estado-${cita.estado || 'pendiente'}">
                ${getEstadoTexto(cita.estado)}
            </div>
        </div>
    `).join('');
}

function renderizarProximasCitas() {
    const container = document.getElementById('proximas-citas');
    if (!container) return;
    
    const hoy = new Date().toISOString().split('T')[0];
    const proximas = dashboardData.citas
        .filter(c => c.fecha > hoy && c.estado !== 'cancelada')
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .slice(0, 5);
    
    if (proximas.length === 0) {
        container.innerHTML = '<div class="loading-spinner">No hay próximas citas</div>';
        return;
    }
    
    container.innerHTML = proximas.map(cita => `
        <div class="cita-item" onclick="window.router?.navegar('/admin/citas')">
            <div class="cita-info">
                <div class="cita-cliente">${cita.clienteNombre || 'Cliente'}</div>
                <div class="cita-hora">📅 ${formatearFecha(cita.fecha)} • ${cita.hora || '--:--'}</div>
            </div>
            <div class="cita-estado estado-${cita.estado || 'pendiente'}">
                ${getEstadoTexto(cita.estado)}
            </div>
        </div>
    `).join('');
}

// ============================================
// SERVICIOS POPULARES
// ============================================

function renderizarServiciosPopulares() {
    const container = document.getElementById('servicios-populares');
    if (!container) return;
    
    // Contar citas por servicio
    const servicioCount = {};
    dashboardData.citas.forEach(cita => {
        const nombre = cita.servicioNombre;
        if (nombre) servicioCount[nombre] = (servicioCount[nombre] || 0) + 1;
    });
    
    const populares = Object.entries(servicioCount)
        .map(([nombre, count]) => ({ nombre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    
    if (populares.length === 0) {
        container.innerHTML = '<div class="loading-spinner">No hay datos de servicios</div>';
        return;
    }
    
    container.innerHTML = populares.map(servicio => `
        <div class="servicio-item" onclick="window.router?.navegar('/admin/servicios')">
            <div class="servicio-info">
                <div class="servicio-nombre">${servicio.nombre}</div>
                <div class="servicio-stats">📊 ${servicio.count} citas este mes</div>
            </div>
        </div>
    `).join('');
}

// ============================================
// ACTIVIDAD RECIENTE
// ============================================

function renderizarActividadReciente() {
    const container = document.getElementById('actividad-reciente');
    if (!container) return;
    
    // Crear actividad desde los datos
    const actividades = [];
    
    // Agregar citas recientes
    dashboardData.citas
        .sort((a, b) => new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0))
        .slice(0, 10)
        .forEach(cita => {
            actividades.push({
                texto: `Nueva cita: ${cita.clienteNombre} - ${cita.servicioNombre}`,
                fecha: cita.fechaCreacion || cita.fecha,
                tipo: 'cita'
            });
        });
    
    if (actividades.length === 0) {
        container.innerHTML = '<div class="loading-spinner">No hay actividad reciente</div>';
        return;
    }
    
    container.innerHTML = actividades.slice(0, 8).map(act => `
        <div class="actividad-item">
            <div class="actividad-icono">${act.tipo === 'cita' ? '📅' : '👤'}</div>
            <div class="actividad-info">
                <div class="actividad-texto">${act.texto}</div>
                <div class="actividad-fecha">🕐 ${formatearFechaRelativa(act.fecha)}</div>
            </div>
        </div>
    `).join('');
}

// ============================================
// GRÁFICO
// ============================================

function inicializarGrafico() {
    const ctx = document.getElementById('revenue-chart')?.getContext('2d');
    if (!ctx) return;
    
    // Destruir gráfico anterior si existe
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    // Datos de ejemplo (luego se reemplazan con datos reales)
    const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const ingresos = [12500, 15800, 14200, 16800, 18500, 19200, 21000];
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dias,
            datasets: [{
                label: 'Ingresos',
                data: ingresos,
                borderColor: '#ff6b35',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ff6b35',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `$${context.raw.toLocaleString()}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => '$' + value.toLocaleString()
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function actualizarFecha() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const hoy = new Date();
        const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = hoy.toLocaleDateString('es-ES', opciones);
    }
}

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES');
}

function formatearFechaRelativa(fecha) {
    if (!fecha) return 'recientemente';
    
    const d = new Date(fecha);
    const ahora = new Date();
    const diffHoras = Math.floor((ahora - d) / (1000 * 60 * 60));
    
    if (diffHoras < 1) return 'hace unos momentos';
    if (diffHoras < 24) return `hace ${diffHoras} hora${diffHoras !== 1 ? 's' : ''}`;
    return `hace ${Math.floor(diffHoras / 24)} día${Math.floor(diffHoras / 24) !== 1 ? 's' : ''}`;
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

// ============================================
// EVENTOS
// ============================================

function setupEventListeners() {
    const refreshBtn = document.getElementById('btn-refresh');
    if (refreshBtn) {
        refreshBtn.onclick = async () => {
            await cargarDatos();
            renderizarStats();
            renderizarCitasHoy();
            renderizarProximasCitas();
            renderizarServiciosPopulares();
            renderizarActividadReciente();
            window.app?.mostrarNotificacion('Datos actualizados', 'success');
        };
    }
    
    const chartPeriod = document.getElementById('chart-period');
    if (chartPeriod) {
        chartPeriod.onchange = (e) => {
            console.log(`Período seleccionado: ${e.target.value} días`);
            // Aquí se cargarían los datos según el período
        };
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
