// src/views/admin/clientes/clientes.js

console.log('👥 Admin - Clientes');

// Estado local
let clientes = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentFilter = 'todos';
let currentSearch = '';
let editingId = null;

// ============================================
// INICIALIZACIÓN
// ============================================

async function init() {
    console.log('🚀 Inicializando gestión de clientes...');
    
    await cargarClientes();
    setupEventListeners();
    setupModalClose();
    renderizarTabla();
}

async function cargarClientes() {
    // Obtener del caché global
    if (window.app && window.app.estado && window.app.estado.cache.clientes) {
        clientes = window.app.estado.cache.clientes;
    } else {
        clientes = await window.storage?.obtenerTodos('clientes') || [];
    }
    
    console.log(`📦 ${clientes.length} clientes cargados`);
}

// ============================================
// FILTRADO
// ============================================

function filtrarClientes() {
    let filtered = [...clientes];
    
    if (currentFilter !== 'todos') {
        filtered = filtered.filter(c => c.estado === currentFilter);
    }
    
    if (currentSearch) {
        const searchLower = currentSearch.toLowerCase();
        filtered = filtered.filter(c => 
            c.nombre.toLowerCase().includes(searchLower) ||
            c.telefono.includes(searchLower) ||
            (c.email && c.email.toLowerCase().includes(searchLower))
        );
    }
    
    return filtered;
}

// ============================================
// RENDERIZADO
// ============================================

function renderizarTabla() {
    const tbody = document.getElementById('clientes-table-body');
    if (!tbody) return;
    
    const filtered = filtrarClientes();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    
    if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No hay clientes registrados</td></tr>`;
        document.getElementById('page-info').textContent = 'Página 1 de 1';
        return;
    }
    
    tbody.innerHTML = paginated.map(cliente => `
        <tr>
            <td onclick="verCliente(${cliente.id})">
                <div class="cliente-info">
                    <div class="cliente-avatar">${cliente.nombre.charAt(0).toUpperCase()}</div>
                    <div>
                        <div class="cliente-nombre">${escapeHtml(cliente.nombre)}</div>
                        <div class="cliente-telefono">${cliente.telefono}</div>
                    </div>
                </div>
            </td>
            <td onclick="verCliente(${cliente.id})">${escapeHtml(cliente.email || 'No registrado')}</td>
            <td onclick="verCliente(${cliente.id})" style="text-align: center;">${cliente.visitas || 0}</td>
            <td onclick="verCliente(${cliente.id})">${formatearFecha(cliente.ultimaVisita)}</td>
            <td onclick="verCliente(${cliente.id})" style="color: var(--color-primary); font-weight: bold;">$${(cliente.gastoTotal || 0).toLocaleString()}</td>
            <td onclick="verCliente(${cliente.id})">
                <span class="badge-${cliente.estado || 'activo'}">
                    ${cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td onclick="event.stopPropagation()">
                <div class="acciones-btns">
                    <button class="btn-icon-sm btn-ver" onclick="verCliente(${cliente.id})" title="Ver">👁️</button>
                    <button class="btn-icon-sm btn-editar" onclick="editarCliente(${cliente.id})" title="Editar">✏️</button>
                    <button class="btn-icon-sm btn-eliminar" onclick="eliminarCliente(${cliente.id})" title="Eliminar">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages || 1}`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
}

// ============================================
// CRUD
// ============================================

window.verCliente = async function(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;
    
    // Cargar historial de citas
    const citas = await window.storage?.obtenerTodos('citas') || [];
    const citasCliente = citas.filter(c => c.clienteTelefono === cliente.telefono);
    
    const modal = document.getElementById('cliente-ver-modal');
    const detalle = document.getElementById('cliente-detalle');
    
    detalle.innerHTML = `
        <div class="cliente-detalle-header">
            <div class="cliente-avatar-large">${cliente.nombre.charAt(0).toUpperCase()}</div>
            <h3>${escapeHtml(cliente.nombre)}</h3>
            <p class="cliente-desde">Cliente desde: ${formatearFecha(cliente.fechaRegistro)}</p>
        </div>
        
        <div class="cliente-info-grid">
            <div class="info-item">
                <label>📞 Teléfono</label>
                <p>${cliente.telefono}</p>
            </div>
            <div class="info-item">
                <label>✉️ Email</label>
                <p>${escapeHtml(cliente.email || 'No registrado')}</p>
            </div>
            <div class="info-item">
                <label>🎂 Nacimiento</label>
                <p>${cliente.nacimiento ? formatearFecha(cliente.nacimiento) : 'No registrado'}</p>
            </div>
            <div class="info-item">
                <label>📍 Dirección</label>
                <p>${escapeHtml(cliente.direccion || 'No registrada')}</p>
            </div>
            <div class="info-item">
                <label>✂️ Visitas</label>
                <p>${cliente.visitas || 0}</p>
            </div>
            <div class="info-item">
                <label>💰 Gasto total</label>
                <p>$${(cliente.gastoTotal || 0).toLocaleString()}</p>
            </div>
        </div>
        
        ${cliente.notas ? `
            <div class="cliente-historial">
                <h4>📝 Notas</h4>
                <p>${escapeHtml(cliente.notas)}</p>
            </div>
        ` : ''}
        
        <div class="cliente-historial">
            <h4>📋 Historial de Citas (${citasCliente.length})</h4>
            ${citasCliente.length === 0 ? '<p>No hay citas registradas</p>' : `
                <div style="max-height: 200px; overflow-y: auto;">
                    ${citasCliente.slice(0, 10).map(cita => `
                        <div style="padding: 8px; border-bottom: 1px solid var(--border-color);">
                            <div><strong>${formatearFecha(cita.fecha)} - ${cita.hora}</strong></div>
                            <div>${cita.servicioNombre} con ${cita.barberoNombre}</div>
                            <div>Estado: ${cita.estado || 'Pendiente'} | Total: $${(cita.precio || 0).toLocaleString()}</div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
    
    modal.style.display = 'flex';
    window.currentClienteId = id;
};

window.editarCliente = function(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;
    
    editingId = id;
    document.getElementById('modal-title').textContent = 'Editar Cliente';
    document.getElementById('cliente-nombre').value = cliente.nombre;
    document.getElementById('cliente-telefono').value = cliente.telefono;
    document.getElementById('cliente-email').value = cliente.email || '';
    document.getElementById('cliente-nacimiento').value = cliente.nacimiento || '';
    document.getElementById('cliente-direccion').value = cliente.direccion || '';
    document.getElementById('cliente-notas').value = cliente.notas || '';
    document.getElementById('cliente-estado').value = cliente.estado || 'activo';
    
    document.getElementById('cliente-modal').style.display = 'flex';
};

window.eliminarCliente = async function(id) {
    const confirmar = confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.');
    if (!confirmar) return;
    
    const index = clientes.findIndex(c => c.id === id);
    if (index !== -1) {
        clientes.splice(index, 1);
        await window.storage?.guardarMultiples('clientes', clientes);
        
        // Actualizar caché global
        if (window.app && window.app.estado) {
            window.app.estado.cache.clientes = clientes;
        }
        
        renderizarTabla();
        window.app?.mostrarNotificacion('Cliente eliminado', 'success');
    }
};

function nuevoCliente() {
    editingId = null;
    document.getElementById('modal-title').textContent = 'Nuevo Cliente';
    document.getElementById('cliente-form').reset();
    document.getElementById('cliente-estado').value = 'activo';
    document.getElementById('cliente-modal').style.display = 'flex';
}

async function guardarCliente(e) {
    e.preventDefault();
    
    const clienteData = {
        nombre: document.getElementById('cliente-nombre').value,
        telefono: document.getElementById('cliente-telefono').value,
        email: document.getElementById('cliente-email').value,
        nacimiento: document.getElementById('cliente-nacimiento').value,
        direccion: document.getElementById('cliente-direccion').value,
        notas: document.getElementById('cliente-notas').value,
        estado: document.getElementById('cliente-estado').value,
        visitas: 0,
        gastoTotal: 0,
        fechaRegistro: new Date().toISOString()
    };
    
    if (editingId) {
        const index = clientes.findIndex(c => c.id === editingId);
        if (index !== -1) {
            clienteData.id = editingId;
            clienteData.visitas = clientes[index].visitas || 0;
            clienteData.gastoTotal = clientes[index].gastoTotal || 0;
            clientes[index] = { ...clientes[index], ...clienteData };
        }
        window.app?.mostrarNotificacion('Cliente actualizado', 'success');
    } else {
        clienteData.id = Date.now();
        clientes.push(clienteData);
        window.app?.mostrarNotificacion('Cliente agregado', 'success');
    }
    
    await window.storage?.guardarMultiples('clientes', clientes);
    
    // Actualizar caché global
    if (window.app && window.app.estado) {
        window.app.estado.cache.clientes = clientes;
    }
    
    renderizarTabla();
    cerrarModal();
}

// ============================================
// MODALES
// ============================================

function cerrarModal() {
    document.getElementById('cliente-modal').style.display = 'none';
    document.getElementById('cliente-ver-modal').style.display = 'none';
}

function setupModalClose() {
    const modal = document.getElementById('cliente-modal');
    if (modal) {
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
        modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    }
    
    const verModal = document.getElementById('cliente-ver-modal');
    if (verModal) {
        const closeBtn = verModal.querySelector('.modal-close');
        if (closeBtn) closeBtn.onclick = () => verModal.style.display = 'none';
        verModal.onclick = (e) => { if (e.target === verModal) verModal.style.display = 'none'; };
    }
}

function editarDesdeVer() {
    cerrarModal('cliente-ver-modal');
    if (window.currentClienteId) {
        editarCliente(window.currentClienteId);
    }
}

// ============================================
// EVENTOS
// ============================================

function setupEventListeners() {
    document.getElementById('btn-nuevo-cliente')?.addEventListener('click', nuevoCliente);
    document.getElementById('cancelar-modal')?.addEventListener('click', cerrarModal);
    document.getElementById('cliente-form')?.addEventListener('submit', guardarCliente);
    document.getElementById('cerrar-ver-modal')?.addEventListener('click', () => cerrarModal('cliente-ver-modal'));
    document.getElementById('editar-ver-modal')?.addEventListener('click', editarDesdeVer);
    
    document.getElementById('search-cliente')?.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        currentPage = 1;
        renderizarTabla();
    });
    
    document.getElementById('filtro-estado')?.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        currentPage = 1;
        renderizarTabla();
    });
    
    document.getElementById('btn-exportar')?.addEventListener('click', () => {
        exportarClientes();
    });
    
    document.getElementById('prev-page')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderizarTabla();
        }
    });
    
    document.getElementById('next-page')?.addEventListener('click', () => {
        const totalPages = Math.ceil(filtrarClientes().length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderizarTabla();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModal();
        }
    });
}

// ============================================
// EXPORTAR
// ============================================

function exportarClientes() {
    const data = filtrarClientes().map(c => ({
        Nombre: c.nombre,
        Teléfono: c.telefono,
        Email: c.email || '',
        Dirección: c.direccion || '',
        Visitas: c.visitas || 0,
        'Gasto total': c.gastoTotal || 0,
        Estado: c.estado === 'activo' ? 'Activo' : 'Inactivo',
        'Fecha registro': formatearFecha(c.fechaRegistro)
    }));
    
    const csv = [
        Object.keys(data[0] || {}).join(','),
        ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes_${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    window.app?.mostrarNotificacion('Clientes exportados', 'success');
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
