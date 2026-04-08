// src/features/clientes/clientes.js

console.log('👥 Clientes feature cargado');

let clientes = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentFilter = 'todos';
let currentSearch = '';
let editingId = null;

// Inicializar
async function init() {
    console.log('👥 Inicializando gestión de clientes...');
    await cargarClientes();
    setupEventListeners();
    setupModalClose();
}

// Cargar clientes desde storage
async function cargarClientes() {
    try {
        const stored = await window.storage?.obtenerTodos('clientes');
        console.log('Clientes cargados desde storage:', stored);
        
        if (stored && stored.length > 0) {
            clientes = stored;
        } else {
            console.log('No hay clientes, cargando datos de ejemplo...');
            clientes = getClientesEjemplo();
            await guardarClientes();
        }
        
        // Forzar renderizado después de cargar
        renderizarTabla();
        actualizarDashboardStats();
        
    } catch (error) {
        console.error('Error cargando clientes:', error);
        clientes = getClientesEjemplo();
        renderizarTabla();
    }
}

// Guardar clientes
async function guardarClientes() {
    try {
        for (const cliente of clientes) {
            await window.storage?.guardar('clientes', cliente);
        }
        console.log('Clientes guardados:', clientes.length);
    } catch (error) {
        console.error('Error guardando clientes:', error);
    }
}

// Actualizar estadísticas en el dashboard
async function actualizarDashboardStats() {
    try {
        const totalClientes = clientes.length;
        // Guardar en localStorage para que el dashboard lo pueda leer
        localStorage.setItem('dashboard_stats', JSON.stringify({
            totalClientes: totalClientes,
            ultimaActualizacion: new Date().toISOString()
        }));
        
        // Disparar evento para actualizar dashboard
        window.dispatchEvent(new CustomEvent('clientes-actualizados', { 
            detail: { total: totalClientes } 
        }));
    } catch (error) {
        console.error('Error actualizando stats:', error);
    }
}

// Datos de ejemplo
function getClientesEjemplo() {
    return [
        { id: 1, nombre: 'Carlos López', telefono: '555-1234', email: 'carlos@email.com', direccion: 'Calle 123', visitas: 12, ultimaVisita: '2024-01-15', gastoTotal: 4200, estado: 'activo', notas: 'Cliente frecuente', nacimiento: '1985-05-10', fechaRegistro: '2024-01-01' },
        { id: 2, nombre: 'Miguel Ángel', telefono: '555-5678', email: 'miguel@email.com', direccion: 'Av. Principal 456', visitas: 8, ultimaVisita: '2024-01-10', gastoTotal: 2800, estado: 'activo', notas: '', nacimiento: '1990-08-22', fechaRegistro: '2024-01-02' },
        { id: 3, nombre: 'Juan Pérez', telefono: '555-9012', email: 'juan@email.com', direccion: 'Boulevard 789', visitas: 5, ultimaVisita: '2024-01-05', gastoTotal: 1750, estado: 'activo', notas: 'Prefiere cortes clásicos', nacimiento: '1982-03-15', fechaRegistro: '2024-01-03' },
        { id: 4, nombre: 'Roberto Gómez', telefono: '555-3456', email: 'roberto@email.com', direccion: 'Callejón 101', visitas: 3, ultimaVisita: '2023-12-20', gastoTotal: 1050, estado: 'inactivo', notas: '', nacimiento: '1995-11-30', fechaRegistro: '2024-01-04' },
        { id: 5, nombre: 'Ana Martínez', telefono: '555-7890', email: 'ana@email.com', direccion: 'Pasaje 202', visitas: 15, ultimaVisita: '2024-01-18', gastoTotal: 5250, estado: 'activo', notas: 'Cliente VIP', nacimiento: '1988-07-08', fechaRegistro: '2024-01-05' }
    ];
}

// Filtrar clientes
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

// Renderizar tabla
function renderizarTabla() {
    const tbody = document.getElementById('clientes-table-body');
    if (!tbody) {
        console.warn('Tabla de clientes no encontrada');
        return;
    }
    
    const filtered = filtrarClientes();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    
    console.log('Renderizando tabla con', paginated.length, 'clientes');
    
    if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No hay clientes registrados</td></tr>`;
        document.getElementById('page-info').textContent = `Página 1 de 1`;
        return;
    }
    
    tbody.innerHTML = paginated.map(cliente => `
        <tr>
            <td>
                <div class="cliente-info">
                    <div class="cliente-avatar">${cliente.nombre.charAt(0)}</div>
                    <div>
                        <div class="cliente-nombre">${cliente.nombre}</div>
                        <div class="cliente-telefono">${cliente.telefono}</div>
                    </div>
                </div>
            </td>
            <td>${cliente.email || 'No registrado'}</td>
            <td>${cliente.visitas || 0}</td>
            <td>${cliente.ultimaVisita ? formatearFecha(cliente.ultimaVisita) : 'N/A'}</td>
            <td>$${(cliente.gastoTotal || 0).toLocaleString()}</td>
            <td><span class="badge-${cliente.estado || 'activo'}">${cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}</span></td>
            <td>
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

// Formatear fecha
function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES');
}

// Ver cliente
window.verCliente = function(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;
    
    const modal = document.getElementById('cliente-ver-modal');
    const detalle = document.getElementById('cliente-detalle');
    
    if (!modal || !detalle) return;
    
    detalle.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 80px; height: 80px; font-size: 2.5rem; background: var(--color-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;">${cliente.nombre.charAt(0)}</div>
            <h3>${cliente.nombre}</h3>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            <div><strong>📞 Teléfono:</strong><br>${cliente.telefono}</div>
            <div><strong>✉️ Email:</strong><br>${cliente.email || 'No registrado'}</div>
            <div><strong>✂️ Visitas:</strong><br>${cliente.visitas || 0}</div>
            <div><strong>💰 Gasto total:</strong><br>$${(cliente.gastoTotal || 0).toLocaleString()}</div>
        </div>
    `;
    
    modal.style.display = 'flex';
};

// Editar cliente
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

// Eliminar cliente
window.eliminarCliente = async function(id) {
    const confirmar = confirm('¿Eliminar este cliente?');
    if (confirmar) {
        clientes = clientes.filter(c => c.id !== id);
        await guardarClientes();
        renderizarTabla();
        actualizarDashboardStats();
        alert('Cliente eliminado');
    }
};

// Nuevo cliente
function nuevoCliente() {
    editingId = null;
    document.getElementById('modal-title').textContent = 'Nuevo Cliente';
    document.getElementById('cliente-form').reset();
    document.getElementById('cliente-estado').value = 'activo';
    document.getElementById('cliente-modal').style.display = 'flex';
}

// Guardar cliente
async function guardarCliente(event) {
    event.preventDefault();
    
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
        ultimaVisita: null,
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
        alert('Cliente actualizado');
    } else {
        clienteData.id = Date.now();
        clientes.push(clienteData);
        alert('Cliente agregado');
    }
    
    await guardarClientes();
    renderizarTabla();
    actualizarDashboardStats();
    cerrarModal();
}

// Cerrar modal
function cerrarModal() {
    document.getElementById('cliente-modal').style.display = 'none';
    document.getElementById('cliente-ver-modal').style.display = 'none';
}

// Configurar cierre de modales con X
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

// Configurar eventos
function setupEventListeners() {
    document.getElementById('btn-nuevo-cliente')?.addEventListener('click', nuevoCliente);
    document.getElementById('cancelar-modal')?.addEventListener('click', cerrarModal);
    document.getElementById('cliente-form')?.addEventListener('submit', guardarCliente);
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
        if (e.key === 'Escape') cerrarModal();
    });
}

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export { init, cargarClientes };
