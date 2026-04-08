// src/features/clientes/clientes.js

console.log('👥 Clientes feature cargado');

let clientes = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentFilter = 'todos';
let currentSearch = '';
let editingId = null;
let renderizadoInicial = false;
let primeraVez = true;

// Inicializar
async function init() {
    console.log('👥 Inicializando...');
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
        
        // Renderizar SOLO UNA VEZ
        if (!renderizadoInicial) {
            renderizarTabla();
            renderizadoInicial = true;
        }
        
    } catch (error) {
        console.error('Error:', error);
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
        console.error('Error guardando:', error);
    }
}

// Datos de ejemplo
function getClientesEjemplo() {
    return [
        { id: 1, nombre: 'Carlos López', telefono: '555-1234', email: 'carlos@email.com', direccion: 'Calle 123', visitas: 12, ultimaVisita: '2024-01-15', gastoTotal: 4200, estado: 'activo', fechaRegistro: '2024-01-01' },
        { id: 2, nombre: 'Miguel Ángel', telefono: '555-5678', email: 'miguel@email.com', direccion: 'Av. Principal 456', visitas: 8, ultimaVisita: '2024-01-10', gastoTotal: 2800, estado: 'activo', fechaRegistro: '2024-01-02' },
        { id: 3, nombre: 'Juan Pérez', telefono: '555-9012', email: 'juan@email.com', direccion: 'Boulevard 789', visitas: 5, ultimaVisita: '2024-01-05', gastoTotal: 1750, estado: 'activo', fechaRegistro: '2024-01-03' },
        { id: 4, nombre: 'Roberto Gómez', telefono: '555-3456', email: 'roberto@email.com', direccion: 'Callejón 101', visitas: 3, ultimaVisita: '2023-12-20', gastoTotal: 1050, estado: 'inactivo', fechaRegistro: '2024-01-04' },
        { id: 5, nombre: 'Ana Martínez', telefono: '555-7890', email: 'ana@email.com', direccion: 'Pasaje 202', visitas: 15, ultimaVisita: '2024-01-18', gastoTotal: 5250, estado: 'activo', fechaRegistro: '2024-01-05' }
    ];
}

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

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES');
}

// RENDERIZAR TABLA
function renderizarTabla() {
    if (!primeraVez) {
        console.log('⏳ Ya renderizado, ignorando');
        return;
    }
    primeraVez = false;
    
    console.log('🎨 renderizarTabla() - Clientes:', clientes.length);
    
    const tbody = document.getElementById('clientes-table-body');
    if (!tbody) {
        console.error('❌ tbody no encontrado');
        return;
    }
    
    const filtered = filtrarClientes();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    
    if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px;">No hay clientes registrados</td></tr>`;
        document.getElementById('page-info').textContent = 'Página 1 de 1';
        return;
    }
    
    let html = '';
    for (const c of paginated) {
        html += `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: #ff6b35; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${c.nombre.charAt(0)}</div>
                        <div><strong>${c.nombre}</strong><br><small>${c.telefono}</small></div>
                    </div>
                </td>
                <td>${c.email || 'No registrado'}</td>
                <td style="text-align: center;">${c.visitas || 0}</td>
                <td>${formatearFecha(c.ultimaVisita)}</td>
                <td style="color: #ff6b35; font-weight: bold;">$${(c.gastoTotal || 0).toLocaleString()}</td>
                <td><span style="padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; background: ${c.estado === 'activo' ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)'}; color: ${c.estado === 'activo' ? '#4caf50' : '#f44336'};">${c.estado === 'activo' ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button class="btn-icon-sm" onclick="verCliente(${c.id})">👁️</button>
                    <button class="btn-icon-sm" onclick="editarCliente(${c.id})">✏️</button>
                    <button class="btn-icon-sm" onclick="eliminarCliente(${c.id})">🗑️</button>
                </td>
            </tr>
        `;
    }
    
    tbody.innerHTML = html;
    
    document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages || 1}`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
    
    console.log('✅ Tabla renderizada con', paginated.length, 'clientes');
}

// ============ FUNCIONES GLOBALES ============
window.verCliente = function(id) {
    const c = clientes.find(c => c.id === id);
    if (!c) return;
    alert(`Cliente: ${c.nombre}\nTeléfono: ${c.telefono}\nEmail: ${c.email || 'No'}\nVisitas: ${c.visitas || 0}\nGasto: $${(c.gastoTotal || 0).toLocaleString()}`);
};

window.editarCliente = function(id) {
    const c = clientes.find(c => c.id === id);
    if (!c) return;
    editingId = id;
    document.getElementById('modal-title').textContent = 'Editar Cliente';
    document.getElementById('cliente-nombre').value = c.nombre;
    document.getElementById('cliente-telefono').value = c.telefono;
    document.getElementById('cliente-email').value = c.email || '';
    document.getElementById('cliente-direccion').value = c.direccion || '';
    document.getElementById('cliente-notas').value = c.notas || '';
    document.getElementById('cliente-estado').value = c.estado;
    document.getElementById('cliente-modal').style.display = 'flex';
};

window.eliminarCliente = async function(id) {
    if (confirm('¿Eliminar este cliente?')) {
        clientes = clientes.filter(c => c.id !== id);
        await guardarClientes();
        renderizarTabla();
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
    
    const data = {
        id: Date.now(),
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
    
    clientes.push(data);
    await guardarClientes();
    renderizarTabla();
    document.getElementById('cliente-modal').style.display = 'none';
    alert('Cliente agregado');
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
    const btnNuevo = document.getElementById('btn-nuevo-cliente');
    if (btnNuevo) btnNuevo.onclick = nuevoCliente;
    
    const btnCancelar = document.getElementById('cancelar-modal');
    if (btnCancelar) btnCancelar.onclick = cerrarModal;
    
    const form = document.getElementById('cliente-form');
    if (form) form.onsubmit = guardarCliente;
    
    const searchInput = document.getElementById('search-cliente');
    if (searchInput) {
        searchInput.oninput = (e) => {
            currentSearch = e.target.value;
            currentPage = 1;
            renderizarTabla();
        };
    }
    
    const filtroEstado = document.getElementById('filtro-estado');
    if (filtroEstado) {
        filtroEstado.onchange = (e) => {
            currentFilter = e.target.value;
            currentPage = 1;
            renderizarTabla();
        };
    }
    
    const prevBtn = document.getElementById('prev-page');
    if (prevBtn) {
        prevBtn.onclick = () => {
            if (currentPage > 1) { currentPage--; renderizarTabla(); }
        };
    }
    
    const nextBtn = document.getElementById('next-page');
    if (nextBtn) {
        nextBtn.onclick = () => {
            const total = Math.ceil(filtrarClientes().length / itemsPerPage);
            if (currentPage < total) { currentPage++; renderizarTabla(); }
        };
    }
}

// Exponer función de renderizado
window.renderizarTablaClientes = renderizarTabla;

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export { init };
