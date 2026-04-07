// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - MODAL COMPONENT
// ─────────────────────────────────────────────────────────────────────

console.log('🧩 Modal Component cargado');

export const Modal = {
    abrir: function(contenido, titulo = '') {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position:fixed;top:0;left:0;width:100%;height:100%;
            background:rgba(0,0,0,0.5);z-index:9999;
            display:flex;align-items:center;justify-content:center;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background:white;padding:30px;border-radius:20px;
                max-width:500px;width:90%;max-height:90vh;overflow-y:auto;
            ">
                ${titulo ? `<h3 style="margin:0 0 20px 0;">${titulo}</h3>` : ''}
                ${contenido}
                <button onclick="this.closest('.modal-overlay').remove()" 
                        style="margin-top:20px;padding:10px 20px;background:#1a1a1a;color:white;border:none;border-radius:10px;cursor:pointer;">
                    ❌ Cerrar
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
};

window.Modal = Modal;
