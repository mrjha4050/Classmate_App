import { firebase } from "@react-native-firebase/firestore";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; 

export const firebaseConfig = {
  apiKey: "AIzaSyCN_94lAR_CrUZYKuXin-yt7DQGvweH-w0",
  authDomain: "e-campus-35bfd.firebaseapp.com",
  projectId: "e-campus-35bfd",
  storageBucket: "e-campus-35bfd.appspot.com",
  messagingSenderId: "115118007945",
  appId: "1:115118007945:web:96bd5995a1d0c9fd988858",
  measurementId: "G-M3JCVHJRXT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db , app}


// if (!firebase.apps.length) {
//   firebase.initializeApp(firebaseConfig);
// } else {
//   firebase.app(); 
// }

// const db = firebase.firestore();

// export { db };