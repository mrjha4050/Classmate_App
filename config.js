import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAQt3wC9b3D11kTpYxAQ5tLTSxjRbuTyxE",
  authDomain: "campusconnect-a9fd9.firebaseapp.com",
  databaseURL: "https://campusconnect-a9fd9-default-rtdb.firebaseio.com",
  projectId: "campusconnect-a9fd9",
  storageBucket: "campusconnect-a9fd9.appspot.com",
  messagingSenderId: "856272800171",
  appId: "1:856272800171:web:d18054d53ef7ecb778eaee",
  measurementId: "G-G9MDK6QHKZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { db, auth };

// if (!firebase.apps.length) {
//   firebase.initializeApp(firebaseConfig);
// } else {
//   firebase.app(); 
// }

// const db = firebase.firestore();

// export { db };