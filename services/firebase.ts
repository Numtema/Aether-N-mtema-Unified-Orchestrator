import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCyRzS5T2FObW3H3eial450jwZBVIzI1DQ",
  authDomain: "aether-architect-xyz.firebaseapp.com",
  projectId: "aether-architect-xyz",
  storageBucket: "aether-architect-xyz.firebasestorage.app",
  messagingSenderId: "474371270449",
  appId: "1:474371270449:web:3e9b5f09077ff6b10d7210"
};

// Initialize Firebase with the modular SDK style
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();