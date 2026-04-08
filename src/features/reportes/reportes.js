// src/features/reportes/reportes.js

console.log('📈 Reportes feature cargado');

let ventas = [];
let citas = [];
let clientes = [];
let barberos = [];
let productos = [];
let currentTab = 'ventas';
let currentPeriodo = 'semana';
let fechaInicio = null;
let fechaFin = null;

let ventasChart = null;
let metodosChart = null;
let citasBarberosChart = null;

// Inicializar
async function init() {
    console.log('📈 Inicializando reportes...');
    await cargarDatos();
    setupEventListeners();
    await cargarReporte();
}

// Cargar datos
async function cargarDatos() {
    try {
        ventas = await window.storage?.obtenerTodos('ventas') || [];
        citas = await window.storage?.obtenerTodos('citas') || [];
        clientes = await window.storage?.obtenerTodos('clientes') || [];
        barberos = await window.storage?.obtenerTodos('barberos') || [];
        productos = await window.storage?.obtenerTodos('productos') || [];
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// Configurar eventos
function setupEventListeners() {
    // Tabs
    document.querySelectorAll('.reportes-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            currentTab = tab.dataset.tab;
            document.querySelectorAll('.reportes-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.querySelectorAll('.reporte-panel').forEach(panel => panel.style.display = 'none');
            document.getElementById(`panel-${currentTab}`).style.display = 'block';
            
            cargarReporte();
        });
    });
    
    // Filtros de fecha
    document.querySelectorAll('.filtro-fecha-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filtro-fecha-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (btn.dataset.fecha === 'personalizado') {
                document.getElementById('filtros-personalizado').style.display = 'flex';
            } else {
                document.getElementById('filtros-personalizado').style.display = 'none';
                currentPeriodo = btn.dataset.fecha;
                cargarReporte();
            }
        });
    });
    
    document.getElementById('aplicar-filtro')?.addEventListener('click', () => {
        fechaInicio = document.getElementById('fecha-inicio').value;
        fechaFin = document.getElementById('fecha-fin').value;
        cargarReporte();
    });
    
    // Exportar
    document.getElementById('btn-exportar-pdf')?.addEventListener('click', () => exportarPDF());
    document.getElementById('btn-exportar-excel')?.addEventListener('click', () => exportarExcel());
}

// Obtener rango de fechas
function getRangoFechas() {
    const hoy = new Date();
    let inicio = new Date();
    let fin = new Date();
    
    if (fechaInicio && fechaFin) {
        return { inicio: new Date(fechaInicio), fin: new Date(fechaFin) };
    }
    
    switch (currentPeriodo) {
        case 'hoy':
            inicio = new Date(hoy.setHours(0, 0, 0, 0));
            fin = new Date(hoy.setHours(23, 59, 59, 999));
            break;
        case 'ayer':
            inicio = new Date(hoy);
            inicio.setDate(hoy.getDate() - 1);
            fin = new Date(inicio);
            break;
        case 'semana':
            inicio = new Date(hoy);
            inicio.setDate(hoy.getDate() - 7);
            break;
        case 'mes':
            inicio = new Date(hoy);
            inicio.setMonth(hoy.getMonth() - 1);
            break;
        case 'trimestre':
            inicio = new Date(hoy);
            inicio.setMonth(hoy.getMonth() - 3);
            break;
        case 'anio':
            inicio = new Date(hoy);
            inicio.setFullYear(hoy.getFullYear() - 1);
            break;
    }
    
    return { inicio, fin };
}

// Filtrar datos por fecha
function filtrarPorFecha(items, fechaField = 'fecha') {
    const { inicio, fin } = getRangoFechas();
    return items.filter(item => {
        const fechaItem = new Date(item[fechaField]);
        return fechaItem >= inicio && fechaItem <= fin;
    });
}

// Cargar reporte según tab activo
async function cargarReporte() {
    switch (currentTab) {
        case 'ventas':
            await cargarReporteVentas();
            break;
        case 'citas':
            await cargarReporteCitas();
            break;
        case 'clientes':
            await cargarReporteClientes();
            break;
        case 'barberos':
            await cargarReporteBarberos();
            break;
        case 'inventario':
            await cargarReporteInventario();
            break;
    }
}

// Reporte Ventas
async function cargarReporteVentas() {
    const ventasFiltradas = filtrarPorFecha(ventas);
    const ventasPagadas = ventasFiltradas.filter(v => v.estado === 'pagado');
    
    const total = ventasPagadas.reduce((sum, v) => sum + v.total, 0);
    const transacciones = ventasPagadas.length;
    const ticketPromedio = transacciones > 0 ? total / transacciones : 0;
    
    document.getElementById('total-ventas-reporte').textContent = `$${total.toLocaleString()}`;
    document.getElementById('total-transacciones').textContent = transacciones;
    document.getElementById('ticket-promedio').textContent = `$${ticketPromedio.toLocaleString()}`;
    
    // Gráfico de ventas por día
    const ventasPorDia = {};
    ventasPagadas.forEach(v => {
        const fecha = v.fecha;
        ventasPorDia[fecha] = (ventasPorDia[fecha] || 0) + v.total;
    });
    
    const labels = Object.keys(ventasPorDia).sort();
    const data = labels.map(l => ventasPorDia[l]);
    
    if (ventasChart) ventasChart.destroy();
    const ctx = document.getElementById('ventas-chart')?.getContext('2d');
    if (ctx) {
        ventasChart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [{ label: 'Ventas', data, borderColor: '#ff6b35', backgroundColor: 'rgba(255, 107, 53, 0.1)', fill: true, tension: 0.4 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: v => '$' + v.toLocaleString() } } } }
        });
    }
    
    // Ventas por método
    const metodos = { efectivo: 0, tarjeta: 0, transferencia: 0 };
    ventasPagadas.forEach(v => { metodos[v.metodo] = (metodos[v.metodo] || 0) + v.total; });
    
    if (metodosChart) metodosChart.destroy();
    const ctxMetodos = document.getElementById('metodos-chart')?.getContext('2d');
    if (ctxMetodos) {
        metodosChart = new Chart(ctxMetodos, {
            type: 'doughnut',
            data: { labels: ['Efectivo', 'Tarjeta', 'Transferencia'], datasets: [{ data: [metodos.efectivo, metodos.tarjeta, metodos.transferencia], backgroundColor: ['#4caf50', '#2196f3', '#9c27b0'] }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
    
    // Top items
    const itemsCount = {};
    ventasPagadas.forEach(v => {
        itemsCount[v.itemNombre] = (itemsCount[v.itemNombre] || 0) + v.cantidad;
    });
    const topItems = Object.entries(itemsCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
    
    const topContainer = document.getElementById('top-items');
    topContainer.innerHTML = topItems.map(([nombre, cantidad]) => `
        <div class="top-item">
            <span class="top-item-nombre">${nombre}</span>
            <span class="top-item-cantidad">${cantidad} unidades</span>
        </div>
    `).join('');
}

// Reporte Citas
async function cargarReporteCitas() {
    const citasFiltradas = filtrarPorFecha(citas);
    const completadas = citasFiltradas.filter(c => c.estado === 'completada');
    const canceladas = citasFiltradas.filter(c => c.estado === 'cancelada');
    
    document.getElementById('total-citas').textContent = citasFiltradas.length;
    document.getElementById('citas-completadas-reporte').textContent = completadas.length;
    document.getElementById('citas-canceladas').textContent = canceladas.length;
    
    // Citas por barbero
    const citasPorBarbero = {};
    completadas.forEach(c => {
        citasPorBarbero[c.barberoNombre] = (citasPorBarbero[c.barberoNombre] || 0) + 1;
    });
    
    if (citasBarberosChart) citasBarberosChart.destroy();
    const ctx = document.getElementById('citas-barberos-chart')?.getContext('2d');
    if (ctx) {
        citasBarberosChart = new Chart(ctx, {
            type: 'bar',
            data: { labels: Object.keys(citasPorBarbero), datasets: [{ label: 'Citas completadas', data: Object.values(citasPorBarbero), backgroundColor: '#ff6b35' }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}

// Reporte Clientes
async function cargarReporteClientes() {
    document.getElementById('total-clientes').textContent = clientes.length;
    
    // Clientes frecuentes (más de 5 visitas)
    const frecuentes = clientes.filter(c => (c.visitas || 0) >= 5);
    document.getElementById('clientes-frecuentes').textContent = frecuentes.length;
    
    // Top clientes por gasto
    const ventasCliente = {};
    ventas.forEach(v => {
        if (v.clienteId) {
            ventasCliente[v.clienteId] = (ventasCliente[v.clienteId] || 0) + v.total;
        }
    });
    
    const topClientes = Object.entries(ventasCliente)
        .map(([id, total]) => ({ nombre: clientes.find(c => c.id == id)?.nombre || 'Desconocido', total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    
    const topContainer = document.getElementById('top-clientes');
    topContainer.innerHTML = topClientes.map(c => `
        <div class="top-item">
            <span class="top-item-nombre">${c.nombre}</span>
            <span class="top-item-valor">$${c.total.toLocaleString()}</span>
        </div>
    `).join('');
}

// Reporte Barberos
async function cargarReporteBarberos() {
    document.getElementById('total-barberos').textContent = barberos.length;
    
    // Ranking por citas
    const citasPorBarbero = {};
    citas.forEach(c => {
        if (c.estado === 'completada') {
            citasPorBarbero[c.barberoNombre] = (citasPorBarbero[c.barberoNombre] || 0) + 1;
        }
    });
    
    const ranking = Object.entries(citasPorBarbero)
        .map(([nombre, citas]) => ({ nombre, citas }))
        .sort((a, b) => b.citas - a.citas);
    
    const rankingContainer = document.getElementById('ranking-barberos');
    rankingContainer.innerHTML = ranking.map((b, i) => `
        <div class="top-item">
            <span class="top-item-nombre">${i + 1}. ${b.nombre}</span>
            <span class="top-item-valor">${b.citas} citas</span>
        </div>
    `).join('');
}

// Reporte Inventario
async function cargarReporteInventario() {
    const stockBajo = productos.filter(p => p.stock <= p.stockMinimo);
    const valorInventario = productos.reduce((sum, p) => sum + (p.costo * p.stock), 0);
    
    document.getElementById('total-productos').textContent = productos.length;
    document.getElementById('stock-bajo-total').textContent = stockBajo.length;
    document.getElementById('valor-inventario').textContent = `$${valorInventario.toLocaleString()}`;
    
    const stockContainer = document.getElementById('productos-stock-bajo');
    stockContainer.innerHTML = stockBajo.map(p => `
        <div class="top-item">
            <span class="top-item-nombre">${p.nombre}</span>
            <span class="top-item-valor">Stock: ${p.stock} / ${p.stockMinimo}</span>
        </div>
    `).join('');
}

// Exportar funciones
function exportarPDF() {
    window.utils?.mostrarNotificacion('Exportando PDF...', 'info');
    // Implementar generación de PDF
}

function exportarExcel() {
    window.utils?.mostrarNotificacion('Exportando Excel...', 'info');
    // Implementar exportación a Excel
}

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export { init };
