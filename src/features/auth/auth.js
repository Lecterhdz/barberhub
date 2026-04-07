// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - AUTH FEATURE (MÓDULO INDEPENDIENTE)
// ─────────────────────────────────────────────────────────────────────

import { app } from '../../src/core/app.js';
import { router } from '../../src/core/router.js';
import { utils } from '../../src/core/utils.js';

console.log('🔐 Auth Feature cargado');

export const auth = {
    licenciasValidas: {
        'BARBERHUB-DEMO-2026': { tipo: 'DEMO', dias: 7, citasLimite: 50 },
        'BARBERHUB-BASICO-2026': { tipo: 'BÁSICO', dias: 365, citasLimite: 9999 },
        'BARBERHUB-PRO-2026': { tipo: 'PRO', dias: 365, citasLimite: 9999 },
        'BARBERHUB-SALON-2026': { tipo: 'SALÓN', dias: 365, citasLimite: 9999 }
    },

    init: function(params) {
        console.log('🔐 Auth Feature inicializado');
        this.bindEvents();
    },

    bindEvents: function() {
        const form = document.getElementById('auth-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleLogin(e));
        }
    },

    handleLogin: async function(e) {
        e.preventDefault();
        
        const claveInput = document.getElementById('license-key');
        const clave = claveInput?.value.trim().toUpperCase();
        
        if (!clave) {
            this.mostrarError('Ingresa una clave de licencia');
            return;
        }
        
        const licenciaData = this.licenciasValidas[clave];
        
        if (!licenciaData) {
            this.mostrarError('Clave inválida. Usa una de prueba.');
            return;
        }
        
        const expiracion = new Date();
        expiracion.setDate(expiracion.getDate() + licenciaData.dias);
        
        const licencia = {
            clave: clave,
            tipo: licenciaData.tipo,
            expiracion: expiracion.toISOString(),
            citasLimite: licenciaData.citasLimite
        };
        
        // Guardar licencia
        app.setLicencia(licencia);
        
        // Mostrar éxito
        this.mostrarExito('✅ Licencia ' + licencia.tipo + ' activada. Redirigiendo...');
        
        // Navegar a dashboard
        setTimeout(() => {
            router.navegar('/dashboard');
        }, 1500);
    },

    mostrarError: function(mensaje) {
        const errorEl = document.getElementById('auth-error');
        if (errorEl) {
            errorEl.textContent = mensaje;
            errorEl.style.display = 'block';
            setTimeout(() => errorEl.style.display = 'none', 5000);
        }
    },

    mostrarExito: function(mensaje) {
        const successEl = document.getElementById('auth-success');
        if (successEl) {
            successEl.textContent = mensaje;
            successEl.style.display = 'block';
        }
    }
};

// Exportar init para el router
export const init = auth.init.bind(auth);
