import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useRouter } from "expo-router";
import * as Font from "expo-font";
import "../global.css";

async function loadFonts() {
  await Font.loadAsync({
    Inter: require("../assets/fonts/Inter-Variable.ttf"),
  });
}

export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false); // State for font loading
  const router = useRouter();

  useEffect(() => {
    async function loadResources() {
      await loadFonts();
      setFontsLoaded(true); // Update font loading state
    }

    loadResources();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
      }
      setAuthChecked(true); // Auth state checked, continue
    });

    return unsubscribe; // Cleanup the listener on unmount
  }, []);

  useEffect(() => {
    if (authChecked && fontsLoaded) {
      // Only navigate if both are ready
      if (isLoggedIn) {
        router.replace("/"); // Redirect to home page
      } else {
        router.replace("./login"); // Redirect to login page
      }
    }
  }, [authChecked, fontsLoaded, isLoggedIn]);

  if (!authChecked || !fontsLoaded) {
    // While loading either fonts or auth state, render nothing (or a loading screen)
    return null;
  }

  return (
  <Stack screenOptions={{ headerShown: false }} />
  );
}
