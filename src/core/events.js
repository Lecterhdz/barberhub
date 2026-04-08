// src/core/events.js - Configuración central de eventos

export function initGlobalEvents() {
    console.log('🔌 Inicializando eventos globales...');
    
    // Escuchar cuando se carga un feature
    window.addEventListener('feature-loaded', (e) => {
        const feature = e.detail.feature;
        console.log(`📦 Feature cargado: ${feature}, inicializando eventos...`);
        
        // Inicializar eventos según el feature
        switch(feature) {
            case 'clientes':
                initClientesEvents();
                break;
            case 'barberos':
                initBarberosEvents();
                break;
            case 'citas':
                initCitasEvents();
                break;
            case 'servicios':
                initServiciosEvents();
                break;
            case 'inventario':
                initInventarioEvents();
                break;
            case 'caja':
                initCajaEvents();
                break;
            case 'reportes':
                initReportesEvents();
                break;
            case 'portal':
                initPortalEvents();
                break;
        }
    });
}

// ============ CLIENTES ============
function initClientesEvents() {
    const btnNuevo = document.getElementById('btn-nuevo-cliente');
    if (btnNuevo && !btnNuevo.hasListener) {
        btnNuevo.addEventListener('click', () => {
            console.log('Nuevo cliente clickeado');
            abrirModalCliente();
        });
        btnNuevo.hasListener = true;
    }
}

function abrirModalCliente() {
    const modal = document.getElementById('cliente-modal');
    if (modal) {
        document.getElementById('modal-title').textContent = 'Nuevo Cliente';
        document.getElementById('cliente-form').reset();
        document.getElementById('cliente-estado').value = 'activo';
        modal.style.display = 'flex';
    } else {
        console.error('Modal cliente no encontrado');
    }
}

// ============ BARBEROS ============
function initBarberosEvents() {
    const btnNuevo = document.getElementById('btn-nuevo-barbero');
    if (btnNuevo && !btnNuevo.hasListener) {
        btnNuevo.addEventListener('click', () => {
            console.log('Nuevo barbero clickeado');
            abrirModalBarbero();
        });
        btnNuevo.hasListener = true;
    }
}

function abrirModalBarbero() {
    const modal = document.getElementById('barbero-modal');
    if (modal) {
        document.getElementById('modal-title').textContent = 'Nuevo Barbero';
        document.getElementById('barbero-form').reset();
        document.getElementById('barbero-comision').value = '40';
        document.getElementById('barbero-estado').value = 'activo';
        document.getElementById('barbero-horario-inicio').value = '09:00';
        document.getElementById('barbero-horario-fin').value = '18:00';
        modal.style.display = 'flex';
    }
}

// ============ CITAS ============
function initCitasEvents() {
    const btnNuevo = document.getElementById('btn-nueva-cita');
    if (btnNuevo && !btnNuevo.hasListener) {
        btnNuevo.addEventListener('click', () => {
            console.log('Nueva cita clickeada');
            abrirModalCita();
        });
        btnNuevo.hasListener = true;
    }
}

function abrirModalCita() {
    const modal = document.getElementById('cita-modal');
    if (modal) {
        document.getElementById('modal-title').textContent = 'Nueva Cita';
        document.getElementById('cita-form').reset();
        document.getElementById('cita-fecha').value = new Date().toISOString().split('T')[0];
        document.getElementById('cita-estado').value = 'pendiente';
        modal.style.display = 'flex';
        cargarHorasDisponibles();
    }
}

function cargarHorasDisponibles() {
    const select = document.getElementById('cita-hora');
    if (!select) return;
    
    const horas = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'];
    select.innerHTML = '<option value="">Seleccionar hora</option>' + horas.map(h => `<option value="${h}">${h}</option>`).join('');
}

// ============ SERVICIOS ============
function initServiciosEvents() {
    const btnNuevo = document.getElementById('btn-nuevo-servicio');
    if (btnNuevo && !btnNuevo.hasListener) {
        btnNuevo.addEventListener('click', () => {
            console.log('Nuevo servicio clickeado');
            abrirModalServicio();
        });
        btnNuevo.hasListener = true;
    }
}

function abrirModalServicio() {
    const modal = document.getElementById('servicio-modal');
    if (modal) {
        document.getElementById('modal-title').textContent = 'Nuevo Servicio';
        document.getElementById('servicio-form').reset();
        document.getElementById('servicio-estado').value = 'activo';
        document.getElementById('servicio-icono').value = '✂️';
        modal.style.display = 'flex';
    }
}

// ============ INVENTARIO ============
function initInventarioEvents() {
    const btnNuevo = document.getElementById('btn-nuevo-producto');
    if (btnNuevo && !btnNuevo.hasListener) {
        btnNuevo.addEventListener('click', () => {
            console.log('Nuevo producto clickeado');
            abrirModalProducto();
        });
        btnNuevo.hasListener = true;
    }
}

function abrirModalProducto() {
    const modal = document.getElementById('producto-modal');
    if (modal) {
        document.getElementById('modal-title').textContent = 'Nuevo Producto';
        document.getElementById('producto-form').reset();
        document.getElementById('producto-stock-minimo').value = '5';
        modal.style.display = 'flex';
    }
}

// ============ CAJA ============
function initCajaEvents() {
    const btnNuevaVenta = document.getElementById('btn-nueva-venta');
    if (btnNuevaVenta && !btnNuevaVenta.hasListener) {
        btnNuevaVenta.addEventListener('click', () => {
            console.log('Nueva venta clickeada');
            abrirModalVenta();
        });
        btnNuevaVenta.hasListener = true;
    }
    
    const btnCerrarCaja = document.getElementById('btn-cerrar-caja');
    if (btnCerrarCaja && !btnCerrarCaja.hasListener) {
        btnCerrarCaja.addEventListener('click', () => {
            console.log('Cerrar caja clickeado');
            abrirCierreCaja();
        });
        btnCerrarCaja.hasListener = true;
    }
}

function abrirModalVenta() {
    const modal = document.getElementById('venta-modal');
    if (modal) {
        document.getElementById('venta-form').reset();
        document.getElementById('venta-tipo').value = 'servicio';
        document.getElementById('venta-cantidad').value = '1';
        modal.style.display = 'flex';
    }
}

function abrirCierreCaja() {
    const modal = document.getElementById('cerrar-caja-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// ============ REPORTES ============
function initReportesEvents() {
    const btnPDF = document.getElementById('btn-exportar-pdf');
    if (btnPDF && !btnPDF.hasListener) {
        btnPDF.addEventListener('click', () => {
            alert('📄 Exportando a PDF... (Función en desarrollo)');
        });
        btnPDF.hasListener = true;
    }
    
    const btnExcel = document.getElementById('btn-exportar-excel');
    if (btnExcel && !btnExcel.hasListener) {
        btnExcel.addEventListener('click', () => {
            alert('📊 Exportando a Excel... (Función en desarrollo)');
        });
        btnExcel.hasListener = true;
    }
}

// ============ PORTAL ============
function initPortalEvents() {
    console.log('Portal events initialized');
}
