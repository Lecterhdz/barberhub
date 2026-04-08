// src/features/inventario/inventario.js

console.log('📦 Inventario feature cargado');

let productos = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentFiltros = {
    categoria: 'todos',
    stock: 'todos',
    busqueda: ''
};
let editingId = null;
let currentStockId = null;

// Inicializar
async function init() {
    console.log('📦 Inicializando inventario...');
    await cargarProductos();
    setupEventListeners();
    renderizarTabla();
    verificarAlertasStock();
    setupModalClose();
}

// Cargar productos
async function cargarProductos() {
    try {
        const stored = await window.storage?.obtenerTodos('productos');
        if (stored && stored.length > 0) {
            productos = stored;
        } else {
            productos = getProductosEjemplo();
            await guardarProductos();
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
        productos = getProductosEjemplo();
    }
}

// Datos de ejemplo
function getProductosEjemplo() {
    return [
        { id: 1, nombre: 'Shampoo Profesional', categoria: 'Cabello', precio: 250, costo: 120, stock: 15, stockMinimo: 5, descripcion: 'Shampoo para todo tipo de cabello', proveedor: 'Loreal' },
        { id: 2, nombre: 'Acondicionador', categoria: 'Cabello', precio: 250, costo: 120, stock: 8, stockMinimo: 5, descripcion: 'Acondicionador hidratante', proveedor: 'Loreal' },
        { id: 3, nombre: 'Cera para barba', categoria: 'Barba', precio: 180, costo: 80, stock: 3, stockMinimo: 5, descripcion: 'Cera modeladora para barba', proveedor: 'Pinaud' },
        { id: 4, nombre: 'Aceite para barba', categoria: 'Barba', precio: 220, costo: 100, stock: 2, stockMinimo: 5, descripcion: 'Aceite nutritivo', proveedor: 'Pinaud' },
        { id: 5, nombre: 'Navaja de seguridad', categoria: 'Afeitado', precio: 350, costo: 200, stock: 5, stockMinimo: 3, descripcion: 'Navaja clásica', proveedor: 'Merkur' },
        { id: 6, nombre: 'Cuchillas (paquete)', categoria: 'Afeitado', precio: 150, costo: 70, stock: 10, stockMinimo: 5, descripcion: '10 cuchillas', proveedor: 'Merkur' }
    ];
}

// Guardar productos
async function guardarProductos() {
    try {
        for (const producto of productos) {
            await window.storage?.guardar('productos', producto);
        }
    } catch (error) {
        console.error('Error guardando productos:', error);
    }
}

// Filtrar productos
function filtrarProductos() {
    let filtered = [...productos];
    
    if (currentFiltros.categoria !== 'todos') {
        filtered = filtered.filter(p => p.categoria === currentFiltros.categoria);
    }
    
    if (currentFiltros.stock !== 'todos') {
        if (currentFiltros.stock === 'bajo') {
            filtered = filtered.filter(p => p.stock <= p.stockMinimo && p.stock > 0);
        } else if (currentFiltros.stock === 'agotado') {
            filtered = filtered.filter(p => p.stock === 0);
        } else if (currentFiltros.stock === 'normal') {
            filtered = filtered.filter(p => p.stock > p.stockMinimo);
        }
    }
    
    if (currentFiltros.busqueda) {
        const searchLower = currentFiltros.busqueda.toLowerCase();
        filtered = filtered.filter(p => 
            p.nombre.toLowerCase().includes(searchLower) ||
            (p.proveedor && p.proveedor.toLowerCase().includes(searchLower))
        );
    }
    
    return filtered;
}

// Verificar alertas de stock
function verificarAlertasStock() {
    const productosBajo = productos.filter(p => p.stock <= p.stockMinimo && p.stock > 0);
    const productosAgotados = productos.filter(p => p.stock === 0);
    const alertas = [...productosBajo, ...productosAgotados];
    
    const alertasContainer = document.getElementById('alertas-stock');
    const listaAlertas = document.getElementById('lista-alertas');
    
    if (alertas.length === 0) {
        alertasContainer.style.display = 'none';
        return;
    }
    
    alertasContainer.style.display = 'block';
    listaAlertas.innerHTML = alertas.map(p => `
        <div class="alerta-item">
            <span>${p.stock === 0 ? '❌' : '⚠️'}</span>
            <span>${p.nombre}</span>
            <span class="stock-bajo">Stock: ${p.stock} / ${p.stockMinimo}</span>
            <button class="btn-icon-sm" onclick="abrirAjustarStock(${p.id})" style="margin-left: auto;">➕</button>
        </div>
    `).join('');
}

// Renderizar tabla
function renderizarTabla() {
    const tbody = document.getElementById('productos-table-body');
    if (!tbody) return;
    
    const filtered = filtrarProductos();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    
    if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No hay productos registrados</td></tr>`;
        document.getElementById('page-info').textContent = `Página 1 de 1`;
        return;
    }
    
    tbody.innerHTML = paginated.map(producto => {
        let stockClass = 'stock-normal';
        let stockText = `${producto.stock} / ${producto.stockMinimo}`;
        
        if (producto.stock === 0) {
            stockClass = 'stock-agotado';
            stockText = 'Agotado';
        } else if (producto.stock <= producto.stockMinimo) {
            stockClass = 'stock-bajo';
            stockText = `${producto.stock} / ${producto.stockMinimo}`;
        }
        
        const ganancia = producto.precio - producto.costo;
        const gananciaClass = ganancia > 0 ? 'ganancia-positiva' : 'ganancia-negativa';
        
        return `
            <tr>
                <td>
                    <div>
                        <div style="font-weight: 600;">${producto.nombre}</div>
                        ${producto.descripcion ? `<div style="font-size: 0.75rem; color: var(--text-secondary);">${producto.descripcion.substring(0, 40)}</div>` : ''}
                    </div>
                </td>
                <td>${producto.categoria}</td>
                <td>$${producto.precio.toLocaleString()}</td>
                <td>$${producto.costo.toLocaleString()}</td>
                <td><span class="stock-badge ${stockClass}">${stockText}</span></td>
                <td class="${gananciaClass}">$${ganancia.toLocaleString()}</td>
                <td>
                    <div class="acciones-btns">
                        <button class="btn-icon-sm btn-stock" onclick="abrirAjustarStock(${producto.id})" title="Ajustar stock">📦</button>
                        <button class="btn-icon-sm" onclick="verProducto(${producto.id})" title="Ver">👁️</button>
                        <button class="btn-icon-sm" onclick="editarProducto(${producto.id})" title="Editar">✏️</button>
                        <button class="btn-icon-sm" onclick="eliminarProducto(${producto.id})" title="Eliminar">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages || 1}`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
}

// Ver producto
window.verProducto = function(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;
    
    const ganancia = producto.precio - producto.costo;
    const margen = ((ganancia / producto.precio) * 100).toFixed(1);
    
    const detalle = document.getElementById('producto-detalle');
    detalle.innerHTML = `
        <div class="info-row">
            <label>Nombre:</label>
            <span>${producto.nombre}</span>
        </div>
        <div class="info-row">
            <label>Categoría:</label>
            <span>${producto.categoria}</span>
        </div>
        <div class="info-row">
            <label>Precio venta:</label>
            <span>$${producto.precio.toLocaleString()}</span>
        </div>
        <div class="info-row">
            <label>Costo:</label>
            <span>$${producto.costo.toLocaleString()}</span>
        </div>
        <div class="info-row">
            <label>Ganancia:</label>
            <span class="${ganancia > 0 ? 'ganancia-positiva' : 'ganancia-negativa'}">$${ganancia.toLocaleString()} (${margen}%)</span>
        </div>
        <div class="info-row">
            <label>Stock:</label>
            <span>${producto.stock} / ${producto.stockMinimo} mínimo</span>
        </div>
        <div class="info-row">
            <label>Proveedor:</label>
            <span>${producto.proveedor || 'No especificado'}</span>
        </div>
        ${producto.descripcion ? `
        <div class="info-row">
            <label>Descripción:</label>
            <span>${producto.descripcion}</span>
        </div>
        ` : ''}
    `;
    
    window.currentProductoId = id;
    document.getElementById('producto-ver-modal').style.display = 'flex';
};

// Editar producto
window.editarProducto = function(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;
    
    editingId = id;
    document.getElementById('modal-title').textContent = 'Editar Producto';
    document.getElementById('producto-nombre').value = producto.nombre;
    document.getElementById('producto-categoria').value = producto.categoria;
    document.getElementById('producto-precio').value = producto.precio;
    document.getElementById('producto-costo').value = producto.costo;
    document.getElementById('producto-stock').value = producto.stock;
    document.getElementById('producto-stock-minimo').value = producto.stockMinimo;
    document.getElementById('producto-descripcion').value = producto.descripcion || '';
    document.getElementById('producto-proveedor').value = producto.proveedor || '';
    
    document.getElementById('producto-modal').style.display = 'flex';
};

// Eliminar producto
window.eliminarProducto = async function(id) {
    const confirmar = await window.utils?.confirmar('¿Eliminar este producto?');
    if (confirmar) {
        productos = productos.filter(p => p.id !== id);
        await guardarProductos();
        renderizarTabla();
        verificarAlertasStock();
        window.utils?.mostrarNotificacion('Producto eliminado', 'success');
    }
};

// Nuevo producto
function nuevoProducto() {
    editingId = null;
    document.getElementById('modal-title').textContent = 'Nuevo Producto';
    document.getElementById('producto-form').reset();
    document.getElementById('producto-stock-minimo').value = '5';
    document.getElementById('producto-modal').style.display = 'flex';
}

// Guardar producto
async function guardarProducto(event) {
    event.preventDefault();
    
    const productoData = {
        nombre: document.getElementById('producto-nombre').value,
        categoria: document.getElementById('producto-categoria').value,
        precio: parseInt(document.getElementById('producto-precio').value),
        costo: parseInt(document.getElementById('producto-costo').value),
        stock: parseInt(document.getElementById('producto-stock').value),
        stockMinimo: parseInt(document.getElementById('producto-stock-minimo').value),
        descripcion: document.getElementById('producto-descripcion').value,
        proveedor: document.getElementById('producto-proveedor').value
    };
    
    if (editingId) {
        const index = productos.findIndex(p => p.id === editingId);
        if (index !== -1) {
            productoData.id = editingId;
            productos[index] = { ...productos[index], ...productoData };
        }
        window.utils?.mostrarNotificacion('Producto actualizado', 'success');
    } else {
        productoData.id = Date.now();
        productos.push(productoData);
        window.utils?.mostrarNotificacion('Producto agregado', 'success');
    }
    
    await guardarProductos();
    renderizarTabla();
    verificarAlertasStock();
    cerrarModal();
}

// Ajustar stock
window.abrirAjustarStock = function(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;
    
    currentStockId = id;
    document.getElementById('stock-producto-nombre').value = producto.nombre;
    document.getElementById('stock-actual').value = producto.stock;
    document.getElementById('stock-cantidad').value = '';
    document.getElementById('stock-tipo').value = 'entrada';
    document.getElementById('stock-motivo').value = '';
    
    document.getElementById('stock-modal').style.display = 'flex';
};

function aplicarAjusteStock() {
    const producto = productos.find(p => p.id === currentStockId);
    if (!producto) return;
    
    const tipo = document.getElementById('stock-tipo').value;
    const cantidad = parseInt(document.getElementById('stock-cantidad').value);
    const motivo = document.getElementById('stock-motivo').value;
    
    if (!cantidad || cantidad <= 0) {
        alert('Ingrese una cantidad válida');
        return;
    }
    
    if (tipo === 'entrada') {
        producto.stock += cantidad;
    } else {
        if (producto.stock - cantidad < 0) {
            alert('No hay suficiente stock');
            return;
        }
        producto.stock -= cantidad;
    }
    
    guardarProductos().then(() => {
        renderizarTabla();
        verificarAlertasStock();
        window.utils?.mostrarNotificacion(`Stock ajustado: ${tipo === 'entrada' ? '+' : '-'}${cantidad}`, 'success');
        cerrarModal('stock-modal');
    });
}

// Editar desde ver
function editarDesdeVer() {
    cerrarModal('producto-ver-modal');
    if (window.currentProductoId) {
        editarProducto(window.currentProductoId);
    }
}

// Cerrar modal
function cerrarModal(modalId = 'producto-modal') {
    document.getElementById(modalId).style.display = 'none';
}

function setupModalClose() {
    const modal = document.getElementById('producto-modal');
    if (modal) {
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
        modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    }
    const verModal = document.getElementById('producto-ver-modal');
    if (verModal) {
        const closeBtn = verModal.querySelector('.modal-close');
        if (closeBtn) closeBtn.onclick = () => verModal.style.display = 'none';
        verModal.onclick = (e) => { if (e.target === verModal) verModal.style.display = 'none'; };
    }
}

// Configurar eventos
function setupEventListeners() {
    document.getElementById('btn-nuevo-producto')?.addEventListener('click', nuevoProducto);
    document.getElementById('cancelar-modal')?.addEventListener('click', () => cerrarModal());
    document.getElementById('producto-form')?.addEventListener('submit', guardarProducto);
    document.getElementById('cerrar-ver-modal')?.addEventListener('click', () => cerrarModal('producto-ver-modal'));
    document.getElementById('editar-desde-ver')?.addEventListener('click', editarDesdeVer);
    document.getElementById('cancelar-stock')?.addEventListener('click', () => cerrarModal('stock-modal'));
    document.getElementById('confirmar-stock')?.addEventListener('click', aplicarAjusteStock);
    
    document.getElementById('search-producto')?.addEventListener('input', (e) => {
        currentFiltros.busqueda = e.target.value;
        currentPage = 1;
        renderizarTabla();
    });
    
    document.getElementById('filtro-categoria')?.addEventListener('change', (e) => {
        currentFiltros.categoria = e.target.value;
        currentPage = 1;
        renderizarTabla();
    });
    
    document.getElementById('filtro-stock')?.addEventListener('change', (e) => {
        currentFiltros.stock = e.target.value;
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
        const totalPages = Math.ceil(filtrarProductos().length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderizarTabla();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModal();
            cerrarModal('producto-ver-modal');
            cerrarModal('stock-modal');
        }
    });
}

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export { init, cargarProductos };
