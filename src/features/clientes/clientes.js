// src/features/clientes/clientes.js

console.log('👥 Clientes feature cargado - INICIANDO');

// Variables globales del módulo
let clientes = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentFilter = 'todos';
let currentSearch = '';
let editingId = null;

// Inicialización principal
async function init() {
    console.log('👥 init() ejecutándose');
    await cargarClientes();
    setupEventListeners();
    setupModalClose();
}

// Cargar clientes desde storage
async function cargarClientes() {
    console.log('📥 Cargando clientes desde storage...');
    try {
        if (!window.storage) {
            console.error('❌ window.storage no disponible');
            return;
        }
        
        const stored = await window.storage.obtenerTodos('clientes');
        console.log('📦 Datos obtenidos:', stored?.length || 0, 'clientes');
        
        if (stored && stored.length > 0) {
            clientes = stored;
        } else {
            console.log('📦 No hay datos, cargando ejemplo...');
            clientes = getClientesEjemplo();
            await guardarClientes();
        }
        
        // Renderizar la tabla
        renderizarTabla();
        
        // Actualizar dashboard stats
        actualizarDashboardStats();
        
    } catch (error) {
        console.error('❌ Error cargando clientes:', error);
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
        console.log('💾 Clientes guardados:', clientes.length);
    } catch (error) {
        console.error('❌ Error guardando:', error);
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

// Actualizar dashboard
function actualizarDashboardStats() {
    try {
        const totalClientes = clientes.length;
        localStorage.setItem('dashboard_stats', JSON.stringify({
            totalClientes: totalClientes,
            ultimaActualizacion: new Date().toISOString()
        }));
        
        // Actualizar el elemento si existe
        const clientesElement = document.getElementById('clientes-totales');
        if (clientesElement) {
            clientesElement.textContent = totalClientes;
        }
        
        window.dispatchEvent(new CustomEvent('clientes-actualizados', { 
            detail: { total: totalClientes } 
        }));
    } catch (e) {}
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

// RENDERIZAR TABLA - Función principal
function renderizarTabla() {
    console.log('🎨 renderizarTabla() ejecutándose');
    
    const tbody = document.getElementById('clientes-table-body');
    if (!tbody) {
        console.error('❌ No se encontró el elemento clientes-table-body');
        return;
    }
    
    const filtered = filtrarClientes();
    console.log(`📊 Mostrando ${filtered.length} de ${clientes.length} clientes`);
    
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    
    if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px;">No hay clientes registrados</td></tr>`;
        document.getElementById('page-info').textContent = 'Página 1 de 1';
        return;
    }
    
    tbody.innerHTML = paginated.map(cliente => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light)); display: flex; align-items: center; justify-content: center; font-weight: bold; color: white;">${cliente.nombre.charAt(0).toUpperCase()}</div>
                    <div>
                        <div style="font-weight: 600;">${escapeHtml(cliente.nombre)}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">${cliente.telefono}</div>
                    </div>
                </div>
            </td>
            <td>${escapeHtml(cliente.email || 'No registrado')}</td>
            <td style="text-align: center;">${cliente.visitas || 0}</td>
            <td>${formatearFecha(cliente.ultimaVisita)}</td>
            <td style="font-weight: 600; color: var(--color-primary);">$${(cliente.gastoTotal || 0).toLocaleString()}</td>
            <td><span class="badge-${cliente.estado}" style="padding: 4px 12px; border-radius: 20px; font-size: 0.75rem;">${cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}</span></td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-icon-sm" onclick="window.verCliente(${cliente.id})" title="Ver">👁️</button>
                    <button class="btn-icon-sm" onclick="window.editarCliente(${cliente.id})" title="Editar">✏️</button>
                    <button class="btn-icon-sm" onclick="window.eliminarCliente(${cliente.id})" title="Eliminar">🗑️</button>
                </div>
            </td>
        `,
    ).join('');
    
    document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages || 1}`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
    
    console.log('✅ Tabla renderizada correctamente');
}

// Helper para escapar HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ FUNCIONES GLOBALES (para onclick) ============
window.verCliente = function(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;
    
    const modal = document.getElementById('cliente-ver-modal');
    const detalle = document.getElementById('cliente-detalle');
    
    if (detalle) {
        detalle.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light)); display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-size: 2rem; color: white;">${cliente.nombre.charAt(0).toUpperCase()}</div>
                <h3>${escapeHtml(cliente.nombre)}</h3>
                <p style="color: var(--text-secondary);">Cliente desde: ${formatearFecha(cliente.fechaRegistro)}</p>
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div><strong>📞 Teléfono:</strong><br>${cliente.telefono}</div>
                <div><strong>✉️ Email:</strong><br>${cliente.email || 'No registrado'}</div>
                <div><strong>📍 Dirección:</strong><br>${cliente.direccion || 'No registrada'}</div>
                <div><strong>✂️ Visitas:</strong><br>${cliente.visitas || 0}</div>
                <div><strong>💰 Gasto total:</strong><br>$${(cliente.gastoTotal || 0).toLocaleString()}</div>
                <div><strong>📌 Estado:</strong><br>${cliente.estado === 'activo' ? 'Activo' : 'Inactivo'}</div>
            </div>
            ${cliente.notas ? `<div style="margin-top: 20px;"><strong>📝 Notas:</strong><br>${escapeHtml(cliente.notas)}</div>` : ''}
        `;
    }
    
    if (modal) modal.style.display = 'flex';
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
    if (confirm('¿Eliminar este cliente?')) {
        clientes = clientes.filter(c => c.id !== id);
        await guardarClientes();
        renderizarTabla();
        actualizarDashboardStats();
        alert('Cliente eliminado');
    }
};

// ============ FUNCIONES DEL MODAL ============
function nuevoCliente() {
    editingId = null;
    document.getElementById('modal-title').textContent = 'Nuevo Cliente';
    document.getElementById('cliente-form').reset();
    document.getElementById('cliente-estado').value = 'activo';
    document.getElementById('cliente-modal').style.display = 'flex';
}

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

function cerrarModal() {
    const modal = document.getElementById('cliente-modal');
    const verModal = document.getElementById('cliente-ver-modal');
    if (modal) modal.style.display = 'none';
    if (verModal) verModal.style.display = 'none';
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
            if (currentPage > 1) {
                currentPage--;
                renderizarTabla();
            }
        };
    }
    
    const nextBtn = document.getElementById('next-page');
    if (nextBtn) {
        nextBtn.onclick = () => {
            const totalPages = Math.ceil(filtrarClientes().length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderizarTabla();
            }
        };
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModal();
    });
}

// Exponer funciones necesarias globalmente
window.renderizarTabla = renderizarTabla;
window.clientesData = () => clientes;

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export { init, cargarClientes, renderizarTabla };
