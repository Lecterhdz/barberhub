// src/features/caja/caja.js

console.log('💰 Caja feature cargado');

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

// Inicializar
async function init() {
    console.log('💰 Inicializando caja...');
    await cargarDatos();
    setupEventListeners();
    renderizarTabla();
    actualizarResumen();
}

// Cargar datos
async function cargarDatos() {
    try {
        ventas = await window.storage?.obtenerTodos('ventas') || getVentasEjemplo();
        clientes = await window.storage?.obtenerTodos('clientes') || [];
        servicios = await window.storage?.obtenerTodos('servicios') || [];
        productos = await window.storage?.obtenerTodos('productos') || [];
        
        if (ventas.length === 0) {
            ventas = getVentasEjemplo();
            await guardarVentas();
        }
        
        await cargarSelectores();
    } catch (error) {
        console.error('Error cargando datos:', error);
        ventas = getVentasEjemplo();
        servicios = getServiciosEjemplo();
        productos = getProductosEjemplo();
    }
}

// Datos de ejemplo
function getVentasEjemplo() {
    const hoy = new Date().toISOString().split('T')[0];
    return [
        { id: 1, fecha: hoy, clienteId: 1, clienteNombre: 'Carlos López', tipo: 'servicio', itemId: 1, itemNombre: 'Corte de Cabello', cantidad: 1, precio: 350, total: 350, metodo: 'efectivo', estado: 'pagado', recibido: 500, cambio: 150 },
        { id: 2, fecha: hoy, clienteId: 2, clienteNombre: 'Miguel Ángel', tipo: 'servicio', itemId: 2, itemNombre: 'Barba', cantidad: 1, precio: 200, total: 200, metodo: 'tarjeta', estado: 'pagado' },
        { id: 3, fecha: hoy, clienteId: null, clienteNombre: 'Cliente general', tipo: 'producto', itemId: 1, itemNombre: 'Shampoo Profesional', cantidad: 2, precio: 250, total: 500, metodo: 'efectivo', estado: 'pagado', recibido: 500, cambio: 0 }
    ];
}

function getServiciosEjemplo() {
    return [
        { id: 1, nombre: 'Corte de Cabello', precio: 350 },
        { id: 2, nombre: 'Barba', precio: 200 },
        { id: 3, nombre: 'Corte + Barba', precio: 500 }
    ];
}

function getProductosEjemplo() {
    return [
        { id: 1, nombre: 'Shampoo Profesional', precio: 250, stock: 15 },
        { id: 2, nombre: 'Cera para barba', precio: 180, stock: 8 }
    ];
}

// Guardar ventas
async function guardarVentas() {
    try {
        for (const venta of ventas) {
            await window.storage?.guardar('ventas', venta);
        }
    } catch (error) {
        console.error('Error guardando ventas:', error);
    }
}

// Cargar selectores
async function cargarSelectores() {
    const clienteSelect = document.getElementById('venta-cliente');
    const servicioSelect = document.getElementById('venta-servicio');
    const productoSelect = document.getElementById('venta-producto');
    
    if (clienteSelect) {
        clienteSelect.innerHTML = '<option value="">Cliente general</option>' +
            clientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    }
    
    if (servicioSelect) {
        servicioSelect.innerHTML = '<option value="">Seleccionar servicio</option>' +
            servicios.map(s => `<option value="${s.id}" data-precio="${s.precio}">${s.nombre} - $${s.precio}</option>`).join('');
    }
    
    if (productoSelect) {
        productoSelect.innerHTML = '<option value="">Seleccionar producto</option>' +
            productos.map(p => `<option value="${p.id}" data-precio="${p.precio}" data-stock="${p.stock}">${p.nombre} - $${p.precio} (Stock: ${p.stock})</option>`).join('');
    }
}

// Filtrar ventas por fecha
function filtrarVentasPorFecha() {
    const hoy = new Date();
    let fechaLimite = new Date();
    
    switch (currentFiltro.fecha) {
        case 'hoy':
            fechaLimite = hoy;
            break;
        case 'ayer':
            fechaLimite.setDate(hoy.getDate() - 1);
            break;
        case 'semana':
            fechaLimite.setDate(hoy.getDate() - 7);
            break;
        case 'mes':
            fechaLimite.setMonth(hoy.getMonth() - 1);
            break;
    }
    
    return ventas.filter(v => {
        const fechaVenta = new Date(v.fecha);
        if (currentFiltro.fecha === 'hoy' || currentFiltro.fecha === 'ayer') {
            return fechaVenta.toDateString() === fechaLimite.toDateString();
        }
        return fechaVenta >= fechaLimite;
    });
}

// Filtrar ventas
function filtrarVentas() {
    let filtered = filtrarVentasPorFecha();
    
    if (currentFiltro.metodo !== 'todos') {
        filtered = filtered.filter(v => v.metodo === currentFiltro.metodo);
    }
    
    return filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

// Actualizar resumen
function actualizarResumen() {
    const ventasFiltradas = filtrarVentasPorFecha();
    const totalVentas = ventasFiltradas.reduce((sum, v) => sum + v.total, 0);
    const citasCompletadas = ventasFiltradas.filter(v => v.tipo === 'servicio').length;
    
    document.getElementById('ventas-dia').textContent = `$${totalVentas.toLocaleString()}`;
    document.getElementById('total-ventas').textContent = `$${ventas.reduce((sum, v) => sum + v.total, 0).toLocaleString()}`;
    document.getElementById('citas-completadas').textContent = citasCompletadas;
}

// Renderizar tabla
function renderizarTabla() {
    const tbody = document.getElementById('ventas-table-body');
    if (!tbody) return;
    
    const filtered = filtrarVentas();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    
    if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No hay ventas registradas</td></tr>`;
        document.getElementById('page-info').textContent = `Página 1 de 1`;
        return;
    }
    
    tbody.innerHTML = paginated.map(venta => `
        <tr onclick="verVenta(${venta.id})">
            <td>${formatearFecha(venta.fecha)}</td>
            <td>${venta.clienteNombre || 'Cliente general'}</td>
            <td>${venta.itemNombre} ${venta.cantidad > 1 ? `x${venta.cantidad}` : ''}</td>
            <td>$${venta.total.toLocaleString()}</td>
            <td><span class="metodo-badge metodo-${venta.metodo}">${getMetodoTexto(venta.metodo)}</span></td>
            <td><span class="estado-pagado">${venta.estado === 'pagado' ? '✓ Pagado' : venta.estado === 'anulado' ? '✗ Anulado' : '⏳ Pendiente'}</span></td>
            <td onclick="event.stopPropagation()">
                <button class="btn-icon-sm" onclick="anularVenta(${venta.id})" title="Anular" ${venta.estado === 'anulado' ? 'disabled' : ''}>🗑️</button>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages || 1}`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
}

// Ver venta
window.verVenta = function(id) {
    const venta = ventas.find(v => v.id === id);
    if (!venta) return;
    
    const detalle = document.getElementById('venta-detalle');
    detalle.innerHTML = `
        <div class="info-row"><label>Fecha:</label><span>${formatearFecha(venta.fecha)}</span></div>
        <div class="info-row"><label>Cliente:</label><span>${venta.clienteNombre || 'Cliente general'}</span></div>
        <div class="info-row"><label>Tipo:</label><span>${venta.tipo === 'servicio' ? '✂️ Servicio' : '📦 Producto'}</span></div>
        <div class="info-row"><label>Item:</label><span>${venta.itemNombre}</span></div>
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

// Anular venta
window.anularVenta = async function(id) {
    const confirmar = await window.utils?.confirmar('¿Anular esta venta? Esta acción no se puede deshacer.');
    if (confirmar) {
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
                }
            }
            
            renderizarTabla();
            actualizarResumen();
            window.utils?.mostrarNotificacion('Venta anulada', 'warning');
        }
        cerrarModal('venta-ver-modal');
    }
};

// Nueva venta
function nuevaVenta() {
    editingId = null;
    document.getElementById('venta-form').reset();
    document.getElementById('venta-tipo').value = 'servicio';
    document.getElementById('venta-cantidad').value = '1';
    toggleTipoVenta();
    document.getElementById('venta-modal').style.display = 'flex';
}

// Toggle tipo de venta
function toggleTipoVenta() {
    const tipo = document.getElementById('venta-tipo').value;
    const servicioGroup = document.getElementById('servicio-group');
    const productoGroup = document.getElementById('producto-group');
    const efectivoGroup = document.getElementById('efectivo-group');
    
    if (tipo === 'servicio') {
        servicioGroup.style.display = 'block';
        productoGroup.style.display = 'none';
    } else {
        servicioGroup.style.display = 'none';
        productoGroup.style.display = 'block';
    }
    
    // Mostrar campo de efectivo solo si es efectivo
    const metodo = document.getElementById('venta-metodo').value;
    efectivoGroup.style.display = metodo === 'efectivo' ? 'block' : 'none';
}

// Calcular cambio
function calcularCambio() {
    const precio = parseInt(document.getElementById('venta-precio').value) || 0;
    const recibido = parseInt(document.getElementById('venta-recibido').value) || 0;
    const cambio = recibido - precio;
    const cambioInfo = document.getElementById('cambio-info');
    
    if (cambio >= 0) {
        cambioInfo.textContent = `Cambio: $${cambio.toLocaleString()}`;
        cambioInfo.style.color = '#4caf50';
    } else {
        cambioInfo.textContent = `Faltan: $${Math.abs(cambio).toLocaleString()}`;
        cambioInfo.style.color = '#f44336';
    }
}

// Actualizar precio al seleccionar item
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
    
    document.getElementById('venta-precio').value = precio;
    calcularCambio();
}

// Guardar venta
async function guardarVenta(event) {
    event.preventDefault();
    
    const tipo = document.getElementById('venta-tipo').value;
    const itemId = tipo === 'servicio' 
        ? document.getElementById('venta-servicio').value 
        : document.getElementById('venta-producto').value;
    const itemNombre = tipo === 'servicio'
        ? document.getElementById('venta-servicio').options[document.getElementById('venta-servicio').selectedIndex]?.text.split(' -')[0]
        : document.getElementById('venta-producto').options[document.getElementById('venta-producto').selectedIndex]?.text.split(' -')[0];
    const cantidad = parseInt(document.getElementById('venta-cantidad').value);
    const precio = parseInt(document.getElementById('venta-precio').value);
    const total = precio * cantidad;
    const metodo = document.getElementById('venta-metodo').value;
    const recibido = metodo === 'efectivo' ? parseInt(document.getElementById('venta-recibido').value) : total;
    const cambio = metodo === 'efectivo' ? recibido - total : 0;
    const clienteId = document.getElementById('venta-cliente').value;
    const clienteNombre = clienteId ? clientes.find(c => c.id == clienteId)?.nombre : 'Cliente general';
    
    if (!itemId) {
        alert('Seleccione un servicio o producto');
        return;
    }
    
    // Verificar stock para productos
    if (tipo === 'producto') {
        const producto = productos.find(p => p.id == itemId);
        if (!producto || producto.stock < cantidad) {
            alert('Stock insuficiente');
            return;
        }
        producto.stock -= cantidad;
        await window.storage?.guardar('productos', producto);
    }
    
    const nuevaVenta = {
        id: Date.now(),
        fecha: new Date().toISOString().split('T')[0],
        clienteId: clienteId || null,
        clienteNombre: clienteNombre,
        tipo: tipo,
        itemId: parseInt(itemId),
        itemNombre: itemNombre,
        cantidad: cantidad,
        precio: precio,
        total: total,
        metodo: metodo,
        estado: 'pagado',
        recibido: metodo === 'efectivo' ? recibido : null,
        cambio: metodo === 'efectivo' ? cambio : null
    };
    
    ventas.push(nuevaVenta);
    await guardarVentas();
    
    renderizarTabla();
    actualizarResumen();
    cerrarModal();
    window.utils?.mostrarNotificacion('Venta registrada', 'success');
}

// Cerrar caja
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
    
    if (efectivoReal > 0) {
        diferenciaContainer.style.display = 'flex';
        diferenciaValor.textContent = `${diferencia >= 0 ? '+' : ''}$${Math.abs(diferencia).toLocaleString()}`;
        diferenciaValor.style.color = diferencia === 0 ? '#4caf50' : diferencia > 0 ? '#ff9800' : '#f44336';
    }
}

function confirmarCierre() {
    const efectivoReal = parseInt(document.getElementById('cierre-efectivo-real').value) || 0;
    if (efectivoReal === 0) {
        alert('Ingrese el monto real en caja');
        return;
    }
    
    window.utils?.mostrarNotificacion('Caja cerrada correctamente', 'success');
    cerrarModal('cerrar-caja-modal');
}

// Configurar eventos
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

// Funciones auxiliares
function formatearFecha(fecha) {
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

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export { init, cargarDatos };
