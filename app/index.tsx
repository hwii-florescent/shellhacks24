import { View, ImageBackground } from "react-native";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router";
import { PressableButton } from "./ui/common/PressableButton";

export default function HomeScreen() {
  const router = useRouter();

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        // Redirect to the login page after a successful logout
        router.replace("/login");
      })
      .catch((error) => {
        // Handle error, if any
        console.error("Error logging out: ", error);
      });
  };

  const handleStart = () => {
    // Start the session
    router.push("./record");
  };

  return (
    <View className="flex-1 justify-center items-center">
      <ImageBackground
        source={require("../assets/images/bg.png")}
        resizeMode="cover"
        style={{
          flex: 1,
          width: "100%",
          justifyContent: "center", // Center content if needed
        }}
      >
        <View className="p-6">
          <PressableButton onPress={handleStart}>
            ✨ Start Session
          </PressableButton>
          <PressableButton onPress={handleLogout}>👋 Logout</PressableButton>
        </View>
      </ImageBackground>
    </View>
  );
}
