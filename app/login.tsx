import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase"; // Your Firebase configuration file
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

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

      {/* Sign Up Button */}
      <Button
        title="Sign Up"
        onPress={() => router.push("./signup")} // Navigate to the signup screen
      />
    </View>
  );
}
