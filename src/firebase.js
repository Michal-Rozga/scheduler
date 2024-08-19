import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAe4YeKNDi_IJbn-2pmeRk5_4rWYLSS05I",
    authDomain: "scheduler-8f1ce.firebaseapp.com",
    projectId: "scheduler-8f1ce",
    storageBucket: "scheduler-8f1ce.appspot.com",
    messagingSenderId: "543331455561",  
    appId: "1:543331455561:web:525b7dc8c2a4b443eae598",  
    measurementId: "G-2MXBSZ3XYP"  
  };
  
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };