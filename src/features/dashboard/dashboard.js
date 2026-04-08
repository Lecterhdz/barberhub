// src/features/dashboard/dashboard.js

console.log('📊 Dashboard feature cargado');

let revenueChart = null;

// Datos de ejemplo (se reemplazarán con datos reales de IndexedDB)
const datosEjemplo = {
    citas: [
        { id: 1, cliente: 'Carlos López', hora: '10:00', servicio: 'Corte de Cabello', estado: 'confirmada' },
        { id: 2, cliente: 'Miguel Ángel', hora: '11:30', servicio: 'Barba', estado: 'pendiente' },
        { id: 3, cliente: 'Juan Pérez', hora: '14:00', servicio: 'Corte + Barba', estado: 'confirmada' },
        { id: 4, cliente: 'Roberto Gómez', hora: '16:00', servicio: 'Corte', estado: 'pendiente' }
    ],
    servicios: [
        { nombre: 'Corte de Cabello', citas: 45, precio: 350 },
        { nombre: 'Barba', citas: 30, precio: 200 },
        { nombre: 'Corte + Barba', citas: 25, precio: 500 },
        { nombre: 'Coloración', citas: 10, precio: 800 }
    ],
    ingresosSemanales: [12500, 15800, 14200, 16800, 18500, 19200, 21000]
};

// Función para cargar estadísticas
async function cargarEstadisticas() {
    try {
        // Obtener datos reales de storage
        const clientes = await window.storage?.obtenerTodos('clientes') || [];
        const citas = await window.storage?.obtenerTodos('citas') || [];
        const servicios = await window.storage?.obtenerTodos('servicios') || [];
        
        // Calcular citas de hoy
        const hoy = new Date().toDateString();
        const citasHoy = citas.filter(cita => 
            new Date(cita.fecha).toDateString() === hoy
        );
        
        // Calcular ingresos de hoy (ejemplo)
        const ingresosHoy = citasHoy.length * 350;
        
        // Actualizar DOM
        document.getElementById('citas-hoy').textContent = citasHoy.length;
        document.getElementById('clientes-totales').textContent = clientes.length;
        document.getElementById('ingresos-hoy').textContent = `$${ingresosHoy.toLocaleString()}`;
        document.getElementById('servicios-totales').textContent = servicios.length || 15;
        
        // Actualizar tendencias (ejemplo)
        document.getElementById('citas-trend').textContent = '+12%';
        document.getElementById('clientes-trend').textContent = `+${clientes.length > 0 ? Math.floor(clientes.length * 0.1) : 5}`;
        document.getElementById('ingresos-trend').textContent = '+8%';
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        // Usar datos de ejemplo si hay error
        document.getElementById('citas-hoy').textContent = '8';
        document.getElementById('clientes-totales').textContent = '156';
        document.getElementById('ingresos-hoy').textContent = '$2,800';
        document.getElementById('servicios-totales').textContent = '12';
    }
}

// Función para cargar próximas citas
async function cargarProximasCitas() {
    const container = document.getElementById('proximas-citas');
    if (!container) return;
    
    try {
        const citas = await window.storage?.obtenerTodos('citas') || datosEjemplo.citas;
        const proximas = citas.slice(0, 5);
        
        if (proximas.length === 0) {
            container.innerHTML = '<div class="loading-spinner">No hay citas programadas</div>';
            return;
        }
        
        container.innerHTML = proximas.map(cita => `
            <div class="cita-item" onclick="window.router.navegar('/citas')">
                <div class="cita-info">
                    <div class="cita-cliente">${cita.cliente || 'Cliente'}</div>
                    <div class="cita-hora">🕐 ${cita.hora || '10:00'} • ${cita.servicio || 'Corte'}</div>
                </div>
                <div class="cita-estado estado-${cita.estado || 'pendiente'}">
                    ${cita.estado || 'Pendiente'}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando citas:', error);
        container.innerHTML = '<div class="loading-spinner">Error al cargar citas</div>';
    }
}

// Función para cargar servicios populares
async function cargarServiciosPopulares() {
    const container = document.getElementById('servicios-populares');
    if (!container) return;
    
    try {
        const servicios = await window.storage?.obtenerTodos('servicios') || datosEjemplo.servicios;
        const populares = servicios.slice(0, 5);
        
        if (populares.length === 0) {
            container.innerHTML = '<div class="loading-spinner">No hay servicios registrados</div>';
            return;
        }
        
        container.innerHTML = populares.map(servicio => `
            <div class="servicio-item" onclick="window.router.navegar('/servicios')">
                <div class="servicio-info">
                    <div class="servicio-nombre">${servicio.nombre}</div>
                    <div class="servicio-stats">📊 ${servicio.citas || 0} citas este mes</div>
                </div>
                <div class="servicio-precio">$${(servicio.precio || 0).toLocaleString()}</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando servicios:', error);
        container.innerHTML = '<div class="loading-spinner">Error al cargar servicios</div>';
    }
}

// Función para cargar actividad reciente
async function cargarActividadReciente() {
    const container = document.getElementById('actividad-reciente');
    if (!container) return;
    
    const actividades = [
        { texto: 'Nuevo cliente registrado', fecha: 'Hace 5 minutos', tipo: 'cliente' },
        { texto: 'Cita confirmada para las 15:00', fecha: 'Hace 30 minutos', tipo: 'cita' },
        { texto: 'Pago registrado de $350', fecha: 'Hace 1 hora', tipo: 'pago' },
        { texto: 'Nuevo servicio agregado: Corte Degradado', fecha: 'Hace 2 horas', tipo: 'servicio' },
        { texto: 'Cliente Juan Pérez cumplió 5 visitas', fecha: 'Hace 3 horas', tipo: 'cliente' }
    ];
    
    container.innerHTML = actividades.map(act => `
        <div class="actividad-item">
            <div class="actividad-info">
                <div class="actividad-texto">${act.texto}</div>
                <div class="actividad-fecha">🕐 ${act.fecha}</div>
            </div>
        </div>
    `).join('');
}

// Función para inicializar el gráfico
function initChart() {
    const ctx = document.getElementById('revenue-chart')?.getContext('2d');
    if (!ctx) return;
    
    // Si ya existe un gráfico, destruirlo
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dias,
            datasets: [{
                label: 'Ingresos',
                data: datosEjemplo.ingresosSemanales,
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
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `$${context.raw.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Función para actualizar la fecha actual
function actualizarFecha() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const hoy = new Date();
        const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateElement.textContent = hoy.toLocaleDateString('es-ES', opciones);
    }
}

// Evento para cambio de período en gráfico
function setupChartPeriodListener() {
    const select = document.getElementById('chart-period');
    if (select) {
        select.addEventListener('change', (e) => {
            const period = e.target.value;
            console.log(`Cambiando gráfico a período: ${period} días`);
            // Aquí se cargarían los datos según el período
        });
    }
}

// Inicializar dashboard
async function init() {
    console.log('📊 Inicializando Dashboard...');
    
    actualizarFecha();
    await cargarEstadisticas();
    await cargarProximasCitas();
    await cargarServiciosPopulares();
    await cargarActividadReciente();
    initChart();
    setupChartPeriodListener();
}

// Escuchar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Exportar funciones
export { init, cargarEstadisticas, cargarProximasCitas };
