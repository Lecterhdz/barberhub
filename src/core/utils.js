// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - UTILS (Funciones de utilidad)
// ─────────────────────────────────────────────────────────────────────

export const utils = {
    // Formatear fecha
    formatoFecha: function(fecha, formato = 'dd/mm/yyyy') {
        if (!fecha) return 'N/A';
        
        const date = new Date(fecha);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        
        const dia = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const año = date.getFullYear();
        
        switch(formato) {
            case 'dd/mm/yyyy':
                return `${dia}/${mes}/${año}`;
            case 'yyyy-mm-dd':
                return `${año}-${mes}-${dia}`;
            case 'dd MMM yyyy':
                return `${dia} ${this.getNombreMes(mes)} ${año}`;
            default:
                return `${dia}/${mes}/${año}`;
        }
    },
    
    // Formatear hora
    formatoHora: function(hora) {
        if (!hora) return 'N/A';
        if (typeof hora === 'string' && hora.includes(':')) {
            return hora;
        }
        return hora;
    },
    
    // Formatear moneda
    formatoMoneda: function(cantidad, moneda = 'USD') {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: moneda,
            minimumFractionDigits: 2
        }).format(cantidad);
    },
    
    // Formatear número
    formatoNumero: function(numero, decimales = 0) {
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: decimales,
            maximumFractionDigits: decimales
        }).format(numero);
    },
    
    // Obtener nombre del mes
    getNombreMes: function(mes) {
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const index = parseInt(mes) - 1;
        return meses[index] || mes;
    },
    
    // Obtener nombre del día
    getNombreDia: function(dia) {
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return dias[dia] || dia;
    },
    
    // Validar email
    validarEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Validar teléfono
    validarTelefono: function(telefono) {
        const re = /^[0-9+\-\s()]{8,15}$/;
        return re.test(telefono);
    },
    
    // Generar ID único
    generarId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Deep clone de objeto
    clonar: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    // Debounce para evitar ejecuciones múltiples
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle para limitar ejecuciones
    throttle: function(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Mostrar notificación
    mostrarNotificacion: function(mensaje, tipo = 'info', duracion = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${tipo}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : tipo === 'warning' ? '⚠️' : 'ℹ️'}</span>
                <p>${mensaje}</p>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, duracion);
    },
    
    // Mostrar confirmación
    confirmar: async function(mensaje) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>Confirmar</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>${mensaje}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="confirm-no">Cancelar</button>
                        <button class="btn btn-primary" id="confirm-yes">Aceptar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            const close = () => modal.remove();
            modal.querySelector('.modal-close').onclick = () => {
                resolve(false);
                close();
            };
            modal.querySelector('#confirm-no').onclick = () => {
                resolve(false);
                close();
            };
            modal.querySelector('#confirm-yes').onclick = () => {
                resolve(true);
                close();
            };
        });
    },
    
    // Descargar archivo
    descargarArchivo: function(contenido, nombreArchivo, tipo = 'application/json') {
        const blob = new Blob([contenido], { type: tipo });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    // Leer archivo
    leerArchivo: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    },
    
    // Slugify para URLs
    slugify: function(texto) {
        return texto
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-');
    },
    
    // Capitalizar texto
    capitalizar: function(texto) {
        return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
    },
    
    // Truncar texto
    truncar: function(texto, longitud = 50) {
        if (texto.length <= longitud) return texto;
        return texto.substr(0, longitud) + '...';
    },
    
    // Obtener parámetros de URL
    getUrlParams: function() {
        const params = {};
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        return params;
    },
    
    // Copiar al portapapeles
    copiarPortapapeles: async function(texto) {
        try {
            await navigator.clipboard.writeText(texto);
            this.mostrarNotificacion('Copiado al portapapeles', 'success');
            return true;
        } catch (err) {
            console.error('Error al copiar:', err);
            this.mostrarNotificacion('Error al copiar', 'error');
            return false;
        }
    },
    
    // Calcular diferencia de días
    diferenciaDias: function(fecha1, fecha2) {
        const f1 = new Date(fecha1);
        const f2 = new Date(fecha2);
        const diffTime = Math.abs(f2 - f1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
    
    // Agrupar array por propiedad
    agruparPor: function(array, propiedad) {
        return array.reduce((grupo, item) => {
            const key = item[propiedad];
            if (!grupo[key]) grupo[key] = [];
            grupo[key].push(item);
            return grupo;
        }, {});
    },
    
    // Ordenar array
    ordenarPor: function(array, propiedad, ascendente = true) {
        return [...array].sort((a, b) => {
            if (a[propiedad] < b[propiedad]) return ascendente ? -1 : 1;
            if (a[propiedad] > b[propiedad]) return ascendente ? 1 : -1;
            return 0;
        });
    },
    
    // Filtrar array por texto
    filtrarPorTexto: function(array, texto, campos) {
        if (!texto) return array;
        const termino = texto.toLowerCase();
        return array.filter(item => {
            return campos.some(campo => {
                const valor = String(item[campo]).toLowerCase();
                return valor.includes(termino);
            });
        });
    },
    
    // Exportar a CSV
    exportarCSV: function(data, nombreArchivo) {
        if (!data || !data.length) {
            this.mostrarNotificacion('No hay datos para exportar', 'warning');
            return;
        }
        
        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
        ].join('\n');
        
        this.descargarArchivo(csv, `${nombreArchivo}.csv`, 'text/csv');
        this.mostrarNotificacion('Exportado exitosamente', 'success');
    },
    
    // Generar colores aleatorios
    colorAleatorio: function() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
};

// Exportar para uso global
window.utils = utils;
