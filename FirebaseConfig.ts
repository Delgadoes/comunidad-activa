// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDv9X7WPP10X8g5niveg0Nh73kSsOyqo7M",
  authDomain: "comunidad-activa-188dd.firebaseapp.com",
  projectId: "comunidad-activa-188dd",
  storageBucket: "comunidad-activa-188dd.firebasestorage.app",
  messagingSenderId: "301430297073",
  appId: "1:301430297073:web:3760ad0ae157adfea33450",
  measurementId: "G-TY4L06PZC1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
export const storage = getStorage(app);
