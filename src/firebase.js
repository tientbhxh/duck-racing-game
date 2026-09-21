import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, remove, push } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAJonQjl4dcvMLYdvYjxIwRZAKI-kknlMQ",
  authDomain: "duck-racing-game.firebaseapp.com",
  projectId: "duck-racing-game",
  storageBucket: "duck-racing-game.firebasestorage.app",
  messagingSenderId: "160114218970",
  appId: "1:160114218970:web:c9585f3073890219ec12e3",
  measurementId: "G-TGF6YYBYRM",
  databaseURL: "https://duck-racing-game-default-rtdb.asia-southeast1.firebasedatabase.app" // Try Asia Southeast first
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);

// Helper functions for Database
export const dbRef = (path) => ref(db, path);
export { set, onValue, update, remove, push };
