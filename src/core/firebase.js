// src/core/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';

// ✅ REEMPLAZA CON TUS DATOS DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCHI4oybtSl1TA_UuSVnBRxqgWlm2Ac_ds",
  authDomain: "barberhub-d35f5.firebaseapp.com",
  projectId: "barberhub-d35f5",
  storageBucket: "barberhub-d35f5.firebasestorage.app",
  messagingSenderId: "475649338273",
  appId: "1:475649338273:web:91d0e33c0a7b4ebb4639e0"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔥 Firebase inicializado');

// Colecciones
const COLLECTIONS = {
    BARBEROS: 'barberos',
    SERVICIOS: 'servicios',
    CLIENTES: 'clientes',
    CITAS: 'citas',
    PRODUCTOS: 'productos',
    VENTAS: 'ventas'
};

// ============================================
// FUNCIONES CRUD PARA FIRESTORE
// ============================================

// Guardar documento
async function guardarFirestore(coleccion, id, datos) {
    try {
        const docRef = doc(db, coleccion, id.toString());
        await setDoc(docRef, { ...datos, actualizado: new Date().toISOString() }, { merge: true });
        console.log(`✅ Guardado en ${coleccion}:`, id);
        return true;
    } catch (error) {
        console.error('Error guardando:', error);
        return false;
    }
}

// Obtener todos los documentos
async function obtenerTodosFirestore(coleccion) {
    try {
        const querySnapshot = await getDocs(collection(db, coleccion));
        const datos = [];
        querySnapshot.forEach((doc) => {
            datos.push({ id: parseInt(doc.id), ...doc.data() });
        });
        return datos;
    } catch (error) {
        console.error('Error obteniendo:', error);
        return [];
    }
}

// Eliminar documento
async function eliminarFirestore(coleccion, id) {
    try {
        await deleteDoc(doc(db, coleccion, id.toString()));
        console.log(`✅ Eliminado de ${coleccion}:`, id);
        return true;
    } catch (error) {
        console.error('Error eliminando:', error);
        return false;
    }
}

// Escuchar cambios en tiempo real
function escucharCambios(coleccion, callback) {
    const q = query(collection(db, coleccion));
    return onSnapshot(q, (snapshot) => {
        const datos = [];
        snapshot.forEach((doc) => {
            datos.push({ id: parseInt(doc.id), ...doc.data() });
        });
        callback(datos);
    });
}

export { 
    db, 
    COLLECTIONS,
    guardarFirestore, 
    obtenerTodosFirestore, 
    eliminarFirestore, 
    escucharCambios 
};