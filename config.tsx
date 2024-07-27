import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; 

export const firebaseConfig = {
  apiKey: "AIzaSyAQt3wC9b3D11kTpYxAQ5tLTSxjRbuTyxE",
  authDomain: "campusconnect-a9fd9.firebaseapp.com",
  projectId: "campusconnect-a9fd9",
  storageBucket: "campusconnect-a9fd9.appspot.com",
  messagingSenderId: "856272800171",
  appId: "1:856272800171:web:d18054d53ef7ecb778eaee",
  measurementId: "G-G9MDK6QHKZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

// if (!firebase.apps.length) {
//   firebase.initializeApp(firebaseConfig);
// } else {
//   firebase.app(); 
// }

// const db = firebase.firestore();

// export { db };