// src/views/admin/caja/caja.js

console.log('💰 Admin - Caja');

// Estado local
let ventas = [];
let clientes = [];
let servicios = [];
let productos = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentFiltro = {
    fecha: 'hoy',
    metodo: 'todos'
};
let editingId = null;

// ============================================
// INICIALIZACIÓN
// ============================================

async function init() {
    console.log('🚀 Inicializando caja...');
    
    await cargarDatos();
    setupEventListeners();
    setupModalClose();
    renderizarTabla();
    actualizarResumen();
}

async function cargarDatos() {
    // Obtener del caché global
    if (window.app && window.app.estado) {
        ventas = window.app.estado.cache.ventas || [];
        clientes = window.app.estado.cache.clientes || [];
        servicios = window.app.estado.cache.servicios || [];
        productos = window.app.estado.cache.productos || [];
    } else {
        ventas = await window.storage?.obtenerTodos('ventas') || [];
        clientes = await window.storage?.obtenerTodos('clientes') || [];
        servicios = await window.storage?.obtenerTodos('servicios') || [];
        productos = await window.storage?.obtenerTodos('productos') || [];
    }
    
    await cargarSelectores();
    console.log(`📦 ${ventas.length} ventas cargadas`);
}

async function guardarVentas() {
    for (const venta of ventas) {
        await window.storage?.guardar('ventas', venta);
    }
    
    // Actualizar caché global
    if (window.app && window.app.estado) {
        window.app.estado.cache.ventas = ventas;
    }
}

async function cargarSelectores() {
    const clienteSelect = document.getElementById('venta-cliente');
    const servicioSelect = document.getElementById('venta-servicio');
    const productoSelect = document.getElementById('venta-producto');
    
    if (clienteSelect) {
        clienteSelect.innerHTML = '<option value="">Cliente general</option>' +
            clientes.map(c => `<option value="${c.id}">${escapeHtml(c.nombre)}</option>`).join('');
    }
    
    if (servicioSelect) {
        servicioSelect.innerHTML = '<option value="">Seleccionar servicio</option>' +
            servicios.filter(s => s.estado === 'activo').map(s => `<option value="${s.id}" data-precio="${s.precio}">${escapeHtml(s.nombre)} - $${s.precio}</option>`).join('');
    }
    
    if (productoSelect) {
        productoSelect.innerHTML = '<option value="">Seleccionar producto</option>' +
            productos.map(p => `<option value="${p.id}" data-precio="${p.precio}" data-stock="${p.stock}">${escapeHtml(p.nombre)} - $${p.precio} (Stock: ${p.stock})</option>`).join('');
    }
}

// ============================================
// FILTRADO
// ============================================

function filtrarVentasPorFecha() {
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];
    let fechaLimite = new Date();
    
    switch (currentFiltro.fecha) {
        case 'hoy':
            return ventas.filter(v => v.fecha === hoyStr);
        case 'ayer':
            const ayer = new Date(hoy);
            ayer.setDate(hoy.getDate() - 1);
            const ayerStr = ayer.toISOString().split('T')[0];
            return ventas.filter(v => v.fecha === ayerStr);
        case 'semana':
            const semanaAtras = new Date(hoy);
            semanaAtras.setDate(hoy.getDate() - 7);
            return ventas.filter(v => v.fecha >= semanaAtras.toISOString().split('T')[0]);
        case 'mes':
            const mesAtras = new Date(hoy);
            mesAtras.setMonth(hoy.getMonth() - 1);
            return ventas.filter(v => v.fecha >= mesAtras.toISOString().split('T')[0]);
        default:
            return ventas;
    }
}

function filtrarVentas() {
    let filtered = filtrarVentasPorFecha();
    
    if (currentFiltro.metodo !== 'todos') {
        filtered = filtered.filter(v => v.metodo === currentFiltro.metodo);
    }
    
    return filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

// ============================================
// RENDERIZADO
// ============================================

function actualizarResumen() {
    const ventasFiltradas = filtrarVentasPorFecha();
    const totalVentas = ventasFiltradas.reduce((sum, v) => sum + v.total, 0);
    const citasCompletadas = ventasFiltradas.filter(v => v.tipo === 'servicio').length;
    
    document.getElementById('ventas-dia').textContent = `$${totalVentas.toLocaleString()}`;
    document.getElementById('total-ventas').textContent = `$${ventas.reduce((sum, v) => sum + v.total, 0).toLocaleString()}`;
    document.getElementById('citas-completadas').textContent = citasCompletadas;
}

function renderizarTabla() {
    const tbody = document.getElementById('ventas-table-body');
    if (!tbody) return;
    
    const filtered = filtrarVentas();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    
    if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No hay ventas registradas</td></tr>`;
        document.getElementById('page-info').textContent = 'Página 1 de 1';
        return;
    }
    
    tbody.innerHTML = paginated.map(venta => `
        <tr> onclick="verVenta(${venta.id})">
            <td>${formatearFecha(venta.fecha)}</td>
            <td>${escapeHtml(venta.clienteNombre || 'Cliente general')}</td>
            <td>${escapeHtml(venta.itemNombre)} ${venta.cantidad > 1 ? `x${venta.cantidad}` : ''}</td>
            <td>$${venta.total.toLocaleString()}</td>
            <td><span class="metodo-badge metodo-${venta.metodo}">${getMetodoTexto(venta.metodo)}</span></td>
            <td><span class="estado-pagado">${venta.estado === 'pagado' ? '✓ Pagado' : '✗ Anulado'}</span></td>
            <td onclick="event.stopPropagation()">
                <div class="acciones-btns">
                    <button class="btn-icon-sm" onclick="verVenta(${venta.id})" title="Ver">👁️</button>
                    <button class="btn-icon-sm" onclick="anularVenta(${venta.id})" title="Anular" ${venta.estado === 'anulado' ? 'disabled' : ''}>🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages || 1}`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
}

// ============================================
// CRUD DE VENTAS
// ============================================

window.verVenta = function(id) {
    const venta = ventas.find(v => v.id === id);
    if (!venta) return;
    
    const detalle = document.getElementById('venta-detalle');
    detalle.innerHTML = `
        <div class="info-row"><label>Fecha:</label><span>${formatearFecha(venta.fecha)}</span></div>
        <div class="info-row"><label>Cliente:</label><span>${escapeHtml(venta.clienteNombre || 'Cliente general')}</span></div>
        <div class="info-row"><label>Tipo:</label><span>${venta.tipo === 'servicio' ? '✂️ Servicio' : '📦 Producto'}</span></div>
        <div class="info-row"><label>Item:</label><span>${escapeHtml(venta.itemNombre)}</span></div>
        <div class="info-row"><label>Cantidad:</label><span>${venta.cantidad}</span></div>
        <div class="info-row"><label>Precio unitario:</label><span>$${venta.precio.toLocaleString()}</span></div>
        <div class="info-row"><label>Total:</label><span><strong>$${venta.total.toLocaleString()}</strong></span></div>
        <div class="info-row"><label>Método de pago:</label><span>${getMetodoTexto(venta.metodo)}</span></div>
        ${venta.recibido ? `<div class="info-row"><label>Recibido:</label><span>$${venta.recibido.toLocaleString()}</span></div>` : ''}
        ${venta.cambio ? `<div class="info-row"><label>Cambio:</label><span>$${venta.cambio.toLocaleString()}</span></div>` : ''}
        <div class="info-row"><label>Estado:</label><span class="estado-pagado">${venta.estado === 'pagado' ? 'Pagado' : 'Anulado'}</span></div>
    `;
    
    window.currentVentaId = id;
    document.getElementById('venta-ver-modal').style.display = 'flex';
    
    const anularBtn = document.getElementById('anular-venta');
    if (anularBtn) {
        anularBtn.style.display = venta.estado === 'pagado' ? 'block' : 'none';
    }
};

window.anularVenta = async function(id) {
    if (confirm('¿Anular esta venta? Esta acción no se puede deshacer.')) {
        const index = ventas.findIndex(v => v.id === id);
        if (index !== -1) {
            ventas[index].estado = 'anulado';
            await guardarVentas();
            
            // Devolver stock si es producto
            const venta = ventas[index];
            if (venta.tipo === 'producto') {
                const producto = productos.find(p => p.id === venta.itemId);
                if (producto) {
                    producto.stock += venta.cantidad;
                    await window.storage?.guardar('productos', producto);
                    if (window.app && window.app.estado) {
                        const idx = window.app.estado.cache.productos.findIndex(p => p.id === producto.id);
                        if (idx !== -1) window.app.estado.cache.productos[idx] = producto;
                    }
                }
            }
            
            renderizarTabla();
            actualizarResumen();
            window.app?.mostrarNotificacion('Venta anulada', 'warning');
        }
        cerrarModal('venta-ver-modal');
    }
};

function nuevaVenta() {
    editingId = null;
    document.getElementById('venta-form').reset();
    document.getElementById('venta-tipo').value = 'servicio';
    document.getElementById('venta-cantidad').value = '1';
    toggleTipoVenta();
    document.getElementById('venta-modal').style.display = 'flex';
}

function toggleTipoVenta() {
    const tipo = document.getElementById('venta-tipo').value;
    const servicioGroup = document.getElementById('servicio-group');
    const productoGroup = document.getElementById('producto-group');
    const efectivoGroup = document.getElementById('efectivo-group');
    
    if (servicioGroup) servicioGroup.style.display = tipo === 'servicio' ? 'block' : 'none';
    if (productoGroup) productoGroup.style.display = tipo === 'producto' ? 'block' : 'none';
    
    const metodo = document.getElementById('venta-metodo').value;
    if (efectivoGroup) efectivoGroup.style.display = metodo === 'efectivo' ? 'block' : 'none';
}

function actualizarPrecio() {
    const tipo = document.getElementById('venta-tipo').value;
    let precio = 0;
    
    if (tipo === 'servicio') {
        const select = document.getElementById('venta-servicio');
        const option = select.options[select.selectedIndex];
        precio = parseInt(option?.dataset?.precio) || 0;
    } else {
        const select = document.getElementById('venta-producto');
        const option = select.options[select.selectedIndex];
        precio = parseInt(option?.dataset?.precio) || 0;
    }
    
    document.getElementById('venta-precio').value = precio ? `$${precio}` : '';
    calcularCambio();
}

function calcularCambio() {
    const precio = parseInt(document.getElementById('venta-precio').value?.replace('$', '') || 0);
    const recibido = parseInt(document.getElementById('venta-recibido').value) || 0;
    const cambio = recibido - precio;
    const cambioInfo = document.getElementById('cambio-info');
    
    if (cambioInfo) {
        if (cambio >= 0) {
            cambioInfo.textContent = `Cambio: $${cambio.toLocaleString()}`;
            cambioInfo.style.color = '#4caf50';
        } else {
            cambioInfo.textContent = `Faltan: $${Math.abs(cambio).toLocaleString()}`;
            cambioInfo.style.color = '#f44336';
        }
    }
}

async function guardarVenta(e) {
    e.preventDefault();
    
    const tipo = document.getElementById('venta-tipo').value;
    let itemId, itemNombre, precio;
    
    if (tipo === 'servicio') {
        const select = document.getElementById('venta-servicio');
        const option = select.options[select.selectedIndex];
        itemId = parseInt(option.value);
        itemNombre = option.text.split(' -')[0];
        precio = parseInt(option.dataset.precio);
    } else {
        const select = document.getElementById('venta-producto');
        const option = select.options[select.selectedIndex];
        itemId = parseInt(option.value);
        itemNombre = option.text.split(' -')[0];
        precio = parseInt(option.dataset.precio);
        
        // Verificar stock
        const producto = productos.find(p => p.id === itemId);
        const cantidad = parseInt(document.getElementById('venta-cantidad').value);
        if (producto && producto.stock < cantidad) {
            window.app?.mostrarNotificacion('Stock insuficiente', 'error');
            return;
        }
    }
    
    const cantidad = parseInt(document.getElementById('venta-cantidad').value);
    const total = precio * cantidad;
    const metodo = document.getElementById('venta-metodo').value;
    const recibido = metodo === 'efectivo' ? parseInt(document.getElementById('venta-recibido').value) : total;
    const cambio = metodo === 'efectivo' ? recibido - total : 0;
    const clienteId = document.getElementById('venta-cliente').value;
    const clienteNombre = clienteId ? clientes.find(c => c.id == clienteId)?.nombre : 'Cliente general';
    
    if (recibido < total && metodo === 'efectivo') {
        window.app?.mostrarNotificacion('El monto recibido es insuficiente', 'warning');
        return;
    }
    
    const nuevaVenta = {
        id: Date.now(),
        fecha: new Date().toISOString().split('T')[0],
        clienteId: clienteId || null,
        clienteNombre: clienteNombre,
        tipo: tipo,
        itemId: itemId,
        itemNombre: itemNombre,
        cantidad: cantidad,
        precio: precio,
        total: total,
        metodo: metodo,
        estado: 'pagado',
        recibido: metodo === 'efectivo' ? recibido : null,
        cambio: metodo === 'efectivo' ? cambio : null,
        fechaCreacion: new Date().toISOString()
    };
    
    // Descontar stock si es producto
    if (tipo === 'producto') {
        const producto = productos.find(p => p.id === itemId);
        if (producto) {
            producto.stock -= cantidad;
            await window.storage?.guardar('productos', producto);
            if (window.app && window.app.estado) {
                const idx = window.app.estado.cache.productos.findIndex(p => p.id === producto.id);
                if (idx !== -1) window.app.estado.cache.productos[idx] = producto;
            }
        }
    }
    
    ventas.push(nuevaVenta);
    await guardarVentas();
    
    renderizarTabla();
    actualizarResumen();
    cerrarModal();
    window.app?.mostrarNotificacion('Venta registrada', 'success');
}

// ============================================
// CIERRE DE CAJA
// ============================================

function cerrarCaja() {
    const ventasDia = filtrarVentasPorFecha();
    const total = ventasDia.reduce((sum, v) => sum + v.total, 0);
    const efectivo = ventasDia.filter(v => v.metodo === 'efectivo').reduce((sum, v) => sum + v.total, 0);
    const tarjeta = ventasDia.filter(v => v.metodo === 'tarjeta').reduce((sum, v) => sum + v.total, 0);
    const transferencia = ventasDia.filter(v => v.metodo === 'transferencia').reduce((sum, v) => sum + v.total, 0);
    
    document.getElementById('cierre-total').textContent = `$${total.toLocaleString()}`;
    document.getElementById('cierre-efectivo').textContent = `$${efectivo.toLocaleString()}`;
    document.getElementById('cierre-tarjeta').textContent = `$${tarjeta.toLocaleString()}`;
    document.getElementById('cierre-transferencia').textContent = `$${transferencia.toLocaleString()}`;
    document.getElementById('cierre-efectivo-real').value = '';
    document.getElementById('diferencia-container').style.display = 'none';
    
    document.getElementById('cerrar-caja-modal').style.display = 'flex';
}

function verificarDiferencia() {
    const efectivoEsperado = parseInt(document.getElementById('cierre-efectivo').textContent.replace('$', '').replace(/\./g, '')) || 0;
    const efectivoReal = parseInt(document.getElementById('cierre-efectivo-real').value) || 0;
    const diferencia = efectivoReal - efectivoEsperado;
    const diferenciaContainer = document.getElementById('diferencia-container');
    const diferenciaValor = document.getElementById('diferencia-valor');
    
    if (efectivoReal > 0 && diferenciaContainer) {
        diferenciaContainer.style.display = 'flex';
        diferenciaValor.textContent = `${diferencia >= 0 ? '+' : ''}$${Math.abs(diferencia).toLocaleString()}`;
        diferenciaValor.style.color = diferencia === 0 ? '#4caf50' : diferencia > 0 ? '#ff9800' : '#f44336';
    }
}

function confirmarCierre() {
    const efectivoReal = parseInt(document.getElementById('cierre-efectivo-real').value) || 0;
    if (efectivoReal === 0) {
        window.app?.mostrarNotificacion('Ingrese el monto real en caja', 'warning');
        return;
    }
    
    window.app?.mostrarNotificacion('Caja cerrada correctamente', 'success');
    cerrarModal('cerrar-caja-modal');
}

// ============================================
// EXPORTAR
// ============================================

function exportarVentas() {
    const data = filtrarVentas().map(v => ({
        Fecha: v.fecha,
        Cliente: v.clienteNombre || 'Cliente general',
        Tipo: v.tipo === 'servicio' ? 'Servicio' : 'Producto',
        Item: v.itemNombre,
        Cantidad: v.cantidad,
        Precio: v.precio,
        Total: v.total,
        'Método de pago': getMetodoTexto(v.metodo),
        Estado: v.estado === 'pagado' ? 'Pagado' : 'Anulado'
    }));
    
    const csv = [
        Object.keys(data[0] || {}).join(','),
        ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventas_${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    window.app?.mostrarNotificacion('Ventas exportadas', 'success');
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES');
}

function getMetodoTexto(metodo) {
    const metodos = {
        'efectivo': '💵 Efectivo',
        'tarjeta': '💳 Tarjeta',
        'transferencia': '🏦 Transferencia'
    };
    return metodos[metodo] || metodo;
}

function cerrarModal(modalId = 'venta-modal') {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

function setupModalClose() {
    const modals = ['venta-modal', 'venta-ver-modal', 'cerrar-caja-modal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
            modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
        }
    });
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
    document.getElementById('btn-nueva-venta')?.addEventListener('click', nuevaVenta);
    document.getElementById('btn-cerrar-caja')?.addEventListener('click', cerrarCaja);
    document.getElementById('cancelar-modal')?.addEventListener('click', () => cerrarModal());
    document.getElementById('venta-form')?.addEventListener('submit', guardarVenta);
    document.getElementById('cerrar-ver-modal')?.addEventListener('click', () => cerrarModal('venta-ver-modal'));
    document.getElementById('anular-venta')?.addEventListener('click', () => anularVenta(window.currentVentaId));
    document.getElementById('cancelar-cierre')?.addEventListener('click', () => cerrarModal('cerrar-caja-modal'));
    document.getElementById('confirmar-cierre')?.addEventListener('click', confirmarCierre);
    document.getElementById('cierre-efectivo-real')?.addEventListener('input', verificarDiferencia);
    document.getElementById('btn-exportar')?.addEventListener('click', exportarVentas);
    
    document.getElementById('venta-tipo')?.addEventListener('change', toggleTipoVenta);
    document.getElementById('venta-metodo')?.addEventListener('change', toggleTipoVenta);
    document.getElementById('venta-servicio')?.addEventListener('change', actualizarPrecio);
    document.getElementById('venta-producto')?.addEventListener('change', actualizarPrecio);
    document.getElementById('venta-cantidad')?.addEventListener('input', actualizarPrecio);
    document.getElementById('venta-recibido')?.addEventListener('input', calcularCambio);
    
    document.querySelectorAll('.filtro-fecha-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filtro-fecha-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFiltro.fecha = btn.dataset.fecha;
            currentPage = 1;
            renderizarTabla();
            actualizarResumen();
        });
    });
    
    document.getElementById('filtro-metodo')?.addEventListener('change', (e) => {
        currentFiltro.metodo = e.target.value;
        currentPage = 1;
        renderizarTabla();
    });
    
    document.getElementById('prev-page')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderizarTabla();
        }
    });
    
    document.getElementById('next-page')?.addEventListener('click', () => {
        const totalPages = Math.ceil(filtrarVentas().length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderizarTabla();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModal();
            cerrarModal('venta-ver-modal');
            cerrarModal('cerrar-caja-modal');
        }
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
