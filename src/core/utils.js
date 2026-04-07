// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - UTILS (HELPERS PUROS SIN EFECTOS SECUNDARIOS)
// ─────────────────────────────────────────────────────────────────────

console.log('🔧 Utils cargado');

export const utils = {
    // Formato de moneda MXN
    formatoMoneda: function(cantidad) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(cantidad);
    },

    // Formato de fecha
    formatoFecha: function(fecha) {
        if (!fecha) return '';
        return new Date(fecha).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Formato de hora
    formatoHora: function(fecha) {
        if (!fecha) return '';
        return new Date(fecha).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Fecha actual en formato YYYY-MM-DD
    fechaActual: function() {
        return new Date().toISOString().split('T')[0];
    },

    // Generar ID único
    generarId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Validar email
    esEmail: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // Validar teléfono MX
    esTelefonoMX: function(telefono) {
        return /^(\+52|52)?[1-9]\d{9}$/.test(telefono.replace(/\D/g, ''));
    },

    // Capitalizar primera letra
    capitalizar: function(texto) {
        if (!texto) return '';
        return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
    },

    // Truncar texto
    truncar: function(texto, longitud) {
        if (!texto) return '';
        if (texto.length <= longitud) return texto;
        return texto.substr(0, longitud) + '...';
    },

    // Esperar (delay)
    esperar: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Mostrar notificación toast
    toast: function(mensaje, tipo = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${tipo}`;
        toast.textContent = mensaje;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 10px;
            color: white;
            font-weight: 600;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            background: ${tipo === 'success' ? '#4CAF50' : tipo === 'error' ? '#f44336' : '#2196F3'};
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Exportar para uso global
window.utils = utils;
