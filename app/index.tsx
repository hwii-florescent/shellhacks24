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

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Welcome to the Home Page!</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}
