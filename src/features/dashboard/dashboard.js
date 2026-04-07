// src/features/dashboard/dashboard.js

console.log('📊 Dashboard feature cargado');

async function cargarStats() {
    try {
        // Simular carga de datos (reemplazar con llamadas reales a storage)
        const citasHoy = await window.storage?.obtenerTodos('citas') || [];
        const clientes = await window.storage?.obtenerTodos('clientes') || [];
        
        const citasDeHoy = citasHoy.filter(cita => {
            const fechaCita = new Date(cita.fecha);
            const hoy = new Date();
            return fechaCita.toDateString() === hoy.toDateString();
        });
        
        document.getElementById('citas-hoy').textContent = citasDeHoy.length;
        document.getElementById('clientes-totales').textContent = clientes.length;
        document.getElementById('ingresos-hoy').textContent = `$${citasDeHoy.length * 350}`;
        document.getElementById('servicios-hoy').textContent = citasDeHoy.length;
        
    } catch (error) {
        console.error('Error cargando stats:', error);
    }
}

async function cargarProximasCitas() {
    const container = document.getElementById('proximas-citas');
    if (!container) return;
    
    try {
        const citas = await window.storage?.obtenerTodos('citas') || [];
        const proximas = citas.slice(0, 5);
        
        if (proximas.length === 0) {
            container.innerHTML = '<p class="text-center">No hay citas programadas</p>';
            return;
        }
        
        container.innerHTML = proximas.map(cita => `
            <div class="cita-item card-circular" style="padding: 15px; margin-bottom: 10px; background: var(--bg-tertiary);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${cita.clienteNombre || 'Cliente'}</strong>
                        <p style="margin: 5px 0 0; font-size: 0.8rem;">${cita.servicio || 'Corte'}</p>
                    </div>
                    <div style="text-align: right;">
                        <span style="color: var(--primary);">${cita.hora || '10:00'}</span>
                        <p style="margin: 5px 0 0; font-size: 0.7rem;">${cita.estado || 'Pendiente'}</p>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando citas:', error);
    }
}

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', () => {
    cargarStats();
    cargarProximasCitas();
});

export { cargarStats, cargarProximasCitas };
