import React, { useState } from "react";
import { View, Text, ImageBackground } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { PressableButton } from "./ui/common/PressableButton";
import { auth } from "../firebase"; // Import your Firebase configuration
import { useRouter } from "expo-router";
import { InputField } from "./ui/common/InputField";
import AntDesign from "@expo/vector-icons/AntDesign";

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
          <InputField
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <InputField
            placeholder="Password"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
          />

          <PressableButton
            onPress={handleSignUp}
            icon={<AntDesign name="checkcircleo" size={16} color="#fee2e2" />}
          >
            Sign Up
          </PressableButton>
          {error ? <Text style={{ color: "red" }}>{error}</Text> : null}

          <PressableButton
            onPress={() => router.replace("/login")}
            icon={<AntDesign name="back" size={16} color="#fee2e2" />}
          >
            Back to Login
          </PressableButton>
        </View>
      </ImageBackground>
    </View>
  );
}
