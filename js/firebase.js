// js/firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyBKTKw3az-6zAaEYRTG0ctw2ey57h666AI",
  authDomain: "app-respira-d5ef4.firebaseapp.com",
  projectId: "app-respira-d5ef4",
  storageBucket: "app-respira-d5ef4.firebasestorage.app",
  messagingSenderId: "225988879984",
  appId: "1:225988879984:web:4a3e3e60a79d44519bf6b5"
};
firebase.initializeApp(firebaseConfig);
export const auth = firebase.auth();
auth.languageCode = 'pt-BR';
export const db = firebase.firestore();
export const storage = firebase.storage();