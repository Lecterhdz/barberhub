// src/core/events.js
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
    if (window.storage) {
        store.clientes = await window.storage.obtenerTodos('clientes') || [];
        store.barberos = await window.storage.obtenerTodos('barberos') || [];
        store.citas = await window.storage.obtenerTodos('citas') || [];
        store.servicios = await window.storage.obtenerTodos('servicios') || [];
        store.productos = await window.storage.obtenerTodos('productos') || [];
        store.ventas = await window.storage.obtenerTodos('ventas') || [];
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
    
    // ✅ LLAMAR DIRECTAMENTE A LA FUNCIÓN DE RENDERIZADO DEL FEATURE
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
        
        // Disparar evento específico para cada feature
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
    console.log('👥 Inicializando clientes...');
    
    // Botón nuevo cliente
    const btnNuevo = document.getElementById('btn-nuevo-cliente');
    if (btnNuevo) {
        btnNuevo.onclick = () => {
            document.getElementById('modal-title').textContent = 'Nuevo Cliente';
            document.getElementById('cliente-form').reset();
            document.getElementById('cliente-estado').value = 'activo';
            document.getElementById('cliente-modal').style.display = 'flex';
        };
    }
    
    // Botón cancelar
    const btnCancelar = document.getElementById('cancelar-modal');
    if (btnCancelar) {
        btnCancelar.onclick = () => {
            document.getElementById('cliente-modal').style.display = 'none';
        };
    }
    
    // Formulario
    const form = document.getElementById('cliente-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const cliente = {
                id: Date.now(),
                nombre: document.getElementById('cliente-nombre').value,
                telefono: document.getElementById('cliente-telefono').value,
                email: document.getElementById('cliente-email').value,
                direccion: document.getElementById('cliente-direccion').value,
                estado: document.getElementById('cliente-estado').value,
                visitas: 0,
                gastoTotal: 0,
                fechaRegistro: new Date().toISOString()
            };
            
            await window.storage.guardar('clientes', cliente);
            window.utils.mostrarNotificacion('Cliente agregado', 'success');
            document.getElementById('cliente-modal').style.display = 'none';
            
            // ✅ ACTUALIZAR STORE LOCAL
            await loadStore();
            
            // ✅ LLAMAR DIRECTAMENTE A LA FUNCIÓN DE RENDERIZADO
            if (typeof window.renderizarTablaClientes === 'function') {
                window.renderizarTablaClientes();
            } else {
                // Si no está expuesta, recargar los datos y renderizar
                const clientesActualizados = await window.storage.obtenerTodos('clientes');
                if (window.clientesData) {
                    window.clientesData = clientesActualizados;
                }
                // Disparar evento para que clientes.js se actualice
                window.dispatchEvent(new CustomEvent('refresh-clientes', {}));
            }
        };
    }
    
    // Escuchar refresh
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
    console.log('✂️ Inicializando barberos...');
    
    const btnNuevo = document.getElementById('btn-nuevo-barbero');
    if (btnNuevo) {
        btnNuevo.onclick = () => {
            document.getElementById('modal-title').textContent = 'Nuevo Barbero';
            document.getElementById('barbero-form').reset();
            document.getElementById('barbero-comision').value = '40';
            document.getElementById('barbero-estado').value = 'activo';
            document.getElementById('barbero-horario-inicio').value = '09:00';
            document.getElementById('barbero-horario-fin').value = '18:00';
            document.getElementById('barbero-modal').style.display = 'flex';
        };
    }
    
    const btnCancelar = document.getElementById('cancelar-modal');
    if (btnCancelar) {
        btnCancelar.onclick = () => {
            document.getElementById('barbero-modal').style.display = 'none';
        };
    }
    
    const form = document.getElementById('barbero-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const barbero = {
                id: Date.now(),
                nombre: document.getElementById('barbero-nombre').value,
                telefono: document.getElementById('barbero-telefono').value,
                email: document.getElementById('barbero-email').value,
                especialidad: document.getElementById('barbero-especialidad').value,
                comision: parseInt(document.getElementById('barbero-comision').value),
                estado: document.getElementById('barbero-estado').value,
                horarioInicio: document.getElementById('barbero-horario-inicio').value,
                horarioFin: document.getElementById('barbero-horario-fin').value,
                citasAtendidas: 0,
                ingresosGenerados: 0,
                rating: 0
            };
            
            await window.storage.guardar('barberos', barbero);
            window.utils.mostrarNotificacion('Barbero agregado', 'success');
            document.getElementById('barbero-modal').style.display = 'none';
            
            // ✅ REFRESCAR VISTA
            await refreshCurrentView();
            window.router.navegar('/barberos');
        };
    }
    
    window.addEventListener('refresh-barberos', async () => {
        if (window.router) window.router.navegar('/barberos');
    });
}

// ============================================
// CITAS
// ============================================
function initCitas() {
    console.log('📅 Inicializando citas...');
    
    cargarSelectoresCitas();
    
    const btnNuevo = document.getElementById('btn-nueva-cita');
    if (btnNuevo) {
        btnNuevo.onclick = () => {
            document.getElementById('modal-title').textContent = 'Nueva Cita';
            document.getElementById('cita-form').reset();
            document.getElementById('cita-fecha').value = new Date().toISOString().split('T')[0];
            document.getElementById('cita-estado').value = 'pendiente';
            document.getElementById('cita-modal').style.display = 'flex';
            cargarHorasCitas();
        };
    }
    
    const btnCancelar = document.getElementById('cancelar-modal');
    if (btnCancelar) {
        btnCancelar.onclick = () => {
            document.getElementById('cita-modal').style.display = 'none';
        };
    }
    
    const servicioSelect = document.getElementById('cita-servicio');
    if (servicioSelect) {
        servicioSelect.onchange = () => {
            const option = servicioSelect.options[servicioSelect.selectedIndex];
            const precio = option.dataset.precio || 0;
            document.getElementById('cita-precio').value = precio ? `$${precio}` : '';
        };
    }
    
    const form = document.getElementById('cita-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const servicioOption = document.getElementById('cita-servicio').options[document.getElementById('cita-servicio').selectedIndex];
            
            const cita = {
                id: Date.now(),
                clienteId: parseInt(document.getElementById('cita-cliente').value),
                clienteNombre: document.getElementById('cita-cliente').options[document.getElementById('cita-cliente').selectedIndex]?.text || 'Cliente',
                barberoId: parseInt(document.getElementById('cita-barbero').value),
                barberoNombre: document.getElementById('cita-barbero').options[document.getElementById('cita-barbero').selectedIndex]?.text || 'Barbero',
                servicioId: parseInt(document.getElementById('cita-servicio').value),
                servicioNombre: servicioOption?.text.split(' -')[0] || 'Servicio',
                precio: parseInt(servicioOption?.dataset.precio) || 0,
                fecha: document.getElementById('cita-fecha').value,
                hora: document.getElementById('cita-hora').value,
                estado: document.getElementById('cita-estado').value,
                notas: document.getElementById('cita-notas').value
            };
            
            await window.storage.guardar('citas', cita);
            window.utils.mostrarNotificacion('Cita agendada', 'success');
            document.getElementById('cita-modal').style.display = 'none';
            
            // ✅ REFRESCAR VISTA
            await refreshCurrentView();
            window.router.navegar('/citas');
        };
    }
    
    window.addEventListener('refresh-citas', async () => {
        if (window.router) window.router.navegar('/citas');
    });
}

async function cargarSelectoresCitas() {
    const clientes = await window.storage.obtenerTodos('clientes') || [];
    const barberos = await window.storage.obtenerTodos('barberos') || [];
    const servicios = await window.storage.obtenerTodos('servicios') || [];
    
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
    console.log('✂️ Inicializando servicios...');
    
    const btnNuevo = document.getElementById('btn-nuevo-servicio');
    if (btnNuevo) {
        btnNuevo.onclick = () => {
            document.getElementById('modal-title').textContent = 'Nuevo Servicio';
            document.getElementById('servicio-form').reset();
            document.getElementById('servicio-estado').value = 'activo';
            document.getElementById('servicio-icono').value = '✂️';
            document.getElementById('servicio-modal').style.display = 'flex';
        };
    }
    
    const btnCancelar = document.getElementById('cancelar-modal');
    if (btnCancelar) {
        btnCancelar.onclick = () => {
            document.getElementById('servicio-modal').style.display = 'none';
        };
    }
    
    const form = document.getElementById('servicio-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const servicio = {
                id: Date.now(),
                nombre: document.getElementById('servicio-nombre').value,
                categoria: document.getElementById('servicio-categoria').value,
                precio: parseInt(document.getElementById('servicio-precio').value),
                duracion: parseInt(document.getElementById('servicio-duracion').value),
                estado: document.getElementById('servicio-estado').value,
                icono: document.getElementById('servicio-icono').value,
                descripcion: document.getElementById('servicio-descripcion').value,
                barberos: []
            };
            
            await window.storage.guardar('servicios', servicio);
            window.utils.mostrarNotificacion('Servicio agregado', 'success');
            document.getElementById('servicio-modal').style.display = 'none';
            
            // ✅ REFRESCAR VISTA
            await refreshCurrentView();
            window.router.navegar('/servicios');
        };
    }
    
    window.addEventListener('refresh-servicios', async () => {
        if (window.router) window.router.navegar('/servicios');
    });
}

// ============================================
// INVENTARIO
// ============================================
function initInventario() {
    console.log('📦 Inicializando inventario...');
    
    const btnNuevo = document.getElementById('btn-nuevo-producto');
    if (btnNuevo) {
        btnNuevo.onclick = () => {
            document.getElementById('modal-title').textContent = 'Nuevo Producto';
            document.getElementById('producto-form').reset();
            document.getElementById('producto-stock-minimo').value = '5';
            document.getElementById('producto-modal').style.display = 'flex';
        };
    }
    
    const btnCancelar = document.getElementById('cancelar-modal');
    if (btnCancelar) {
        btnCancelar.onclick = () => {
            document.getElementById('producto-modal').style.display = 'none';
        };
    }
    
    const form = document.getElementById('producto-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const producto = {
                id: Date.now(),
                nombre: document.getElementById('producto-nombre').value,
                categoria: document.getElementById('producto-categoria').value,
                precio: parseInt(document.getElementById('producto-precio').value),
                costo: parseInt(document.getElementById('producto-costo').value),
                stock: parseInt(document.getElementById('producto-stock').value),
                stockMinimo: parseInt(document.getElementById('producto-stock-minimo').value),
                descripcion: document.getElementById('producto-descripcion').value,
                proveedor: document.getElementById('producto-proveedor').value
            };
            
            await window.storage.guardar('productos', producto);
            window.utils.mostrarNotificacion('Producto agregado', 'success');
            document.getElementById('producto-modal').style.display = 'none';
            
            // ✅ REFRESCAR VISTA
            await refreshCurrentView();
            window.router.navegar('/inventario');
        };
    }
    
    window.addEventListener('refresh-inventario', async () => {
        if (window.router) window.router.navegar('/inventario');
    });
}

// ============================================
// CAJA
// ============================================
function initCaja() {
    console.log('💰 Inicializando caja...');
    
    cargarSelectoresCaja();
    
    const btnNuevaVenta = document.getElementById('btn-nueva-venta');
    if (btnNuevaVenta) {
        btnNuevaVenta.onclick = () => {
            document.getElementById('venta-form').reset();
            document.getElementById('venta-tipo').value = 'servicio';
            document.getElementById('venta-cantidad').value = '1';
            toggleTipoVenta();
            document.getElementById('venta-modal').style.display = 'flex';
        };
    }
    
    const btnCancelar = document.getElementById('cancelar-modal');
    if (btnCancelar) {
        btnCancelar.onclick = () => {
            document.getElementById('venta-modal').style.display = 'none';
        };
    }
    
    const tipoSelect = document.getElementById('venta-tipo');
    if (tipoSelect) {
        tipoSelect.onchange = toggleTipoVenta;
    }
    
    const servicioSelect = document.getElementById('venta-servicio');
    if (servicioSelect) {
        servicioSelect.onchange = actualizarPrecioVenta;
    }
    
    const productoSelect = document.getElementById('venta-producto');
    if (productoSelect) {
        productoSelect.onchange = actualizarPrecioVenta;
    }
    
    const cantidadInput = document.getElementById('venta-cantidad');
    if (cantidadInput) {
        cantidadInput.oninput = actualizarPrecioVenta;
    }
    
    const form = document.getElementById('venta-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const tipo = document.getElementById('venta-tipo').value;
            let itemId, itemNombre, precio;
            
            if (tipo === 'servicio') {
                const select = document.getElementById('venta-servicio');
                const option = select.options[select.selectedIndex];
                itemId = parseInt(option.value);
                itemNombre = option.text.split(' -')[0];
                precio = parseInt(option.dataset.precio);
            } else {
                const select = document.getElementById('venta-producto');
                const option = select.options[select.selectedIndex];
                itemId = parseInt(option.value);
                itemNombre = option.text.split(' -')[0];
                precio = parseInt(option.dataset.precio);
            }
            
            const cantidad = parseInt(document.getElementById('venta-cantidad').value);
            const total = precio * cantidad;
            const metodo = document.getElementById('venta-metodo').value;
            
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
            
            window.utils.mostrarNotificacion('Venta registrada', 'success');
            document.getElementById('venta-modal').style.display = 'none';
            
            // ✅ REFRESCAR VISTA
            await refreshCurrentView();
            window.router.navegar('/caja');
        };
    }
    
    const btnCerrarCaja = document.getElementById('btn-cerrar-caja');
    if (btnCerrarCaja) {
        btnCerrarCaja.onclick = () => {
            window.utils.mostrarNotificacion('Caja cerrada correctamente', 'success');
        };
    }
    
    window.addEventListener('refresh-caja', async () => {
        if (window.router) window.router.navegar('/caja');
    });
}

async function cargarSelectoresCaja() {
    const servicios = await window.storage.obtenerTodos('servicios') || [];
    const productos = await window.storage.obtenerTodos('productos') || [];
    
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
    const tipo = document.getElementById('venta-tipo').value;
    document.getElementById('servicio-group').style.display = tipo === 'servicio' ? 'block' : 'none';
    document.getElementById('producto-group').style.display = tipo === 'producto' ? 'block' : 'none';
}

function actualizarPrecioVenta() {
    const tipo = document.getElementById('venta-tipo').value;
    let precio = 0;
    
    if (tipo === 'servicio') {
        const select = document.getElementById('venta-servicio');
        const option = select.options[select.selectedIndex];
        precio = parseInt(option.dataset.precio) || 0;
    } else {
        const select = document.getElementById('venta-producto');
        const option = select.options[select.selectedIndex];
        precio = parseInt(option.dataset.precio) || 0;
    }
    
    const cantidad = parseInt(document.getElementById('venta-cantidad').value) || 1;
    const total = precio * cantidad;
    document.getElementById('venta-precio').value = total ? `$${total.toLocaleString()}` : '';
}

// ============================================
// REPORTES
// ============================================
function initReportes() {
    console.log('📈 Inicializando reportes...');
    
    const btnPDF = document.getElementById('btn-exportar-pdf');
    if (btnPDF) {
        btnPDF.onclick = () => {
            window.utils.mostrarNotificacion('Exportando PDF... (Próximamente)', 'info');
        };
    }
    
    const btnExcel = document.getElementById('btn-exportar-excel');
    if (btnExcel) {
        btnExcel.onclick = () => {
            window.utils.mostrarNotificacion('Exportando Excel... (Próximamente)', 'info');
        };
    }
    
    document.querySelectorAll('.reportes-tab').forEach(tab => {
        tab.onclick = () => {
            const tabName = tab.dataset.tab;
            document.querySelectorAll('.reportes-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.reporte-panel').forEach(p => p.style.display = 'none');
            document.getElementById(`panel-${tabName}`).style.display = 'block';
        };
    });
}

// ============================================
// CONFIGURACIÓN
// ============================================
function initConfiguracion() {
    console.log('⚙️ Inicializando configuración...');
    
    cargarConfiguracionGuardada();
    
    const temaSelect = document.getElementById('config-tema');
    if (temaSelect) {
        temaSelect.onchange = (e) => {
            if (window.app) window.app.cambiarTema(e.target.value);
        };
    }
    
    const btnExportar = document.getElementById('btn-exportar-datos');
    if (btnExportar) {
        btnExportar.onclick = () => {
            if (window.app) window.app.exportarDatos();
        };
    }
    
    const btnResetear = document.getElementById('btn-resetear-datos');
    if (btnResetear) {
        btnResetear.onclick = async () => {
            if (confirm('¿Resetear todos los datos? Esta acción no se puede deshacer.')) {
                localStorage.clear();
                const dbs = await indexedDB.databases();
                for (const db of dbs) {
                    if (db.name === 'BarberHubDB') {
                        indexedDB.deleteDatabase(db.name);
                    }
                }
                alert('Datos eliminados. La página se recargará.');
                location.reload();
            }
        };
    }
    
    const btnCambiarLicencia = document.getElementById('btn-cambiar-licencia');
    if (btnCambiarLicencia) {
        btnCambiarLicencia.onclick = () => {
            if (window.app) window.app.logout();
        };
    }
    
    const inputs = ['config-nombre', 'config-telefono', 'config-direccion', 'config-horario', 'config-idioma', 'config-notificaciones', 'config-sonidos'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.onchange = guardarConfiguracion;
            el.oninput = guardarConfiguracion;
        }
    });
}

function cargarConfiguracionGuardada() {
    const config = JSON.parse(localStorage.getItem('barberhub_config') || '{}');
    if (document.getElementById('config-nombre')) document.getElementById('config-nombre').value = config.nombre || '';
    if (document.getElementById('config-telefono')) document.getElementById('config-telefono').value = config.telefono || '';
    if (document.getElementById('config-direccion')) document.getElementById('config-direccion').value = config.direccion || '';
    if (document.getElementById('config-horario')) document.getElementById('config-horario').value = config.horario || '';
    if (document.getElementById('config-tema')) document.getElementById('config-tema').value = config.tema || 'dark-amber';
    if (document.getElementById('config-idioma')) document.getElementById('config-idioma').value = config.idioma || 'es';
    if (document.getElementById('config-notificaciones')) document.getElementById('config-notificaciones').checked = config.notificaciones || false;
    if (document.getElementById('config-sonidos')) document.getElementById('config-sonidos').checked = config.sonidos || false;
    
    const licencia = JSON.parse(localStorage.getItem('barberhub_licencia') || '{}');
    const licenseInfo = document.getElementById('license-info');
    if (licenseInfo) {
        licenseInfo.innerHTML = licencia.key ? 
            `✅ Licencia: <strong>${licencia.tipo}</strong><br>Expira: ${new Date(licencia.expiracion).toLocaleDateString()}` :
            '❌ No hay licencia activa';
    }
}

function guardarConfiguracion() {
    const config = {
        nombre: document.getElementById('config-nombre')?.value || '',
        telefono: document.getElementById('config-telefono')?.value || '',
        direccion: document.getElementById('config-direccion')?.value || '',
        horario: document.getElementById('config-horario')?.value || '',
        tema: document.getElementById('config-tema')?.value || 'dark-amber',
        idioma: document.getElementById('config-idioma')?.value || 'es',
        notificaciones: document.getElementById('config-notificaciones')?.checked || false,
        sonidos: document.getElementById('config-sonidos')?.checked || false
    };
    localStorage.setItem('barberhub_config', JSON.stringify(config));
    if (window.app && window.app.estado) {
        window.app.estado.configuracion = config;
    }
}

// ============================================
// PORTAL
// ============================================
function initPortal() {
    console.log('🚪 Inicializando portal...');
    
    document.querySelectorAll('.portal-nav-btn').forEach(btn => {
        btn.onclick = () => {
            const pagina = btn.dataset.pagina;
            document.querySelectorAll('.portal-nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.portal-pagina').forEach(p => p.style.display = 'none');
            document.getElementById(`pagina-${pagina}`).style.display = 'block';
        };
    });
    
    document.querySelectorAll('.servicio-card').forEach(card => {
        card.onclick = () => {
            document.querySelectorAll('.servicio-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            document.getElementById('paso-barbero').style.display = 'block';
        };
    });
    
    document.querySelectorAll('.barbero-card-portal').forEach(card => {
        card.onclick = () => {
            document.querySelectorAll('.barbero-card-portal').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            document.getElementById('paso-fecha').style.display = 'block';
            cargarFechasPortal();
        };
    });
}

function cargarFechasPortal() {
    const fechasGrid = document.getElementById('fechas-grid');
    if (!fechasGrid) return;
    
    const fechas = [];
    const hoy = new Date();
    for (let i = 0; i < 7; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() + i);
        fechas.push(fecha);
    }
    
    fechasGrid.innerHTML = fechas.map(fecha => `
        <div class="fecha-card" data-fecha="${fecha.toISOString().split('T')[0]}">
            <div class="fecha-dia">${fecha.getDate()}</div>
            <div class="fecha-nombre">${getNombreDia(fecha.getDay())}</div>
        </div>
    `).join('');
    
    document.querySelectorAll('.fecha-card').forEach(card => {
        card.onclick = () => {
            document.querySelectorAll('.fecha-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            document.getElementById('paso-cliente').style.display = 'block';
        };
    });
}

function getNombreDia(dia) {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dias[dia];
}
