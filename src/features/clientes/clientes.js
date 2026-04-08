// src/features/clientes/clientes.js - VERSIÓN SIMPLE PARA PRUEBA

console.log('👥 Clientes feature cargado - VERSIÓN SIMPLE');

let clientes = [];

// Inicializar
async function init() {
    console.log('👥 Init - Cargando clientes...');
    
    // Cargar datos
    const stored = await window.storage?.obtenerTodos('clientes') || [];
    console.log('Clientes encontrados:', stored.length);
    
    if (stored.length > 0) {
        clientes = stored;
    } else {
        // Datos de ejemplo
        clientes = [
            { id: 1, nombre: 'Carlos López', telefono: '555-1234', email: 'carlos@email.com', visitas: 12, gastoTotal: 4200, estado: 'activo' },
            { id: 2, nombre: 'Miguel Ángel', telefono: '555-5678', email: 'miguel@email.com', visitas: 8, gastoTotal: 2800, estado: 'activo' },
            { id: 3, nombre: 'Juan Pérez', telefono: '555-9012', email: 'juan@email.com', visitas: 5, gastoTotal: 1750, estado: 'activo' }
        ];
        // Guardar ejemplo
        for (const c of clientes) {
            await window.storage?.guardar('clientes', c);
        }
    }
    
    // Renderizar tabla
    renderizarTabla();
    
    // Configurar botones después de renderizar
    setTimeout(() => {
        const btnNuevo = document.getElementById('btn-nuevo-cliente');
        if (btnNuevo) btnNuevo.onclick = () => {
            const nombre = prompt('Nombre del cliente:');
            const telefono = prompt('Teléfono:');
            if (nombre && telefono) {
                const nuevo = {
                    id: Date.now(),
                    nombre: nombre,
                    telefono: telefono,
                    email: '',
                    visitas: 0,
                    gastoTotal: 0,
                    estado: 'activo'
                };
                clientes.push(nuevo);
                window.storage?.guardar('clientes', nuevo);
                renderizarTabla();
                alert('Cliente agregado');
            }
        };
    }, 100);
}

// Renderizar tabla
function renderizarTabla() {
    console.log('🎨 Renderizando tabla, clientes:', clientes.length);
    
    const tbody = document.getElementById('clientes-table-body');
    if (!tbody) {
        console.error('❌ No se encontró la tabla');
        return;
    }
    
    if (clientes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px;">No hay clientes</td>`);
        return;
    }
    
    let html = '';
    for (const c of clientes) {
        html += `
            <tr>
                <td><strong>${c.nombre}</strong><br><small>${c.telefono}</small></td>
                <td>${c.email || '-'}</td>
                <td style="text-align:center">${c.visitas || 0}</td>
                <td style="color:#ff6b35; font-weight:bold">$${(c.gastoTotal || 0).toLocaleString()}</td>
                <td><span style="background:rgba(76,175,80,0.2); padding:4px 12px; border-radius:20px;">${c.estado === 'activo' ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                    <button onclick="verCliente(${c.id})">👁️</button>
                    <button onclick="eliminarCliente(${c.id})">🗑️</button>
                </td>
            </tr>
        `;
    }
    
    tbody.innerHTML = html;
    console.log('✅ Tabla renderizada');
}

// Funciones globales
window.verCliente = function(id) {
    const c = clientes.find(c => c.id === id);
    if (c) alert(`Cliente: ${c.nombre}\nTeléfono: ${c.telefono}\nVisitas: ${c.visitas}\nGasto: $${c.gastoTotal}`);
};

window.eliminarCliente = async function(id) {
    if (confirm('¿Eliminar?')) {
        clientes = clientes.filter(c => c.id !== id);
        await window.storage?.guardarMultiples('clientes', clientes);
        renderizarTabla();
    }
};

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export { init };
