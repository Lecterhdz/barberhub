// src/core/firebase.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    getDocs, 
    deleteDoc, 
    onSnapshot,
    query,
    where
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

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

console.log('🔥 Firebase inicializado');

export const COLLECTIONS = {
    BARBEROS: 'barberos',
    SERVICIOS: 'servicios',
    CLIENTES: 'clientes',
    CITAS: 'citas',
    PRODUCTOS: 'productos',
    VENTAS: 'ventas'
};

// Guardar en Firestore
export async function guardarFirestore(coleccion, id, datos) {
    try {
        const docRef = doc(db, coleccion, id.toString());
        await setDoc(docRef, { ...datos, actualizado: new Date().toISOString() }, { merge: true });
        console.log(`✅ Guardado en Firestore: ${coleccion}/${id}`);
        return true;
    } catch (error) {
        console.error('Error guardando en Firestore:', error);
        return false;
    }
}

// Obtener todos los documentos
export async function obtenerTodosFirestore(coleccion) {
    try {
        const querySnapshot = await getDocs(collection(db, coleccion));
        const datos = [];
        querySnapshot.forEach((doc) => {
            datos.push({ id: parseInt(doc.id), ...doc.data() });
        });
        return datos;
    } catch (error) {
        console.error('Error obteniendo de Firestore:', error);
        return [];
    }
}

// Eliminar documento
export async function eliminarFirestore(coleccion, id) {
    try {
        await deleteDoc(doc(db, coleccion, id.toString()));
        console.log(`✅ Eliminado de Firestore: ${coleccion}/${id}`);
        return true;
    } catch (error) {
        console.error('Error eliminando de Firestore:', error);
        return false;
    }
}

// Escuchar cambios en tiempo real
export function escucharCambios(coleccion, callback) {
    const q = query(collection(db, coleccion));
    return onSnapshot(q, (snapshot) => {
        const datos = [];
        snapshot.forEach((doc) => {
            datos.push({ id: parseInt(doc.id), ...doc.data() });
        });
        console.log(`🔄 Cambios detectados en ${coleccion}: ${datos.length} registros`);
        callback(datos);
    });
}

export { db };
