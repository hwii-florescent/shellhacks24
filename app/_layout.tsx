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
  useEffect(() => {
    loadFonts();
  }, []);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false); // To ensure the router is mounted before navigation
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        setAuthChecked(true); // Auth state checked, continue
      } else {
        setAuthChecked(true); // Auth state checked, continue
      }
    });

    return unsubscribe; // Cleanup the listener on unmount
  }, []);

  useEffect(() => {
    // Only attempt to navigate after both the router and auth are ready
    if (authChecked) {
      if (isLoggedIn) {
        router.replace("/"); // Redirect to home page
      } else {
        router.replace("./login"); // Redirect to login page
      }
    }
  }, [authChecked, isLoggedIn]);

  if (!authChecked) {
    // While the auth state is being checked, render nothing (or a loading screen)
    return null;
  }

  return <Stack></Stack>;
}
