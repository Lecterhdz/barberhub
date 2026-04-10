// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - BUTTON COMPONENT
// ─────────────────────────────────────────────────────────────────────

console.log('🧩 Button Component cargado');

export const Button = {
    create: function(texto, tipo = 'primary', onClick = null, icon = '') {
        const button = document.createElement('button');
        button.className = `btn btn-${tipo}`;
        button.innerHTML = `${icon ? icon + ' ' : ''}${texto}`;
        
        if (onClick) {
            button.addEventListener('click', onClick);
        }
        
        return button;
    }
};

window.Button = Button;
