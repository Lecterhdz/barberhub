// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - AUTH FEATURE (LOGIN) - CORREGIDO
// ─────────────────────────────────────────────────────────────────────

console.log('🔐 Auth feature cargado');

// Configuración de licencias válidas
const LICENCIAS_VALIDAS = {
    'BARBERHUB-DEMO-2026': {
        tipo: 'DEMO',
        dias: 7,
        max_citas: 50,
        features: ['dashboard', 'clientes', 'cortes']
    },
    'BARBERHUB-BASICO-2026': {
        tipo: 'BASICO',
        dias: 365,
        max_citas: null,
        features: ['dashboard', 'clientes', 'cortes', 'inventario']
    },
    'BARBERHUB-PRO-2026': {
        tipo: 'PRO',
        dias: 365,
        max_citas: null,
        features: ['dashboard', 'clientes', 'cortes', 'inventario', 'caja', 'reportes']
    },
    'BARBERHUB-SALON-2026': {
        tipo: 'SALON',
        dias: 365,
        max_citas: null,
        features: ['dashboard', 'clientes', 'cortes', 'inventario', 'caja', 'reportes', 'configuracion']
    }
};

// Función para validar licencia
function validarLicencia(licenseKey) {
    const key = licenseKey.toUpperCase().trim();
    const licencia = LICENCIAS_VALIDAS[key];
    
    if (!licencia) {
        return { valido: false, error: '❌ Licencia inválida. Verifica el código ingresado.' };
    }
    
    const expiracion = new Date();
    expiracion.setDate(expiracion.getDate() + licencia.dias);
    
    return {
        valido: true,
        licencia: {
            key: key,
            tipo: licencia.tipo,
            expiracion: expiracion.toISOString(),
            max_citas: licencia.max_citas,
            features: licencia.features
        }
    };
}

// Función para mostrar mensajes
function mostrarMensaje(tipo, mensaje) {
    const errorDiv = document.getElementById('auth-error');
    const successDiv = document.getElementById('auth-success');
    
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
    
    if (tipo === 'error' && errorDiv) {
        errorDiv.textContent = mensaje;
        errorDiv.style.display = 'block';
    } else if (tipo === 'success' && successDiv) {
        successDiv.textContent = mensaje;
        successDiv.style.display = 'block';
    }
    
    setTimeout(() => {
        if (errorDiv) errorDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';
    }, 3000);
}

// Procesar login
async function procesarLogin(event) {
    event.preventDefault();
    
    const licenseInput = document.getElementById('license-key');
    const licenseKey = licenseInput?.value || '';
    
    if (!licenseKey) {
        mostrarMensaje('error', '⚠️ Por favor ingresa una clave de licencia');
        return;
    }
    
    const resultado = validarLicencia(licenseKey);
    
    if (!resultado.valido) {
        mostrarMensaje('error', resultado.error);
        return;
    }
    
    try {
        if (window.app && window.app.setLicencia) {
            window.app.setLicencia(resultado.licencia);
            mostrarMensaje('success', `✅ Licencia ${resultado.licencia.tipo} activada correctamente. Redirigiendo...`);
            
            setTimeout(() => {
                if (window.router && window.router.navegar) {
                    window.router.navegar('/dashboard');
                } else {
                    window.location.hash = '/dashboard';
                }
            }, 1000);
        } else {
            console.error('❌ App no disponible');
            mostrarMensaje('error', 'Error interno. Recarga la página.');
        }
    } catch (error) {
        console.error('Error al guardar licencia:', error);
        mostrarMensaje('error', 'Error al activar licencia. Intenta nuevamente.');
    }
}

// Verificar sesión activa
async function verificarSesionActiva() {
    if (window.app && window.app.estado && window.app.estado.licencia) {
        const licencia = window.app.estado.licencia;
        const expiracion = new Date(licencia.expiracion);
        const ahora = new Date();
        
        if (expiracion > ahora) {
            console.log('Sesión activa encontrada, redirigiendo...');
            setTimeout(() => {
                if (window.router && window.router.navegar) {
                    window.router.navegar('/dashboard');
                }
            }, 500);
        } else if (expiracion <= ahora) {
            mostrarMensaje('error', '⚠️ Tu licencia ha expirado. Contacta a soporte.');
            if (window.app && window.app.logout) {
                window.app.logout();
            }
        }
    }
}

// Inicializar
function init() {
    console.log('🔐 Inicializando Auth feature...');
    
    verificarSesionActiva();
    
    const form = document.getElementById('auth-form');
    if (form) {
        form.addEventListener('submit', procesarLogin);
    } else {
        console.warn('⚠️ Formulario auth no encontrado');
    }
    
    // Hacer clickeables los items de licencia
    document.querySelectorAll('.license-item').forEach(item => {
        item.addEventListener('click', () => {
            const code = item.querySelector('code');
            const licenseInput = document.getElementById('license-key');
            if (code && licenseInput) {
                licenseInput.value = code.textContent.trim();
                // Auto-enviar formulario
                setTimeout(() => {
                    if (form) form.dispatchEvent(new Event('submit'));
                }, 100);
            }
        });
    });
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Exportar
export { validarLicencia, procesarLogin, init };
