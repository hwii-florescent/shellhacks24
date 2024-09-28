import { initializeApp } from "firebase/app";
import { initializeAuth, GoogleAuthProvider, signInWithCredential, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

const firebaseConfig = {
  apiKey: "AIzaSyDRui5GRnokN2JjtyFEjyoK4ppfbpxlC10",
  authDomain: "sarai-21286.firebaseapp.com",
  projectId: "sarai-21286",
  storageBucket: "sarai-21286.appspot.com",
  messagingSenderId: "63917152065",
  appId: "1:63917152065:web:fde92e506fb741bce9f3c0",
  measurementId: "G-XGMT2SZEHB"
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage for persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { auth, GoogleAuthProvider, signInWithCredential };
