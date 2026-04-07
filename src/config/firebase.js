// ─────────────────────────────────────────────────────────────────────
// BARBERHUB - FIREBASE CONFIG (OPCIONAL - PARA SYNC EN NUBE)
// ─────────────────────────────────────────────────────────────────────

// ⚠️ REEMPLAZA CON TU CONFIG DE FIREBASE CONSOLE
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "barberhub.firebaseapp.com",
    projectId: "barberhub",
    storageBucket: "barberhub.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Exportar para uso futuro (cuando agregues sync con nube)
export { firebaseConfig };

console.log('🔥 Firebase config cargado (opcional)');
