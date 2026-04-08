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
        console.log('Clientes cargados:', stored?.length || 0);
        
        if (stored && stored.length > 0) {
            clientes = stored;
        } else {
            clientes = getClientesEjemplo();
            await guardarClientes();
        }
        
        // ✅ IMPORTANTE: Renderizar después de cargar
        renderizarTabla();
        
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

// Datos de ejemplo
function getClientesEjemplo() {
    return [
        { id: 1, nombre: 'Carlos López', telefono: '555-1234', email: 'carlos@email.com', direccion: 'Calle 123', visitas: 12, ultimaVisita: '2024-01-15', gastoTotal: 4200, estado: 'activo', notas: 'Cliente frecuente', fechaRegistro: '2024-01-01' },
        { id: 2, nombre: 'Miguel Ángel', telefono: '555-5678', email: 'miguel@email.com', direccion: 'Av. Principal 456', visitas: 8, ultimaVisita: '2024-01-10', gastoTotal: 2800, estado: 'activo', fechaRegistro: '2024-01-02' },
        { id: 3, nombre: 'Juan Pérez', telefono: '555-9012', email: 'juan@email.com', direccion: 'Boulevard 789', visitas: 5, ultimaVisita: '2024-01-05', gastoTotal: 1750, estado: 'activo', fechaRegistro: '2024-01-03' },
        { id: 4, nombre: 'Roberto Gómez', telefono: '555-3456', email: 'roberto@email.com', direccion: 'Callejón 101', visitas: 3, ultimaVisita: '2023-12-20', gastoTotal: 1050, estado: 'inactivo', fechaRegistro: '2024-01-04' },
        { id: 5, nombre: 'Ana Martínez', telefono: '555-7890', email: 'ana@email.com', direccion: 'Pasaje 202', visitas: 15, ultimaVisita: '2024-01-18', gastoTotal: 5250, estado: 'activo', fechaRegistro: '2024-01-05' }
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

// Formatear fecha
function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES');
}

// ✅ RENDERIZAR TABLA - VERSIÓN CORREGIDA
function renderizarTabla() {
    console.log('🔄 renderizarTabla ejecutándose');
    
    const tbody = document.getElementById('clientes-table-body');
    if (!tbody) {
        console.error('❌ tbody no encontrado');
        return;
    }
    
    const filtered = filtrarClientes();
    console.log('Clientes filtrados:', filtered.length);
    
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    
    if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="loading-cell">No hay clientes registrados</td></tr>`;
        document.getElementById('page-info').textContent = `Página 1 de 1`;
        return;
    }
    
    tbody.innerHTML = paginated.map(cliente => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--color-primary); display: flex; align-items: center; justify-content: center; font-weight: bold;">${cliente.nombre.charAt(0)}</div>
                    <div>
                        <div style="font-weight: 600;">${cliente.nombre}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">${cliente.telefono}</div>
                    </div>
                </div>
            </td>
            <td>${cliente.email || 'No registrado'}</td>
            <td>${cliente.visitas || 0}</td>
            <td>${formatearFecha(cliente.ultimaVisita)}</td>
            <td>$${(cliente.gastoTotal || 0).toLocaleString()}</td>
            <td><span class="badge-${cliente.estado}">${cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}</span></td>
            <td>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-icon-sm" onclick="verCliente(${cliente.id})">👁️</button>
                    <button class="btn-icon-sm" onclick="editarCliente(${cliente.id})">✏️</button>
                    <button class="btn-icon-sm" onclick="eliminarCliente(${cliente.id})">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages || 1}`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
    
    console.log('✅ Tabla renderizada con', paginated.length, 'clientes');
}

// Ver cliente
window.verCliente = function(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;
    alert(`Cliente: ${cliente.nombre}\nTeléfono: ${cliente.telefono}\nEmail: ${cliente.email || 'No registrado'}\nVisitas: ${cliente.visitas || 0}\nGasto total: $${(cliente.gastoTotal || 0).toLocaleString()}`);
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
    document.getElementById('cliente-direccion').value = cliente.direccion || '';
    document.getElementById('cliente-notas').value = cliente.notas || '';
    document.getElementById('cliente-estado').value = cliente.estado || 'activo';
    
    document.getElementById('cliente-modal').style.display = 'flex';
};

// Eliminar cliente
window.eliminarCliente = async function(id) {
    if (confirm('¿Eliminar este cliente?')) {
        clientes = clientes.filter(c => c.id !== id);
        await guardarClientes();
        renderizarTabla();
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
        alert('Cliente actualizado');
    } else {
        clienteData.id = Date.now();
        clientes.push(clienteData);
        alert('Cliente agregado');
    }
    
    await guardarClientes();
    renderizarTabla();
    cerrarModal();
}

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
}

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
        if (currentPage > 1) { currentPage--; renderizarTabla(); }
    });
    document.getElementById('next-page')?.addEventListener('click', () => {
        const totalPages = Math.ceil(filtrarClientes().length / itemsPerPage);
        if (currentPage < totalPages) { currentPage++; renderizarTabla(); }
    });
}

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export { init, cargarClientes };
