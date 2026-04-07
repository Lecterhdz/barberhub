// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - AUTH FEATURE (LOGIN)
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
        max_citas: null, // ilimitado
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
    
    // Calcular fecha de expiración
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

// Función para mostrar mensajes de error/éxito
function mostrarMensaje(tipo, mensaje) {
    const errorDiv = document.getElementById('auth-error');
    const successDiv = document.getElementById('auth-success');
    
    // Ocultar ambos
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
    
    if (tipo === 'error') {
        if (errorDiv) {
            errorDiv.textContent = mensaje;
            errorDiv.style.display = 'block';
        }
    } else if (tipo === 'success') {
        if (successDiv) {
            successDiv.textContent = mensaje;
            successDiv.style.display = 'block';
        }
    }
    
    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
        if (errorDiv) errorDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';
    }, 3000);
}

// Función para procesar el login
async function procesarLogin(event) {
    event.preventDefault();
    
    const licenseInput = document.getElementById('license-key');
    const licenseKey = licenseInput?.value || '';
    
    if (!licenseKey) {
        mostrarMensaje('error', '⚠️ Por favor ingresa una clave de licencia');
        return;
    }
    
    // Validar licencia
    const resultado = validarLicencia(licenseKey);
    
    if (!resultado.valido) {
        mostrarMensaje('error', resultado.error);
        return;
    }
    
    // Guardar licencia
    try {
        if (window.app && window.app.setLicencia) {
            window.app.setLicencia(resultado.licencia);
            mostrarMensaje('success', `✅ Licencia ${resultado.licencia.tipo} activada correctamente. Redirigiendo...`);
            
            // Redirigir al dashboard después de 1 segundo
            setTimeout(() => {
                if (window.router && window.router.navegar) {
                    window.router.navegar('/dashboard');
                } else {
                    window.location.href = '/dashboard';
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

// Función para verificar si ya hay una sesión activa
async function verificarSesionActiva() {
    if (window.app && window.app.estado && window.app.estado.licencia) {
        const licencia = window.app.estado.licencia;
        const expiracion = new Date(licencia.expiracion);
        const ahora = new Date();
        
        if (expiracion > ahora) {
            // Sesión válida, redirigir al dashboard
            console.log('Sesión activa encontrada, redirigiendo...');
            setTimeout(() => {
                if (window.router && window.router.navegar) {
                    window.router.navegar('/dashboard');
                }
            }, 500);
        } else if (expiracion <= ahora) {
            // Licencia expirada
            mostrarMensaje('error', '⚠️ Tu licencia ha expirado. Contacta a soporte.');
            // Limpiar licencia expirada
            if (window.app && window.app.logout) {
                window.app.logout();
            }
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔐 Inicializando Auth feature...');
    
    // Verificar si ya hay sesión activa
    verificarSesionActiva();
    
    // Configurar el formulario
    const form = document.getElementById('auth-form');
    if (form) {
        form.addEventListener('submit', procesarLogin);
    } else {
        console.warn('⚠️ Formulario auth no encontrado');
    }
    
    // Agregar estilos dinámicos si es necesario
    const style = document.createElement('style');
    style.textContent = `
        .license-codes {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        .license-codes code {
            display: block;
            background: rgba(0,0,0,0.3);
            padding: 8px;
            margin: 10px 0;
            border-radius: 5px;
            font-family: monospace;
            cursor: pointer;
            transition: all 0.3s;
        }
        .license-codes code:hover {
            background: rgba(255,107,53,0.2);
            transform: translateX(5px);
        }
        .license-codes small {
            display: block;
            margin-top: -5px;
            margin-bottom: 10px;
            font-size: 11px;
            opacity: 0.7;
        }
        .alert {
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            animation: slideIn 0.3s ease;
        }
        .alert-error {
            background: rgba(244,67,54,0.2);
            border: 1px solid #f44336;
            color: #ff8a80;
        }
        .alert-success {
            background: rgba(76,175,80,0.2);
            border: 1px solid #4caf50;
            color: #81c784;
        }
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .btn-full {
            width: 100%;
            margin-top: 20px;
        }
        .auth-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .auth-card {
            max-width: 450px;
            width: 100%;
        }
    `;
    document.head.appendChild(style);
    
    // Hacer que los códigos de licencia sean clickeables
    document.querySelectorAll('.license-codes code').forEach(code => {
        code.addEventListener('click', () => {
            const licenseInput = document.getElementById('license-key');
            if (licenseInput) {
                licenseInput.value = code.textContent.trim();
                // Opcional: auto-submit
                // form?.dispatchEvent(new Event('submit'));
            }
        });
    });
});

// Exportar funciones para uso externo si es necesario
export { validarLicencia, procesarLogin };
