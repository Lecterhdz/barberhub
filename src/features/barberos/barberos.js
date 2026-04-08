// src/features/barberos/barberos.js

console.log('✂️ Barberos feature cargado');

let barberos = [];
let currentPage = 1;
let itemsPerPage = 6;
let currentFilter = 'todos';
let currentEspecialidad = 'todos';
let currentSearch = '';
let editingId = null;

// Inicializar
async function init() {
    console.log('✂️ Inicializando gestión de barberos...');
    await cargarBarberos();
    setupEventListeners();
    setupModalClose();  // ✅ AGREGAR ESTA LÍNEA
}

// Cargar barberos desde storage
async function cargarBarberos() {
    try {
        const stored = await window.storage?.obtenerTodos('barberos');
        if (stored && stored.length > 0) {
            barberos = stored;
        } else {
            barberos = getBarberosEjemplo();
            await guardarBarberos();
        }
        renderizarGrid();
    } catch (error) {
        console.error('Error cargando barberos:', error);
        barberos = getBarberosEjemplo();
        renderizarGrid();
    }
}

// Guardar barberos
async function guardarBarberos() {
    try {
        for (const barbero of barberos) {
            await window.storage?.guardar('barberos', barbero);
        }
    } catch (error) {
        console.error('Error guardando barberos:', error);
    }
}

// Datos de ejemplo
function getBarberosEjemplo() {
    return [
        { 
            id: 1, 
            nombre: 'Carlos Martínez', 
            telefono: '555-0101', 
            email: 'carlos@barberhub.com',
            especialidad: 'Corte',
            comision: 40,
            estado: 'activo',
            horarioInicio: '09:00',
            horarioFin: '18:00',
            diasDescanso: ['Dom'],
            biografia: 'Especialista en cortos modernos y degradados. 5 años de experiencia.',
            citasAtendidas: 245,
            ingresosGenerados: 85750,
            rating: 4.8
        },
        { 
            id: 2, 
            nombre: 'Miguel Rodríguez', 
            telefono: '555-0102', 
            email: 'miguel@barberhub.com',
            especialidad: 'Barba',
            comision: 45,
            estado: 'activo',
            horarioInicio: '10:00',
            horarioFin: '19:00',
            diasDescanso: ['Lun'],
            biografia: 'Experto en arreglo de barba y bigote. Técnicas con navaja.',
            citasAtendidas: 180,
            ingresosGenerados: 54000,
            rating: 4.9
        },
        { 
            id: 3, 
            nombre: 'Juan Pérez', 
            telefono: '555-0103', 
            email: 'juan@barberhub.com',
            especialidad: 'Todo',
            comision: 50,
            estado: 'activo',
            horarioInicio: '08:00',
            horarioFin: '17:00',
            diasDescanso: ['Mié'],
            biografia: 'Barbero master con 10 años de experiencia. Todo tipo de cortes.',
            citasAtendidas: 520,
            ingresosGenerados: 182000,
            rating: 5.0
        },
        { 
            id: 4, 
            nombre: 'Roberto Gómez', 
            telefono: '555-0104', 
            email: 'roberto@barberhub.com',
            especialidad: 'Color',
            comision: 35,
            estado: 'inactivo',
            horarioInicio: '11:00',
            horarioFin: '20:00',
            diasDescanso: ['Mar', 'Jue'],
            biografia: 'Especialista en coloración y tratamientos capilares.',
            citasAtendidas: 95,
            ingresosGenerados: 33250,
            rating: 4.5
        }
    ];
}

// Filtrar barberos
function filtrarBarberos() {
    let filtered = [...barberos];
    
    if (currentFilter !== 'todos') {
        filtered = filtered.filter(b => b.estado === currentFilter);
    }
    
    if (currentEspecialidad !== 'todos') {
        filtered = filtered.filter(b => b.especialidad === currentEspecialidad);
    }
    
    if (currentSearch) {
        const searchLower = currentSearch.toLowerCase();
        filtered = filtered.filter(b => 
            b.nombre.toLowerCase().includes(searchLower) ||
            b.telefono.includes(searchLower) ||
            (b.email && b.email.toLowerCase().includes(searchLower))
        );
    }
    
    return filtered;
}

// Renderizar grid
function renderizarGrid() {
    const grid = document.getElementById('barberos-grid');
    if (!grid) return;
    
    const filtered = filtrarBarberos();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);
    
    if (paginated.length === 0) {
        grid.innerHTML = '<div class="loading-spinner">No hay barberos registrados</div>';
        document.getElementById('page-info').textContent = `Página 1 de 1`;
        return;
    }
    
    grid.innerHTML = paginated.map(barbero => `
        <div class="barbero-card">
            <div class="barbero-estado estado-${barbero.estado}">
                ${barbero.estado === 'activo' ? '🟢 Activo' : '🔴 Inactivo'}
            </div>
            <div class="barbero-card-header">
                <div class="barbero-avatar">
                    ${barbero.nombre.charAt(0)}
                </div>
                <h3 class="barbero-nombre">${barbero.nombre}</h3>
                <span class="barbero-especialidad">${getIconoEspecialidad(barbero.especialidad)} ${barbero.especialidad}</span>
            </div>
            <div class="barbero-card-body">
                <div class="barbero-info-item">
                    <span>📞</span>
                    <span>${barbero.telefono}</span>
                </div>
                <div class="barbero-info-item">
                    <span>✉️</span>
                    <span>${barbero.email || 'No registrado'}</span>
                </div>
                <div class="barbero-info-item">
                    <span>⏰</span>
                    <span>${barbero.horarioInicio} - ${barbero.horarioFin}</span>
                </div>
                <div class="barbero-info-item">
                    <span>📅</span>
                    <span>Descanso: ${barbero.diasDescanso.join(', ') || 'Ninguno'}</span>
                </div>
                <div class="barbero-comision">
                    <span class="comision-label">Comisión</span>
                    <span class="comision-valor">${barbero.comision}%</span>
                </div>
                <div class="barbero-stats">
                    <div class="stat-item">
                        <div class="stat-number">${barbero.citasAtendidas || 0}</div>
                        <div class="stat-label-small">Citas</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">$${((barbero.ingresosGenerados || 0) / 1000).toFixed(0)}k</div>
                        <div class="stat-label-small">Ingresos</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-number">⭐ ${barbero.rating || 0}</div>
                        <div class="stat-label-small">Rating</div>
                    </div>
                </div>
            </div>
            <div class="barbero-card-footer">
                <button class="btn-card btn-card-ver" onclick="verBarbero(${barbero.id})">👁️ Ver</button>
                <button class="btn-card btn-card-editar" onclick="editarBarbero(${barbero.id})">✏️ Editar</button>
                <button class="btn-card btn-card-eliminar" onclick="eliminarBarbero(${barbero.id})">🗑️ Eliminar</button>
            </div>
        </div>
    `).join('');
    
    document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages || 1}`;
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
}

// Icono por especialidad
function getIconoEspecialidad(especialidad) {
    const iconos = {
        'Corte': '✂️',
        'Barba': '🧔',
        'Color': '🎨',
        'Todo': '✨'
    };
    return iconos[especialidad] || '✂️';
}

// Ver barbero
window.verBarbero = function(id) {
    const barbero = barberos.find(b => b.id === id);
    if (!barbero) return;
    
    const modal = document.getElementById('barbero-ver-modal');
    const detalle = document.getElementById('barbero-detalle');
    
    detalle.innerHTML = `
        <div class="cliente-detalle-header" style="text-align: center; margin-bottom: 25px;">
            <div class="barbero-avatar" style="width: 120px; height: 120px; font-size: 3.5rem; margin: 0 auto 15px;">
                ${barbero.nombre.charAt(0)}
            </div>
            <h3>${barbero.nombre}</h3>
            <span class="barbero-especialidad">${getIconoEspecialidad(barbero.especialidad)} ${barbero.especialidad}</span>
            <div class="barbero-estado estado-${barbero.estado}" style="position: relative; top: 0; display: inline-block; margin-top: 10px;">
                ${barbero.estado === 'activo' ? '🟢 Activo' : '🔴 Inactivo'}
            </div>
        </div>
        
        <div class="cliente-info-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            <div class="info-item">
                <label>📞 Teléfono</label>
                <p>${barbero.telefono}</p>
            </div>
            <div class="info-item">
                <label>✉️ Email</label>
                <p>${barbero.email || 'No registrado'}</p>
            </div>
            <div class="info-item">
                <label>⏰ Horario</label>
                <p>${barbero.horarioInicio} - ${barbero.horarioFin}</p>
            </div>
            <div class="info-item">
                <label>📅 Descanso</label>
                <p>${barbero.diasDescanso.join(', ') || 'Ninguno'}</p>
            </div>
            <div class="info-item">
                <label>💰 Comisión</label>
                <p>${barbero.comision}%</p>
            </div>
            <div class="info-item">
                <label>⭐ Rating</label>
                <p>${barbero.rating || 0} / 5</p>
            </div>
        </div>
        
        <div class="cliente-historial">
            <h4>📝 Biografía</h4>
            <p style="margin-top: 10px;">${barbero.biografia || 'Sin información adicional'}</p>
        </div>
        
        <div class="cliente-historial">
            <h4>📊 Estadísticas</h4>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px; text-align: center;">
                <div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-primary);">${barbero.citasAtendidas || 0}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Citas atendidas</div>
                </div>
                <div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-primary);">$${(barbero.ingresosGenerados || 0).toLocaleString()}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Ingresos generados</div>
                </div>
                <div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-primary);">${Math.round((barbero.comision || 0) * (barbero.ingresosGenerados || 0) / 100)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Comisión ganada</div>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
};

// Editar barbero
window.editarBarbero = function(id) {
    const barbero = barberos.find(b => b.id === id);
    if (!barbero) return;
    
    editingId = id;
    document.getElementById('modal-title').textContent = 'Editar Barbero';
    document.getElementById('barbero-nombre').value = barbero.nombre;
    document.getElementById('barbero-telefono').value = barbero.telefono;
    document.getElementById('barbero-email').value = barbero.email || '';
    document.getElementById('barbero-especialidad').value = barbero.especialidad;
    document.getElementById('barbero-comision').value = barbero.comision;
    document.getElementById('barbero-estado').value = barbero.estado;
    document.getElementById('barbero-horario-inicio').value = barbero.horarioInicio;
    document.getElementById('barbero-horario-fin').value = barbero.horarioFin;
    document.getElementById('barbero-biografia').value = barbero.biografia || '';
    
    // Marcar días de descanso
    document.querySelectorAll('.dia-checkbox input').forEach(cb => {
        cb.checked = barbero.diasDescanso?.includes(cb.value) || false;
    });
    
    document.getElementById('barbero-modal').style.display = 'flex';
};

// Eliminar barbero
window.eliminarBarbero = async function(id) {
    const confirmar = await window.utils?.confirmar('¿Eliminar este barbero?');
    if (confirmar) {
        barberos = barberos.filter(b => b.id !== id);
        await guardarBarberos();
        renderizarGrid();
        window.utils?.mostrarNotificacion('Barbero eliminado', 'success');
    }
};

// Nuevo barbero
function nuevoBarbero() {
    editingId = null;
    document.getElementById('modal-title').textContent = 'Nuevo Barbero';
    document.getElementById('barbero-form').reset();
    document.getElementById('barbero-comision').value = '40';
    document.getElementById('barbero-estado').value = 'activo';
    document.getElementById('barbero-horario-inicio').value = '09:00';
    document.getElementById('barbero-horario-fin').value = '18:00';
    document.querySelectorAll('.dia-checkbox input').forEach(cb => cb.checked = false);
    document.getElementById('barbero-modal').style.display = 'flex';
}

// Guardar barbero
async function guardarBarbero(event) {
    event.preventDefault();
    
    const diasDescanso = [];
    document.querySelectorAll('.dia-checkbox input:checked').forEach(cb => {
        diasDescanso.push(cb.value);
    });
    
    const barberoData = {
        nombre: document.getElementById('barbero-nombre').value,
        telefono: document.getElementById('barbero-telefono').value,
        email: document.getElementById('barbero-email').value,
        especialidad: document.getElementById('barbero-especialidad').value,
        comision: parseInt(document.getElementById('barbero-comision').value),
        estado: document.getElementById('barbero-estado').value,
        horarioInicio: document.getElementById('barbero-horario-inicio').value,
        horarioFin: document.getElementById('barbero-horario-fin').value,
        diasDescanso: diasDescanso,
        biografia: document.getElementById('barbero-biografia').value
    };
    
    if (editingId) {
        const index = barberos.findIndex(b => b.id === editingId);
        if (index !== -1) {
            barberoData.id = editingId;
            barberoData.citasAtendidas = barberos[index].citasAtendidas || 0;
            barberoData.ingresosGenerados = barberos[index].ingresosGenerados || 0;
            barberoData.rating = barberos[index].rating || 0;
            barberos[index] = { ...barberos[index], ...barberoData };
        }
        window.utils?.mostrarNotificacion('Barbero actualizado', 'success');
    } else {
        barberoData.id = Date.now();
        barberoData.citasAtendidas = 0;
        barberoData.ingresosGenerados = 0;
        barberoData.rating = 0;
        barberos.push(barberoData);
        window.utils?.mostrarNotificacion('Barbero agregado', 'success');
    }
    
    await guardarBarberos();
    renderizarGrid();
    cerrarModal();
}
// ✅ AGREGAR: Función para cerrar modal con el botón X
function setupModalClose() {
    const modal = document.getElementById('barbero-modal');
    if (modal) {
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }
        // Cerrar al hacer clic fuera
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
    }
    
    const verModal = document.getElementById('barbero-ver-modal');
    if (verModal) {
        const closeBtn = verModal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                verModal.style.display = 'none';
            };
        }
        verModal.onclick = (e) => {
            if (e.target === verModal) {
                verModal.style.display = 'none';
            }
        };
    }
}
// Cerrar modal
function cerrarModal() {
    document.getElementById('barbero-modal').style.display = 'none';
    document.getElementById('barbero-ver-modal').style.display = 'none';
}

// Configurar eventos
function setupEventListeners() {
    document.getElementById('btn-nuevo-barbero')?.addEventListener('click', nuevoBarbero);
    document.getElementById('cancelar-modal')?.addEventListener('click', cerrarModal);
    document.getElementById('barbero-form')?.addEventListener('submit', guardarBarbero);
    document.getElementById('search-barbero')?.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        currentPage = 1;
        renderizarGrid();
    });
    document.getElementById('filtro-estado')?.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        currentPage = 1;
        renderizarGrid();
    });
    document.getElementById('filtro-especialidad')?.addEventListener('change', (e) => {
        currentEspecialidad = e.target.value;
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
        const totalPages = Math.ceil(filtrarBarberos().length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderizarGrid();
        }
    });
    
    // Cerrar modales con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModal();
        }
    });
}

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export { init, cargarBarberos };
