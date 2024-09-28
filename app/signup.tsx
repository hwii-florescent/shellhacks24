import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase"; // Import your Firebase configuration
import { useRouter } from "expo-router";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignUp = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Successful sign up
        router.replace("/"); // Redirect to home page after sign-up
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
      <Button title="Sign Up" onPress={handleSignUp} />
      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}

      {/* Navigate back to login */}
      <Button
        title="Back to Login"
        onPress={() => router.replace("/login")} // Redirect back to login screen
      />
    </View>
  );
}
