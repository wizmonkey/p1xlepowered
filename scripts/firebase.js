// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js';


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA69wyRKVW_II6gJGGjWgjEevzfEjXKNXM",
  authDomain: "p1xlepowered.firebaseapp.com",
  projectId: "p1xlepowered",
  storageBucket: "p1xlepowered.appspot.com",
  messagingSenderId: "875482013291",
  appId: "1:875482013291:web:5e5c1fe849488083a21b2e"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export {
  auth,
  db,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc,
  setDoc,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  getFirestore,
  storage,
  ref,
  getDownloadURL,
  deleteObject,
  uploadBytes
};
