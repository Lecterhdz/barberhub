// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - DASHBOARD FEATURE
// ─────────────────────────────────────────────────────────────────────

import { app } from '../../core/app.js';
import { storage } from '../../core/storage.js';
import { utils } from '../../core/utils.js';

console.log('📊 Dashboard Feature cargado');

export const dashboard = {
    init: async function(params) {
        console.log('📊 Dashboard Feature inicializado');
        await this.cargarEstadisticas();
        await this.cargarCitasHoy();
    },

    cargarEstadisticas: async function() {
        const hoy = utils.fechaActual();
        
        // Obtener citas de hoy
        const citas = await storage.obtenerTodos('citas');
        const citasHoy = citas.filter(c => c.fecha === hoy);
        
        // Calcular ingresos
        const ingresos = citasHoy
            .filter(c => c.estado === 'completada')
            .reduce((sum, c) => sum + (c.precio || 0), 0);
        
        // Clientes únicos
        const clientesUnicos = new Set(citasHoy.map(c => c.clienteId)).size;
        
        // Actualizar UI
        document.getElementById('stat-citas-hoy').textContent = citasHoy.length;
        document.getElementById('stat-clientes-hoy').textContent = clientesUnicos;
        document.getElementById('stat-ingresos-hoy').textContent = utils.formatoMoneda(ingresos);
        document.getElementById('stat-barberos-hoy').textContent = '0'; // Implementar después
    },

    cargarCitasHoy: async function() {
        const hoy = utils.fechaActual();
        const citas = await storage.obtenerTodos('citas');
        const citasHoy = citas.filter(c => c.fecha === hoy);
        
        const container = document.getElementById('citas-hoy-lista');
        
        if (!container) return;
        
        if (citasHoy.length === 0) {
            container.innerHTML = `
                <p style="text-align:center;color:var(--color-secondary);padding:20px;">
                    📅 No hay citas para hoy
                </p>
            `;
            return;
        }
        
        const clientes = await storage.obtenerTodos('clientes');
        const barberos = await storage.obtenerTodos('barberos');
        
        container.innerHTML = citasHoy.map(c => {
            const cliente = clientes.find(cl => cl.id == c.clienteId);
            const barbero = barberos.find(b => b.id == c.barberoId);
            
            return `
                <div class="cita-item">
                    <div class="cita-info">
                        <strong>${c.hora || 'N/A'} - ${cliente ? cliente.nombre : 'Cliente'}</strong>
                        <small style="color:var(--color-secondary);">
                            ${barbero ? barbero.nombre : 'Sin barbero'}
                        </small>
                    </div>
                    <span class="estado-cita estado-${c.estado || 'pendiente'}">
                        ${c.estado || 'pendiente'}
                    </span>
                </div>
            `;
        }).join('');
    }
};

// Exportar init para el router
export const init = dashboard.init.bind(dashboard);
