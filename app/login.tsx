import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../firebase";
import { useRouter } from "expo-router";
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '291761428913-gi2ctqds3djl3l127l6i1haahsmabtm7.apps.googleusercontent.com'
  });
  

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;

      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => {
          router.replace("/"); // Redirect to home page
        })
        .catch((error) => {
          setError(error.message);
        });
    }
  }, [response]);

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        router.replace("/"); // Redirect to home page
      })
      .catch((error) => {
        setError(error.message);
      });
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <TextInput
        placeholder="Email"
        style={{ borderWidth: 1, width: "100%", padding: 10, marginBottom: 10 }}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        style={{ borderWidth: 1, width: "100%", padding: 10, marginBottom: 10 }}
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />
      <Button title="Login" onPress={handleLogin} />
      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}

      {/* Google Sign-In Button */}
      <Button
        title="Login with Google"
        disabled={!request}
        onPress={() => promptAsync()}
      />

      <Button
        title="Sign Up"
        onPress={() => router.push("./signup")} // Navigate to the signup screen
      />
    </View>
  );
}
