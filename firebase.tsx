import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

const firebaseConfig = {
  apiKey: "AIzaSyCsOIaSKXpjU1xC8bQbUlZNpQHvZsgVGjI",
  authDomain: "sarai-535ac.firebaseapp.com",
  projectId: "sarai-535ac",
  storageBucket: "sarai-535ac.appspot.com",
  messagingSenderId: "291761428913",
  appId: "1:291761428913:web:91409ebff4ba5953168590",
  measurementId: "G-41WP7VB0C9"
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage for persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { auth, GoogleAuthProvider, signInWithCredential };
