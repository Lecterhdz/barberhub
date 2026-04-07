// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - CARD COMPONENT
// ─────────────────────────────────────────────────────────────────────

console.log('🧩 Card Component cargado');

export const Card = {
    create: function(titulo, contenido) {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h2>${titulo || ''}</h2>
            <div class="card-content">${contenido || ''}</div>
        `;
        
        return card;
    }
};

window.Card = Card;
