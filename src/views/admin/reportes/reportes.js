// src/views/admin/reportes/reportes.js

console.log('📈 Admin - Reportes');

let ventasChart = null;
let metodosChart = null;
let citasBarberosChart = null;

let datos = {
    ventas: [],
    citas: [],
    clientes: [],
    barberos: [],
    productos: [],
    servicios: []
};

let currentTab = 'ventas';
let currentPeriodo = 'semana';
let fechaInicio = null;
let fechaFin = null;

// ============================================
// INICIALIZACIÓN
// ============================================

async function init() {
    console.log('🚀 Inicializando reportes...');
    
    await cargarDatos();
    setupEventListeners();
    cargarReporte();
}

async function cargarDatos() {
    // Obtener del caché global
    if (window.app && window.app.estado) {
        datos.ventas = window.app.estado.cache.ventas || [];
        datos.citas = window.app.estado.cache.citas || [];
        datos.clientes = window.app.estado.cache.clientes || [];
        datos.barberos = window.app.estado.cache.barberos || [];
        datos.productos = window.app.estado.cache.productos || [];
        datos.servicios = window.app.estado.cache.servicios || [];
    } else {
        datos.ventas = await window.storage?.obtenerTodos('ventas') || [];
        datos.citas = await window.storage?.obtenerTodos('citas') || [];
        datos.clientes = await window.storage?.obtenerTodos('clientes') || [];
        datos.barberos = await window.storage?.obtenerTodos('barberos') || [];
        datos.productos = await window.storage?.obtenerTodos('productos') || [];
        datos.servicios = await window.storage?.obtenerTodos('servicios') || [];
    }
    
    console.log(`📦 Datos cargados: ${datos.ventas.length} ventas, ${datos.citas.length} citas, ${datos.clientes.length} clientes`);
}

// ============================================
// FILTRADO POR FECHA
// ============================================

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

function filtrarPorFecha(items, fechaField = 'fecha') {
    const { inicio, fin } = getRangoFechas();
    return items.filter(item => {
        const fechaItem = new Date(item[fechaField]);
        return fechaItem >= inicio && fechaItem <= fin;
    });
}

// ============================================
// REPORTE VENTAS
// ============================================

async function cargarReporteVentas() {
    const ventasFiltradas = filtrarPorFecha(datos.ventas);
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
    
    const labels = Object.keys(ventasPorDia).sort().slice(-14);
    const data = labels.map(l => ventasPorDia[l]);
    
    if (ventasChart) ventasChart.destroy();
    const ctx = document.getElementById('ventas-chart')?.getContext('2d');
    if (ctx) {
        ventasChart = new Chart(ctx, {
            type: 'line',
            data: { 
                labels, 
                datasets: [{ 
                    label: 'Ventas', 
                    data, 
                    borderColor: '#ff6b35', 
                    backgroundColor: 'rgba(255, 107, 53, 0.1)', 
                    fill: true, 
                    tension: 0.4,
                    pointBackgroundColor: '#ff6b35',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                scales: { 
                    y: { 
                        beginAtZero: true, 
                        ticks: { callback: v => '$' + v.toLocaleString() } 
                    } 
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => `$${context.raw.toLocaleString()}`
                        }
                    }
                }
            }
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
            data: { 
                labels: ['💵 Efectivo', '💳 Tarjeta', '🏦 Transferencia'], 
                datasets: [{ 
                    data: [metodos.efectivo, metodos.tarjeta, metodos.transferencia], 
                    backgroundColor: ['#4caf50', '#2196f3', '#9c27b0'],
                    borderWidth: 0
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
    
    // Top items
    const itemsCount = {};
    ventasPagadas.forEach(v => {
        itemsCount[v.itemNombre] = (itemsCount[v.itemNombre] || 0) + v.cantidad;
    });
    const topItems = Object.entries(itemsCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
    
    const topContainer = document.getElementById('top-items');
    if (topContainer) {
        topContainer.innerHTML = topItems.map(([nombre, cantidad]) => `
            <div class="top-item">
                <span class="top-item-nombre">${escapeHtml(nombre)}</span>
                <span class="top-item-cantidad">${cantidad} unidades</span>
            </div>
        `).join('');
        if (topItems.length === 0) topContainer.innerHTML = '<div class="loading-spinner">No hay datos</div>';
    }
}

// ============================================
// REPORTE CITAS
// ============================================

async function cargarReporteCitas() {
    const citasFiltradas = filtrarPorFecha(datos.citas);
    const completadas = citasFiltradas.filter(c => c.estado === 'completada');
    const canceladas = citasFiltradas.filter(c => c.estado === 'cancelada');
    
    document.getElementById('total-citas').textContent = citasFiltradas.length;
    document.getElementById('citas-completadas-reporte').textContent = completadas.length;
    document.getElementById('citas-canceladas').textContent = canceladas.length;
    
    // Tasa de ocupación (simulada - basada en horas laborales)
    const tasaOcupacion = completadas.length > 0 ? Math.min(100, Math.round((completadas.length / 20) * 100)) : 0;
    document.getElementById('tasa-ocupacion').textContent = `${tasaOcupacion}%`;
    
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
            data: { 
                labels: Object.keys(citasPorBarbero), 
                datasets: [{ 
                    label: 'Citas completadas', 
                    data: Object.values(citasPorBarbero), 
                    backgroundColor: '#ff6b35',
                    borderRadius: 8
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    }
}

// ============================================
// REPORTE CLIENTES
// ============================================

async function cargarReporteClientes() {
    document.getElementById('total-clientes').textContent = datos.clientes.length;
    
    // Clientes frecuentes (más de 5 visitas)
    const frecuentes = datos.clientes.filter(c => (c.visitas || 0) >= 5);
    document.getElementById('clientes-frecuentes').textContent = frecuentes.length;
    
    // Nuevos clientes en el período
    const { inicio } = getRangoFechas();
    const nuevos = datos.clientes.filter(c => new Date(c.fechaRegistro) >= inicio);
    document.getElementById('nuevos-clientes').textContent = nuevos.length;
    
    // Top clientes por gasto
    const ventasCliente = {};
    datos.ventas.forEach(v => {
        if (v.clienteId) {
            ventasCliente[v.clienteId] = (ventasCliente[v.clienteId] || 0) + v.total;
        }
    });
    
    const topClientes = Object.entries(ventasCliente)
        .map(([id, total]) => ({ nombre: datos.clientes.find(c => c.id == id)?.nombre || 'Desconocido', total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    
    const topContainer = document.getElementById('top-clientes');
    if (topContainer) {
        topContainer.innerHTML = topClientes.map(c => `
            <div class="top-item">
                <span class="top-item-nombre">${escapeHtml(c.nombre)}</span>
                <span class="top-item-valor">$${c.total.toLocaleString()}</span>
            </div>
        `).join('');
        if (topClientes.length === 0) topContainer.innerHTML = '<div class="loading-spinner">No hay datos</div>';
    }
}

// ============================================
// REPORTE BARBEROS
// ============================================

async function cargarReporteBarberos() {
    document.getElementById('total-barberos').textContent = datos.barberos.length;
    
    // Comisiones pagadas
    const comisiones = datos.barberos.reduce((sum, b) => sum + ((b.ingresosGenerados || 0) * (b.comision || 0) / 100), 0);
    document.getElementById('total-comisiones').textContent = `$${comisiones.toLocaleString()}`;
    
    // Ranking por citas
    const citasPorBarbero = {};
    datos.citas.forEach(c => {
        if (c.estado === 'completada') {
            citasPorBarbero[c.barberoNombre] = (citasPorBarbero[c.barberoNombre] || 0) + 1;
        }
    });
    
    const ranking = Object.entries(citasPorBarbero)
        .map(([nombre, citas]) => ({ nombre, citas }))
        .sort((a, b) => b.citas - a.citas);
    
    const rankingContainer = document.getElementById('ranking-barberos');
    if (rankingContainer) {
        rankingContainer.innerHTML = ranking.map((b, i) => `
            <div class="top-item">
                <span class="top-item-nombre">${i + 1}. ${escapeHtml(b.nombre)}</span>
                <span class="top-item-valor">${b.citas} citas</span>
            </div>
        `).join('');
        if (ranking.length === 0) rankingContainer.innerHTML = '<div class="loading-spinner">No hay datos</div>';
    }
}

// ============================================
// REPORTE INVENTARIO
// ============================================

async function cargarReporteInventario() {
    const stockBajo = datos.productos.filter(p => p.stock <= p.stockMinimo && p.stock > 0);
    const stockAgotado = datos.productos.filter(p => p.stock === 0);
    const valorInventario = datos.productos.reduce((sum, p) => sum + ((p.costo || p.precio) * p.stock), 0);
    
    document.getElementById('total-productos').textContent = datos.productos.length;
    document.getElementById('stock-bajo-total').textContent = stockBajo.length + stockAgotado.length;
    document.getElementById('valor-inventario').textContent = `$${valorInventario.toLocaleString()}`;
    
    const productosCriticos = [...stockBajo, ...stockAgotado];
    const stockContainer = document.getElementById('productos-stock-bajo');
    if (stockContainer) {
        stockContainer.innerHTML = productosCriticos.map(p => `
            <div class="top-item">
                <span class="top-item-nombre">${escapeHtml(p.nombre)}</span>
                <span class="top-item-valor ${p.stock === 0 ? 'stock-agotado' : 'stock-bajo'}">Stock: ${p.stock} / ${p.stockMinimo}</span>
            </div>
        `).join('');
        if (productosCriticos.length === 0) stockContainer.innerHTML = '<div class="loading-spinner">No hay productos con stock bajo</div>';
    }
}

// ============================================
// CARGA DE REPORTE SEGÚN TAB
// ============================================

function cargarReporte() {
    switch (currentTab) {
        case 'ventas':
            cargarReporteVentas();
            break;
        case 'citas':
            cargarReporteCitas();
            break;
        case 'clientes':
            cargarReporteClientes();
            break;
        case 'barberos':
            cargarReporteBarberos();
            break;
        case 'inventario':
            cargarReporteInventario();
            break;
    }
}

// ============================================
// EXPORTACIÓN
// ============================================

function exportarPDF() {
    window.app?.mostrarNotificacion('Exportando PDF... (Próximamente)', 'info');
}

function exportarExcel() {
    window.app?.mostrarNotificacion('Exportando Excel... (Próximamente)', 'info');
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

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
                fechaInicio = null;
                fechaFin = null;
                cargarReporte();
            }
        });
    });
    
    document.getElementById('aplicar-filtro')?.addEventListener('click', () => {
        fechaInicio = document.getElementById('fecha-inicio').value;
        fechaFin = document.getElementById('fecha-fin').value;
        if (fechaInicio && fechaFin) {
            cargarReporte();
        }
    });
    
    // Exportar
    document.getElementById('btn-exportar-pdf')?.addEventListener('click', exportarPDF);
    document.getElementById('btn-exportar-excel')?.addEventListener('click', exportarExcel);
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
