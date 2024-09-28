import React, { useState, useEffect } from "react";
import { View, Text, Image, ImageBackground } from "react-native";
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
import { InputField } from "./ui/common/InputField";

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
    <View className="flex-1 justify-center items-center">
      <ImageBackground
        source={require("../assets/images/bg.png")}
        resizeMode="cover"
        style={{
          flex: 1,
          width: "100%",
          justifyContent: "center",
        }}
      >
        <View className="p-6">
          <View className="items-center">
            <Image
              className="rounded-lg scale-50"
              source={require("../assets/images/logo.png")}
            />
          </View>

          <View className="-mt-10 w-full">
            <InputField
              placeholder="📨 Email"
              value={email}
              onChangeText={setEmail}
            />
            <InputField
              placeholder="🔑 Password"
              value={password}
              secureTextEntry
              onChangeText={setPassword}
            />

            <PressableButton onPress={handleLogin}>✨ Log in</PressableButton>
            {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
            <PressableButton disabled={!request} onPress={() => promptAsync()}>
              📲 Login with Google
            </PressableButton>
            <PressableButton onPress={() => router.push("./signup")}>
              👤 Sign Up
            </PressableButton>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}
