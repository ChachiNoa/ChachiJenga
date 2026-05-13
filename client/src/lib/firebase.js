import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCVIVbSp5DYPPHGYisEtyyLzr0rMMkyI8Y",
  authDomain: "chachijenga-545c7.firebaseapp.com",
  projectId: "chachijenga-545c7",
  storageBucket: "chachijenga-545c7.firebasestorage.app",
  messagingSenderId: "347909155743",
  appId: "1:347909155743:web:e1bdb9f16d5bc69f076baa",
  measurementId: "G-HSD5WK5J9N"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
