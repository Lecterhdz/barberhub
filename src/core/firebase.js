// src/core/firebase.js
// Cambiar las importaciones de módulos CDN a importaciones normales
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, doc, setDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, where } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyCHI4oybtSl1TA_UuSVnBRxqgWlm2Ac_ds",
    authDomain: "barberhub-d35f5.firebaseapp.com",
    projectId: "barberhub-d35f5",
    storageBucket: "barberhub-d35f5.firebasestorage.app",
    messagingSenderId: "475649338273",
    appId: "1:475649338273:web:91d0e33c0a7b4ebb4639e0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const COLLECTIONS = {
    BARBEROS: 'barberos',
    SERVICIOS: 'servicios',
    CLIENTES: 'clientes',
    CITAS: 'citas',
    PRODUCTOS: 'productos',
    VENTAS: 'ventas'
};
export { db };
