// src/views/admin/servicios/servicios.js

console.log('✂️ Admin - Servicios');

// Estado local
let servicios = [];
let barberos = [];
let currentPage = 1;
let itemsPerPage = 6;
let currentFiltros = {
    categoria: 'todos',
    estado: 'todos',
    busqueda: ''
};
let editingId = null;

// ============================================
// INICIALIZACIÓN
// ============================================

async function init() {
    console.log('🚀 Inicializando gestión de servicios...');
    
    await cargarDatos();
    setupEventListeners();
    setupModalClose();
    renderizarGrid();
}

async function cargarDatos() {
    // Obtener del caché global
    if (window.app && window.app.estado) {
        servicios = window.app.estado.cache.servicios || [];
        barberos = window.app.estado.cache.barberos || [];
    } else {
        servicios = await window.storage?.obtenerTodos('servicios') || [];
        barberos = await window.storage?.obtenerTodos('barberos') || [];
    }
    
    // Si no hay datos, cargar ejemplos
    if (servicios.length === 0) {
        servicios = getServiciosEjemplo();
        await guardarServicios();
    }
    
    console.log(`📦 ${servicios.length} servicios cargados`);
}

async function guardarServicios() {
    for (const servicio of servicios) {
        await window.storage?.guardar('servicios', servicio);
    }
    
    // Actualizar caché global
    if (window.app && window.app.estado) {
        window.app.estado.cache.servicios = servicios;
    }
}

function getServiciosEjemplo() {
    return [
        { id: 1, nombre: 'Corte de Cabello', categoria: 'Corte', precio: 350, duracion: 30, estado: 'activo', icono: '✂️', descripcion: 'Corte clásico o moderno según preferencia', barberos: [1, 2, 3] },
        { id: 2, nombre: 'Barba', categoria: 'Barba', precio: 200, duracion: 20, estado: 'activo', icono: '🧔', descripcion: 'Arreglo de barba con navaja', barberos: [1, 2] },
        { id: 3, nombre: 'Corte + Barba', categoria: 'Paquete', precio: 500, duracion: 50, estado: 'activo', icono: '✨', descripcion: 'Combo completo de corte y barba', barberos: [1, 2, 3] },
        { id: 4, nombre: 'Coloración', categoria: 'Color', precio: 800, duracion: 90, estado: 'activo', icono: '🎨', descripcion: 'Tinte, reflejos o coloración completa', barberos: [3] }
    ];
}

// ============================================
// FILTRADO
// ============================================

function filtrarServicios() {
    let filtered = [...servicios];
    
    if (currentFiltros.categoria !== 'todos') {
        filtered = filtered.filter(s => s.categoria === currentFiltros.categoria);
    }
    
    if (currentFiltros.estado !== 'todos') {
        filtered = filtered.filter(s => s.estado === currentFiltros.estado);
    }
    
    if (currentFiltros.busqueda) {
        const searchLower = currentFiltros.busqueda.toLowerCase();
        filtered = filtered.filter(s => 
            s.nombre.toLowerCase().includes(searchLower) ||
            (s.descripcion && s.descripcion.toLowerCase().includes(searchLower))
        );
    }
    
    return filtered;
}

// ============================================
// RENDERIZADO
// ============================================

function renderizarGrid() {
    const grid = document.getElementById('servicios-grid');
    if (!grid) return;
    
    const filtered = filtrarServicios();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    
    if (paginated.length === 0) {
        grid.innerHTML = '<div class="loading-spinner">No hay servicios registrados</div>';
        document.getElementById('page-info').textContent = 'Página 1 de 1';
        return;
    }
    
    grid.innerHTML = paginated.map(servicio => `
        <div class="servicio-card">
            <div class="servicio-estado-badge estado-${servicio.estado}">
                ${servicio.estado === 'activo' ? '🟢 Activo' : '🔴 Inactivo'}
            </div>
            <div class="servicio-card-header">
                <div class="servicio-icono">${servicio.icono || '✂️'}</div>
                <h3 class="servicio-nombre-card">${escapeHtml(servicio.nombre)}</h3>
                <span class="servicio-categoria-badge">${servicio.categoria}</span>
            </div>
            <div class="servicio-card-body">
                <div class="servicio-info-item">
                    <span>💰</span>
                    <span class="servicio-precio">$${servicio.precio.toLocaleString()}</span>
                </div>
                <div class="servicio-info-item">
                    <span>⏱️</span>
                    <span class="servicio-duracion">${servicio.duracion} minutos</span>
                </div>
                ${servicio.descripcion ? `
                    <div class="servicio-descripcion">
                        ${escapeHtml(servicio.descripcion)}
                    </div>
                ` : ''}
            </div>
            <div class="servicio-card-footer">
                <button class="btn-card btn-card-ver" onclick="verServicio(${servicio.id})">👁️ Ver</button>
                <button class="btn-card btn-card-editar" onclick="editarServicio(${servicio.id})">✏️ Editar</button>
                <button class="btn-card btn-card-eliminar" onclick="eliminarServicio(${servicio.id})">🗑️ Eliminar</button>
            </div>
        </div>
    `).join('');
    
    document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages || 1}`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
}

// ============================================
// CRUD
// ============================================

window.verServicio = function(id) {
    const servicio = servicios.find(s => s.id === id);
    if (!servicio) return;
    
    const barberosServicio = barberos.filter(b => servicio.barberos?.includes(b.id));
    
    const detalle = document.getElementById('servicio-detalle');
    detalle.innerHTML = `
        <div class="info-row">
            <label>Ícono:</label>
            <span style="font-size: 2rem;">${servicio.icono || '✂️'}</span>
        </div>
        <div class="info-row">
            <label>Nombre:</label>
            <span>${escapeHtml(servicio.nombre)}</span>
        </div>
        <div class="info-row">
            <label>Categoría:</label>
            <span>${servicio.categoria}</span>
        </div>
        <div class="info-row">
            <label>Precio:</label>
            <span>$${servicio.precio.toLocaleString()}</span>
        </div>
        <div class="info-row">
            <label>Duración:</label>
            <span>${servicio.duracion} minutos</span>
        </div>
        <div class="info-row">
            <label>Estado:</label>
            <span class="estado-badge estado-${servicio.estado}">${servicio.estado === 'activo' ? 'Activo' : 'Inactivo'}</span>
        </div>
        ${servicio.descripcion ? `
        <div class="info-row">
            <label>Descripción:</label>
            <span>${escapeHtml(servicio.descripcion)}</span>
        </div>
        ` : ''}
        <div class="info-row">
            <label>Barberos:</label>
            <span>${barberosServicio.length > 0 ? barberosServicio.map(b => b.nombre).join(', ') : 'No asignado'}</span>
        </div>
    `;
    
    document.getElementById('servicio-ver-modal').style.display = 'flex';
    window.currentServicioId = id;
};

window.editarServicio = function(id) {
    const servicio = servicios.find(s => s.id === id);
    if (!servicio) return;
    
    editingId = id;
    document.getElementById('modal-title').textContent = 'Editar Servicio';
    document.getElementById('servicio-nombre').value = servicio.nombre;
    document.getElementById('servicio-categoria').value = servicio.categoria;
    document.getElementById('servicio-precio').value = servicio.precio;
    document.getElementById('servicio-duracion').value = servicio.duracion;
    document.getElementById('servicio-estado').value = servicio.estado;
    document.getElementById('servicio-icono').value = servicio.icono || '✂️';
    document.getElementById('servicio-descripcion').value = servicio.descripcion || '';
    
    cargarBarberosCheckbox(servicio.barberos || []);
    
    document.getElementById('servicio-modal').style.display = 'flex';
};

window.eliminarServicio = async function(id) {
    if (confirm('¿Eliminar este servicio?')) {
        servicios = servicios.filter(s => s.id !== id);
        await guardarServicios();
        renderizarGrid();
        window.app?.mostrarNotificacion('Servicio eliminado', 'success');
    }
};

function nuevoServicio() {
    editingId = null;
    document.getElementById('modal-title').textContent = 'Nuevo Servicio';
    document.getElementById('servicio-form').reset();
    document.getElementById('servicio-estado').value = 'activo';
    document.getElementById('servicio-icono').value = '✂️';
    cargarBarberosCheckbox([]);
    document.getElementById('servicio-modal').style.display = 'flex';
}

function cargarBarberosCheckbox(selectedIds = []) {
    const container = document.getElementById('servicio-barberos');
    if (!container) return;
    
    if (barberos.length === 0) {
        container.innerHTML = '<div class="loading-spinner">No hay barberos registrados</div>';
        return;
    }
    
    container.innerHTML = barberos.map(barbero => `
        <label class="barbero-checkbox">
            <input type="checkbox" value="${barbero.id}" ${selectedIds.includes(barbero.id) ? 'checked' : ''}>
            <span>${escapeHtml(barbero.nombre)}</span>
            <small style="color: var(--text-secondary);">(${barbero.especialidad})</small>
        </label>
    `).join('');
}

async function guardarServicio(e) {
    e.preventDefault();
    
    const barberosSeleccionados = [];
    document.querySelectorAll('#servicio-barberos input:checked').forEach(cb => {
        barberosSeleccionados.push(parseInt(cb.value));
    });
    
    const servicioData = {
        nombre: document.getElementById('servicio-nombre').value,
        categoria: document.getElementById('servicio-categoria').value,
        precio: parseInt(document.getElementById('servicio-precio').value),
        duracion: parseInt(document.getElementById('servicio-duracion').value),
        estado: document.getElementById('servicio-estado').value,
        icono: document.getElementById('servicio-icono').value,
        descripcion: document.getElementById('servicio-descripcion').value,
        barberos: barberosSeleccionados
    };
    
    if (editingId) {
        const index = servicios.findIndex(s => s.id === editingId);
        if (index !== -1) {
            servicioData.id = editingId;
            servicios[index] = { ...servicios[index], ...servicioData };
        }
        window.app?.mostrarNotificacion('Servicio actualizado', 'success');
    } else {
        servicioData.id = Date.now();
        servicios.push(servicioData);
        window.app?.mostrarNotificacion('Servicio agregado', 'success');
    }
    
    await guardarServicios();
    renderizarGrid();
    cerrarModal();
}

// ============================================
// MODALES
// ============================================

function cerrarModal() {
    document.getElementById('servicio-modal').style.display = 'none';
    document.getElementById('servicio-ver-modal').style.display = 'none';
}

function setupModalClose() {
    const modal = document.getElementById('servicio-modal');
    if (modal) {
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
        modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    }
    
    const verModal = document.getElementById('servicio-ver-modal');
    if (verModal) {
        const closeBtn = verModal.querySelector('.modal-close');
        if (closeBtn) closeBtn.onclick = () => verModal.style.display = 'none';
        verModal.onclick = (e) => { if (e.target === verModal) verModal.style.display = 'none'; };
    }
}

function editarDesdeVer() {
    cerrarModal('servicio-ver-modal');
    if (window.currentServicioId) {
        editarServicio(window.currentServicioId);
    }
}

// ============================================
// EVENTOS
// ============================================

function setupEventListeners() {
    document.getElementById('btn-nuevo-servicio')?.addEventListener('click', nuevoServicio);
    document.getElementById('cancelar-modal')?.addEventListener('click', cerrarModal);
    document.getElementById('servicio-form')?.addEventListener('submit', guardarServicio);
    document.getElementById('cerrar-ver-modal')?.addEventListener('click', () => cerrarModal('servicio-ver-modal'));
    document.getElementById('editar-ver-modal')?.addEventListener('click', editarDesdeVer);
    
    document.getElementById('search-servicio')?.addEventListener('input', (e) => {
        currentFiltros.busqueda = e.target.value;
        currentPage = 1;
        renderizarGrid();
    });
    
    document.getElementById('filtro-categoria')?.addEventListener('change', (e) => {
        currentFiltros.categoria = e.target.value;
        currentPage = 1;
        renderizarGrid();
    });
    
    document.getElementById('filtro-estado')?.addEventListener('change', (e) => {
        currentFiltros.estado = e.target.value;
        currentPage = 1;
        renderizarGrid();
    });
    
    document.getElementById('prev-page')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderizarGrid();
        }
    });
    
    document.getElementById('next-page')?.addEventListener('click', () => {
        const totalPages = Math.ceil(filtrarServicios().length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderizarGrid();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModal();
    });
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
