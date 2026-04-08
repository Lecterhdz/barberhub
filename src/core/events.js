// src/core/events.js
// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - SISTEMA DE EVENTOS CENTRALIZADO
// ─────────────────────────────────────────────────────────────────────

console.log('🎯 Sistema de eventos centralizado');

// Store para los datos globales
let store = {
    clientes: [],
    barberos: [],
    citas: [],
    servicios: [],
    productos: [],
    ventas: []
};

// Cargar datos desde storage
async function loadStore() {
    if (!window.storage) return;
    
    try {
        store.clientes = await window.storage.obtenerTodos('clientes') || [];
        store.barberos = await window.storage.obtenerTodos('barberos') || [];
        store.citas = await window.storage.obtenerTodos('citas') || [];
        store.servicios = await window.storage.obtenerTodos('servicios') || [];
        store.productos = await window.storage.obtenerTodos('productos') || [];
        store.ventas = await window.storage.obtenerTodos('ventas') || [];
        
        console.log('📦 Store actualizado:', {
            clientes: store.clientes.length,
            barberos: store.barberos.length,
            citas: store.citas.length,
            servicios: store.servicios.length,
            productos: store.productos.length,
            ventas: store.ventas.length
        });
    } catch (error) {
        console.error('Error cargando store:', error);
    }
}

// Función para cerrar cualquier modal
function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Función para configurar cierre de modales
function setupModalClose(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Botón X
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn && !closeBtn.hasListener) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
        closeBtn.hasListener = true;
    }
    
    // Clic fuera del modal
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Refrescar la vista actual
async function refreshCurrentView() {
    const currentPath = window.location.hash.substring(1);
    let feature = 'dashboard';
    
    if (currentPath.includes('clientes')) feature = 'clientes';
    else if (currentPath.includes('barberos')) feature = 'barberos';
    else if (currentPath.includes('citas')) feature = 'citas';
    else if (currentPath.includes('servicios')) feature = 'servicios';
    else if (currentPath.includes('inventario')) feature = 'inventario';
    else if (currentPath.includes('caja')) feature = 'caja';
    else if (currentPath.includes('reportes')) feature = 'reportes';
    
    // Recargar datos
    await loadStore();
    
    // Llamar directamente a la función de renderizado del feature
    switch(feature) {
        case 'clientes':
            if (typeof window.renderizarTablaClientes === 'function') {
                window.renderizarTablaClientes();
            } else {
                window.dispatchEvent(new CustomEvent('refresh-clientes', {}));
            }
            break;
        case 'barberos':
            if (typeof window.renderizarGridBarberos === 'function') {
                window.renderizarGridBarberos();
            } else {
                window.dispatchEvent(new CustomEvent('refresh-barberos', {}));
            }
            break;
        case 'citas':
            if (typeof window.renderizarListaCitas === 'function') {
                window.renderizarListaCitas();
            } else {
                window.dispatchEvent(new CustomEvent('refresh-citas', {}));
            }
            break;
        case 'servicios':
            if (typeof window.renderizarGridServicios === 'function') {
                window.renderizarGridServicios();
            } else {
                window.dispatchEvent(new CustomEvent('refresh-servicios', {}));
            }
            break;
        case 'inventario':
            if (typeof window.renderizarTablaInventario === 'function') {
                window.renderizarTablaInventario();
            } else {
                window.dispatchEvent(new CustomEvent('refresh-inventario', {}));
            }
            break;
        case 'caja':
            if (typeof window.renderizarTablaCaja === 'function') {
                window.renderizarTablaCaja();
            } else {
                window.dispatchEvent(new CustomEvent('refresh-caja', {}));
            }
            break;
        default:
            console.log('Feature no reconocido para refresh:', feature);
    }
}

// Inicializar eventos globales
export async function initGlobalEvents() {
    console.log('🔌 Inicializando eventos globales...');
    await loadStore();
    
    window.addEventListener('feature-loaded', async (e) => {
        const feature = e.detail.feature;
        console.log(`📦 Feature cargado: ${feature}`);
        await loadStore();
        initFeatureEvents(feature);
        
        // Configurar cierre de modales para este feature
        setTimeout(() => {
            const modals = ['cliente-modal', 'barbero-modal', 'cita-modal', 'servicio-modal', 'producto-modal', 'venta-modal', 'cerrar-caja-modal'];
            modals.forEach(modalId => setupModalClose(modalId));
        }, 100);
    });
    
    // Escuchar refresh de vista
    window.addEventListener('refresh-view', async (e) => {
        const feature = e.detail.feature;
        console.log(`🔄 Refrescando vista: ${feature}`);
        await loadStore();
        window.dispatchEvent(new CustomEvent(`refresh-${feature}`, {}));
    });
}

// Inicializar eventos según el feature
async function initFeatureEvents(feature) {
    switch(feature) {
        case 'clientes':
            initClientes();
            break;
        case 'barberos':
            initBarberos();
            break;
        case 'citas':
            initCitas();
            break;
        case 'servicios':
            initServicios();
            break;
        case 'inventario':
            initInventario();
            break;
        case 'caja':
            initCaja();
            break;
        case 'reportes':
            initReportes();
            break;
        case 'configuracion':
            initConfiguracion();
            break;
        case 'portal':
            initPortal();
            break;
    }
}

// ============================================
// CLIENTES
// ============================================
function initClientes() {
    console.log('👥 Inicializando eventos de clientes...');
    
    const btnNuevo = document.getElementById('btn-nuevo-cliente');
    if (btnNuevo && !btnNuevo._listener) {
        btnNuevo.onclick = () => {
            const modal = document.getElementById('cliente-modal');
            if (modal) {
                document.getElementById('modal-title').textContent = 'Nuevo Cliente';
                document.getElementById('cliente-form').reset();
                document.getElementById('cliente-estado').value = 'activo';
                modal.style.display = 'flex';
            }
        };
        btnNuevo._listener = true;
    }
    
    const btnCancelar = document.getElementById('cancelar-modal');
    if (btnCancelar && !btnCancelar._listener) {
        btnCancelar.onclick = () => {
            document.getElementById('cliente-modal').style.display = 'none';
        };
        btnCancelar._listener = true;
    }
    
    const form = document.getElementById('cliente-form');
    if (form && !form._listener) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const cliente = {
                id: Date.now(),
                nombre: document.getElementById('cliente-nombre')?.value || '',
                telefono: document.getElementById('cliente-telefono')?.value || '',
                email: document.getElementById('cliente-email')?.value || '',
                direccion: document.getElementById('cliente-direccion')?.value || '',
                estado: document.getElementById('cliente-estado')?.value || 'activo',
                visitas: 0,
                gastoTotal: 0,
                fechaRegistro: new Date().toISOString()
            };
            
            if (!cliente.nombre || !cliente.telefono) {
                alert('Nombre y teléfono son requeridos');
                return;
            }
            
            await window.storage.guardar('clientes', cliente);
            if (window.utils) window.utils.mostrarNotificacion('Cliente agregado', 'success');
            document.getElementById('cliente-modal').style.display = 'none';
            
            await loadStore();
            
            if (typeof window.renderizarTablaClientes === 'function') {
                window.renderizarTablaClientes();
            } else {
                window.dispatchEvent(new CustomEvent('refresh-clientes', {}));
            }
        };
        form._listener = true;
    }
    
    window.addEventListener('refresh-clientes', async () => {
        console.log('🔄 Refrescando clientes...');
        await loadStore();
        if (typeof window.renderizarTablaClientes === 'function') {
            window.renderizarTablaClientes();
        }
    });
}

// ============================================
// BARBEROS
// ============================================
function initBarberos() {
    console.log('✂️ Inicializando eventos de barberos...');
    
    const btnNuevo = document.getElementById('btn-nuevo-barbero');
    if (btnNuevo && !btnNuevo._listener) {
        btnNuevo.onclick = () => {
            const modal = document.getElementById('barbero-modal');
            if (modal) {
                document.getElementById('modal-title').textContent = 'Nuevo Barbero';
                document.getElementById('barbero-form').reset();
                document.getElementById('barbero-comision').value = '40';
                document.getElementById('barbero-estado').value = 'activo';
                modal.style.display = 'flex';
            }
        };
        btnNuevo._listener = true;
    }
    
    const btnCancelar = document.getElementById('cancelar-modal');
    if (btnCancelar && !btnCancelar._listener) {
        btnCancelar.onclick = () => {
            document.getElementById('barbero-modal').style.display = 'none';
        };
        btnCancelar._listener = true;
    }
    
    const form = document.getElementById('barbero-form');
    if (form && !form._listener) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const barbero = {
                id: Date.now(),
                nombre: document.getElementById('barbero-nombre')?.value || '',
                telefono: document.getElementById('barbero-telefono')?.value || '',
                email: document.getElementById('barbero-email')?.value || '',
                especialidad: document.getElementById('barbero-especialidad')?.value || 'Corte',
                comision: parseInt(document.getElementById('barbero-comision')?.value) || 40,
                estado: document.getElementById('barbero-estado')?.value || 'activo',
                horarioInicio: document.getElementById('barbero-horario-inicio')?.value || '09:00',
                horarioFin: document.getElementById('barbero-horario-fin')?.value || '18:00',
                citasAtendidas: 0,
                ingresosGenerados: 0,
                rating: 0
            };
            
            await window.storage.guardar('barberos', barbero);
            if (window.utils) window.utils.mostrarNotificacion('Barbero agregado', 'success');
            document.getElementById('barbero-modal').style.display = 'none';
            
            await refreshCurrentView();
            if (window.router) window.router.navegar('/barberos');
        };
        form._listener = true;
    }
}

// ============================================
// CITAS
// ============================================
function initCitas() {
    console.log('📅 Inicializando eventos de citas...');
    
    cargarSelectoresCitas();
    
    const btnNuevo = document.getElementById('btn-nueva-cita');
    if (btnNuevo && !btnNuevo._listener) {
        btnNuevo.onclick = () => {
            const modal = document.getElementById('cita-modal');
            if (modal) {
                document.getElementById('modal-title').textContent = 'Nueva Cita';
                document.getElementById('cita-form').reset();
                document.getElementById('cita-fecha').value = new Date().toISOString().split('T')[0];
                document.getElementById('cita-estado').value = 'pendiente';
                modal.style.display = 'flex';
                cargarHorasCitas();
            }
        };
        btnNuevo._listener = true;
    }
    
    const btnCancelar = document.getElementById('cancelar-modal');
    if (btnCancelar && !btnCancelar._listener) {
        btnCancelar.onclick = () => {
            document.getElementById('cita-modal').style.display = 'none';
        };
        btnCancelar._listener = true;
    }
    
    const servicioSelect = document.getElementById('cita-servicio');
    if (servicioSelect && !servicioSelect._listener) {
        servicioSelect.onchange = () => {
            const option = servicioSelect.options[servicioSelect.selectedIndex];
            const precio = option?.dataset?.precio || 0;
            const precioInput = document.getElementById('cita-precio');
            if (precioInput) precioInput.value = precio ? `$${precio}` : '';
        };
        servicioSelect._listener = true;
    }
    
    const form = document.getElementById('cita-form');
    if (form && !form._listener) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const servicioOption = document.getElementById('cita-servicio')?.options[document.getElementById('cita-servicio')?.selectedIndex];
            
            const cita = {
                id: Date.now(),
                clienteId: parseInt(document.getElementById('cita-cliente')?.value) || 0,
                clienteNombre: document.getElementById('cita-cliente')?.options[document.getElementById('cita-cliente')?.selectedIndex]?.text || 'Cliente',
                barberoId: parseInt(document.getElementById('cita-barbero')?.value) || 0,
                barberoNombre: document.getElementById('cita-barbero')?.options[document.getElementById('cita-barbero')?.selectedIndex]?.text || 'Barbero',
                servicioId: parseInt(document.getElementById('cita-servicio')?.value) || 0,
                servicioNombre: servicioOption?.text?.split(' -')[0] || 'Servicio',
                precio: parseInt(servicioOption?.dataset?.precio) || 0,
                fecha: document.getElementById('cita-fecha')?.value || '',
                hora: document.getElementById('cita-hora')?.value || '',
                estado: document.getElementById('cita-estado')?.value || 'pendiente',
                notas: document.getElementById('cita-notas')?.value || ''
            };
            
            await window.storage.guardar('citas', cita);
            if (window.utils) window.utils.mostrarNotificacion('Cita agendada', 'success');
            document.getElementById('cita-modal').style.display = 'none';
            
            await refreshCurrentView();
            if (window.router) window.router.navegar('/citas');
        };
        form._listener = true;
    }
}

async function cargarSelectoresCitas() {
    const clientes = await window.storage?.obtenerTodos('clientes') || [];
    const barberos = await window.storage?.obtenerTodos('barberos') || [];
    const servicios = await window.storage?.obtenerTodos('servicios') || [];
    
    const clienteSelect = document.getElementById('cita-cliente');
    if (clienteSelect) {
        clienteSelect.innerHTML = '<option value="">Seleccionar cliente</option>' + 
            clientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    }
    
    const barberoSelect = document.getElementById('cita-barbero');
    if (barberoSelect) {
        barberoSelect.innerHTML = '<option value="">Seleccionar barbero</option>' + 
            barberos.filter(b => b.estado === 'activo').map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');
    }
    
    const servicioSelect = document.getElementById('cita-servicio');
    if (servicioSelect) {
        servicioSelect.innerHTML = '<option value="">Seleccionar servicio</option>' + 
            servicios.map(s => `<option value="${s.id}" data-precio="${s.precio}">${s.nombre} - $${s.precio}</option>`).join('');
    }
}

function cargarHorasCitas() {
    const select = document.getElementById('cita-hora');
    if (!select) return;
    const horas = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    select.innerHTML = '<option value="">Seleccionar hora</option>' + horas.map(h => `<option value="${h}">${h}</option>`).join('');
}

// ============================================
// SERVICIOS
// ============================================
function initServicios() {
    console.log('✂️ Inicializando eventos de servicios...');
    
    const btnNuevo = document.getElementById('btn-nuevo-servicio');
    if (btnNuevo && !btnNuevo._listener) {
        btnNuevo.onclick = () => {
            const modal = document.getElementById('servicio-modal');
            if (modal) {
                document.getElementById('modal-title').textContent = 'Nuevo Servicio';
                document.getElementById('servicio-form').reset();
                document.getElementById('servicio-estado').value = 'activo';
                modal.style.display = 'flex';
            }
        };
        btnNuevo._listener = true;
    }
    
    const btnCancelar = document.getElementById('cancelar-modal');
    if (btnCancelar && !btnCancelar._listener) {
        btnCancelar.onclick = () => {
            document.getElementById('servicio-modal').style.display = 'none';
        };
        btnCancelar._listener = true;
    }
    
    const form = document.getElementById('servicio-form');
    if (form && !form._listener) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const servicio = {
                id: Date.now(),
                nombre: document.getElementById('servicio-nombre')?.value || '',
                categoria: document.getElementById('servicio-categoria')?.value || '',
                precio: parseInt(document.getElementById('servicio-precio')?.value) || 0,
                duracion: parseInt(document.getElementById('servicio-duracion')?.value) || 30,
                estado: document.getElementById('servicio-estado')?.value || 'activo',
                icono: document.getElementById('servicio-icono')?.value || '✂️',
                descripcion: document.getElementById('servicio-descripcion')?.value || ''
            };
            
            await window.storage.guardar('servicios', servicio);
            if (window.utils) window.utils.mostrarNotificacion('Servicio agregado', 'success');
            document.getElementById('servicio-modal').style.display = 'none';
            
            await refreshCurrentView();
            if (window.router) window.router.navegar('/servicios');
        };
        form._listener = true;
    }
}

// ============================================
// INVENTARIO
// ============================================
function initInventario() {
    console.log('📦 Inicializando eventos de inventario...');
    
    const btnNuevo = document.getElementById('btn-nuevo-producto');
    if (btnNuevo && !btnNuevo._listener) {
        btnNuevo.onclick = () => {
            const modal = document.getElementById('producto-modal');
            if (modal) {
                document.getElementById('modal-title').textContent = 'Nuevo Producto';
                document.getElementById('producto-form').reset();
                document.getElementById('producto-stock-minimo').value = '5';
                modal.style.display = 'flex';
            }
        };
        btnNuevo._listener = true;
    }
    
    const btnCancelar = document.getElementById('cancelar-modal');
    if (btnCancelar && !btnCancelar._listener) {
        btnCancelar.onclick = () => {
            document.getElementById('producto-modal').style.display = 'none';
        };
        btnCancelar._listener = true;
    }
    
    const form = document.getElementById('producto-form');
    if (form && !form._listener) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const producto = {
                id: Date.now(),
                nombre: document.getElementById('producto-nombre')?.value || '',
                categoria: document.getElementById('producto-categoria')?.value || '',
                precio: parseInt(document.getElementById('producto-precio')?.value) || 0,
                costo: parseInt(document.getElementById('producto-costo')?.value) || 0,
                stock: parseInt(document.getElementById('producto-stock')?.value) || 0,
                stockMinimo: parseInt(document.getElementById('producto-stock-minimo')?.value) || 5,
                descripcion: document.getElementById('producto-descripcion')?.value || '',
                proveedor: document.getElementById('producto-proveedor')?.value || ''
            };
            
            await window.storage.guardar('productos', producto);
            if (window.utils) window.utils.mostrarNotificacion('Producto agregado', 'success');
            document.getElementById('producto-modal').style.display = 'none';
            
            await refreshCurrentView();
            if (window.router) window.router.navegar('/inventario');
        };
        form._listener = true;
    }
}

// ============================================
// CAJA
// ============================================
function initCaja() {
    console.log('💰 Inicializando eventos de caja...');
    
    cargarSelectoresCaja();
    
    const btnNuevaVenta = document.getElementById('btn-nueva-venta');
    if (btnNuevaVenta && !btnNuevaVenta._listener) {
        btnNuevaVenta.onclick = () => {
            const modal = document.getElementById('venta-modal');
            if (modal) {
                document.getElementById('venta-form').reset();
                document.getElementById('venta-tipo').value = 'servicio';
                document.getElementById('venta-cantidad').value = '1';
                toggleTipoVenta();
                modal.style.display = 'flex';
            }
        };
        btnNuevaVenta._listener = true;
    }
    
    const btnCancelar = document.getElementById('cancelar-modal');
    if (btnCancelar && !btnCancelar._listener) {
        btnCancelar.onclick = () => {
            document.getElementById('venta-modal').style.display = 'none';
        };
        btnCancelar._listener = true;
    }
    
    const tipoSelect = document.getElementById('venta-tipo');
    if (tipoSelect && !tipoSelect._listener) {
        tipoSelect.onchange = toggleTipoVenta;
        tipoSelect._listener = true;
    }
    
    const form = document.getElementById('venta-form');
    if (form && !form._listener) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const tipo = document.getElementById('venta-tipo')?.value || 'servicio';
            let itemId, itemNombre, precio;
            
            if (tipo === 'servicio') {
                const select = document.getElementById('venta-servicio');
                const option = select?.options[select.selectedIndex];
                itemId = parseInt(option?.value) || 0;
                itemNombre = option?.text?.split(' -')[0] || '';
                precio = parseInt(option?.dataset?.precio) || 0;
            } else {
                const select = document.getElementById('venta-producto');
                const option = select?.options[select.selectedIndex];
                itemId = parseInt(option?.value) || 0;
                itemNombre = option?.text?.split(' -')[0] || '';
                precio = parseInt(option?.dataset?.precio) || 0;
            }
            
            const cantidad = parseInt(document.getElementById('venta-cantidad')?.value) || 1;
            const total = precio * cantidad;
            const metodo = document.getElementById('venta-metodo')?.value || 'efectivo';
            
            const venta = {
                id: Date.now(),
                fecha: new Date().toISOString().split('T')[0],
                tipo: tipo,
                itemId: itemId,
                itemNombre: itemNombre,
                cantidad: cantidad,
                precio: precio,
                total: total,
                metodo: metodo,
                estado: 'pagado'
            };
            
            await window.storage.guardar('ventas', venta);
            
            if (tipo === 'producto') {
                const productos = await window.storage.obtenerTodos('productos') || [];
                const producto = productos.find(p => p.id === itemId);
                if (producto) {
                    producto.stock -= cantidad;
                    await window.storage.guardar('productos', producto);
                }
            }
            
            if (window.utils) window.utils.mostrarNotificacion('Venta registrada', 'success');
            document.getElementById('venta-modal').style.display = 'none';
            
            await refreshCurrentView();
            if (window.router) window.router.navegar('/caja');
        };
        form._listener = true;
    }
}

async function cargarSelectoresCaja() {
    const servicios = await window.storage?.obtenerTodos('servicios') || [];
    const productos = await window.storage?.obtenerTodos('productos') || [];
    
    const servicioSelect = document.getElementById('venta-servicio');
    if (servicioSelect) {
        servicioSelect.innerHTML = '<option value="">Seleccionar servicio</option>' + 
            servicios.map(s => `<option value="${s.id}" data-precio="${s.precio}">${s.nombre} - $${s.precio}</option>`).join('');
    }
    
    const productoSelect = document.getElementById('venta-producto');
    if (productoSelect) {
        productoSelect.innerHTML = '<option value="">Seleccionar producto</option>' + 
            productos.map(p => `<option value="${p.id}" data-precio="${p.precio}">${p.nombre} - $${p.precio} (Stock: ${p.stock})</option>`).join('');
    }
}

function toggleTipoVenta() {
    const tipo = document.getElementById('venta-tipo')?.value;
    const servicioGroup = document.getElementById('servicio-group');
    const productoGroup = document.getElementById('producto-group');
    
    if (servicioGroup) servicioGroup.style.display = tipo === 'servicio' ? 'block' : 'none';
    if (productoGroup) productoGroup.style.display = tipo === 'producto' ? 'block' : 'none';
}

// ============================================
// REPORTES
// ============================================
function initReportes() {
    console.log('📈 Inicializando eventos de reportes...');
    
    const btnPDF = document.getElementById('btn-exportar-pdf');
    if (btnPDF && !btnPDF._listener) {
        btnPDF.onclick = () => {
            if (window.utils) window.utils.mostrarNotificacion('Exportando PDF... (Próximamente)', 'info');
        };
        btnPDF._listener = true;
    }
    
    const btnExcel = document.getElementById('btn-exportar-excel');
    if (btnExcel && !btnExcel._listener) {
        btnExcel.onclick = () => {
            if (window.utils) window.utils.mostrarNotificacion('Exportando Excel... (Próximamente)', 'info');
        };
        btnExcel._listener = true;
    }
    
    document.querySelectorAll('.reportes-tab').forEach(tab => {
        if (!tab._listener) {
            tab.onclick = () => {
                const tabName = tab.dataset.tab;
                document.querySelectorAll('.reportes-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelectorAll('.reporte-panel').forEach(p => p.style.display = 'none');
                const panel = document.getElementById(`panel-${tabName}`);
                if (panel) panel.style.display = 'block';
            };
            tab._listener = true;
        }
    });
}

// ============================================
// CONFIGURACIÓN
// ============================================
function initConfiguracion() {
    console.log('⚙️ Inicializando eventos de configuración...');
    
    cargarConfiguracionGuardada();
    
    const temaSelect = document.getElementById('config-tema');
    if (temaSelect && !temaSelect._listener) {
        temaSelect.onchange = (e) => {
            if (window.app) window.app.cambiarTema(e.target.value);
        };
        temaSelect._listener = true;
    }
    
    const btnExportar = document.getElementById('btn-exportar-datos');
    if (btnExportar && !btnExportar._listener) {
        btnExportar.onclick = () => {
            if (window.app) window.app.exportarDatos();
        };
        btnExportar._listener = true;
    }
    
    const btnCambiarLicencia = document.getElementById('btn-cambiar-licencia');
    if (btnCambiarLicencia && !btnCambiarLicencia._listener) {
        btnCambiarLicencia.onclick = () => {
            if (window.app) window.app.logout();
        };
        btnCambiarLicencia._listener = true;
    }
}

function cargarConfiguracionGuardada() {
    const config = JSON.parse(localStorage.getItem('barberhub_config') || '{}');
    if (document.getElementById('config-nombre')) document.getElementById('config-nombre').value = config.nombre || '';
    if (document.getElementById('config-telefono')) document.getElementById('config-telefono').value = config.telefono || '';
    if (document.getElementById('config-direccion')) document.getElementById('config-direccion').value = config.direccion || '';
    if (document.getElementById('config-horario')) document.getElementById('config-horario').value = config.horario || '';
    if (document.getElementById('config-tema')) document.getElementById('config-tema').value = config.tema || 'dark-amber';
    
    const licencia = JSON.parse(localStorage.getItem('barberhub_licencia') || '{}');
    const licenseInfo = document.getElementById('license-info');
    if (licenseInfo) {
        licenseInfo.innerHTML = licencia.key ? 
            `✅ Licencia: <strong>${licencia.tipo}</strong><br>Expira: ${new Date(licencia.expiracion).toLocaleDateString()}` :
            '❌ No hay licencia activa';
    }
}

// ============================================
// PORTAL
// ============================================
function initPortal() {
    console.log('🚪 Inicializando eventos del portal...');
    
    document.querySelectorAll('.portal-nav-btn').forEach(btn => {
        if (!btn._listener) {
            btn.onclick = () => {
                const pagina = btn.dataset.pagina;
                document.querySelectorAll('.portal-nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.portal-pagina').forEach(p => p.style.display = 'none');
                const paginaEl = document.getElementById(`pagina-${pagina}`);
                if (paginaEl) paginaEl.style.display = 'block';
            };
            btn._listener = true;
        }
    });
}

// Exportar funciones
export { loadStore, refreshCurrentView, cerrarModal, setupModalClose };
