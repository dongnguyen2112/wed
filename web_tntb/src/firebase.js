// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Thêm Firebase Auth
import { getStorage } from "firebase/storage";



const firebaseConfig = {
    apiKey: "AIzaSyCX41Y5jmkOCO51npG1qnDzURJs1khMiG4",
    authDomain: "bctn-83723.firebaseapp.com",
    projectId: "bctn-83723",
    storageBucket: "bctn-83723.appspot.com",
    messagingSenderId: "1073563323459",
    appId: "1:1073563323459:web:7a0fa0191864e0123318f6",
    measurementId: "G-MY6J4NC3HE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Auth
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
