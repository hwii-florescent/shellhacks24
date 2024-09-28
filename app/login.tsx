import React, { useState, useEffect } from "react";
import { View, Text, TextInput } from "react-native";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { auth } from "../firebase";
import { useRouter } from "expo-router";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { PressableButton } from "./ui/common/PressableButton";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId:
      "63917152065-40mh89h3g60ro601fqsa4ajndkgsifje.apps.googleusercontent.com",
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
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
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

      <PressableButton onPress={handleLogin}>
        <Text>Log in</Text>
      </PressableButton>

      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}

      <PressableButton disabled={!request} onPress={() => promptAsync()}>
        <Text>Login with Google</Text>
      </PressableButton>

      <PressableButton onPress={() => router.push("./signup")}>
        <Text>Sign Up</Text>
      </PressableButton>
    </View>
  );
}
