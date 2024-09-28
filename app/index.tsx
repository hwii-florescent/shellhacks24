import { View, ImageBackground, Text, Image } from "react-native";
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
          justifyContent: "center",
        }}
      >
        <View className="p-6">
          <View className="w-full flex items-center justify-center">
            <Image
              className="rounded-lg scale-50"
              source={require("../assets/images/logo.png")}
            />
          </View>

          <View>
            <PressableButton onPress={handleStart}>
              Start Session
            </PressableButton>
            <PressableButton variant="tertiary" onPress={handleLogout}>
              Logout
            </PressableButton>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}
