import { Text, View, Button } from "react-native";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router"; // Import the router for navigation

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
    router.push("./record")
  };

  const handleChange = () => {
    // Start the session
    router.push("./update")
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Button onPress={handleStart} title="Start Session" />
      <Button onPress={handleChange} title="Show update" />
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}
