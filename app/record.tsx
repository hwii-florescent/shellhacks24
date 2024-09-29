import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Modal,
  ImageBackground,
  Animated,
  Dimensions,
} from "react-native";
import { Button, Snackbar } from "react-native-paper";
import axios from "axios";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import MapView, { Circle, Marker } from "react-native-maps";
import { PressableButton } from "./ui/common/PressableButton";
import * as Location from "expo-location";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {launchImageLibrary} from 'react-native-image-picker';
import * as ImagePicker from 'expo-image-picker';
import { LocationObjectCoords } from 'expo-location';

interface ITextHolder {
  children: JSX.Element;
}

const TextHolder = ({ children }: ITextHolder) => {
  const opacity = useRef(new Animated.Value(1)).current;

  const startBlinking = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    startBlinking();
  }, []);

  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
};

const RecordingButton: React.FC = () => {
  const router = useRouter();

  const [isRecording, setIsRecording] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | undefined>(
    undefined
  );
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const colorPalette = [
    'rgba(255, 0, 0, 1)', // Red
    'rgba(0, 255, 0, 1)', // Green
    'rgba(0, 0, 255, 1)', // Blue
    'rgba(255, 255, 0, 1)', // Yellow
    'rgba(255, 165, 0, 1)', // Orange
    'rgba(128, 0, 128, 1)', // Purple
  ];

  const [circleRadius, setCircleRadius] = useState(50); // Default radius

  // Handle region changes to adjust circle size
  const onRegionChangeComplete = (region: any) => {
    setMapRegion(region);
    
    // Calculate a new circle radius based on zoom level
    // This is a simple example; you may want to adjust the formula based on your needs
    const zoomLevel = Math.log2(10 / region.longitudeDelta);
    const newRadius = Math.max(10, 1 / (zoomLevel)); // Adjust radius calculation as needed
    setCircleRadius(newRadius);
  };

  //For the map feature
  const [modalVisible, setModalVisible] = useState(false);
  const [userLocations, setUserLocations] = useState<{ [userId: string]: LocationObjectCoords }>({});
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );

  //Getting user data
  const [userId, setUserId] = useState<string | null>(null);

  const fetchUserLocations = async () => {
    try {
      const response = await axios.post('https://8cf2-131-94-186-13.ngrok-free.app/get_gps_data/');
      setUserLocations(prev => ({
        ...prev,
        ...response.data,
    }));
    } catch (error) {
      console.error('Error fetching user locations:', error);
    }
  };
  
  const updateUserLocationInDB = async (userId:any, location:any) => {
    if (!location || !location.latitude || !location.longitude) {
      console.error('Invalid location data');
      return;
    }
    try {
      // Send a request to update or insert the user's location in DynamoDB
      await axios.post('https://8cf2-131-94-186-13.ngrok-free.app/update_user_location/', {
        user_id: userId,
        latitude: location.latitude,
        longitude: location.longitude
      });
    } catch (error) {
      console.error('Error updating user location in DB:', error);
    }
  };
  
  useEffect(() => {
    fetchUserLocations(); // Fetch all user locations when the component mounts
  }, []);
  
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }
  
      // Get the current location
      let currLocation = await Location.getCurrentPositionAsync({});
      setLocation(currLocation);

      if(!userId || !currLocation.coords.latitude || !currLocation.coords.longitude) {
        return;
      }
  
      // Set the map region based on the current location
      const initialRegion = {
        latitude: currLocation.coords.latitude,
        longitude: currLocation.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setMapRegion(initialRegion);
  
      // Update userLocations to include the current user's location
      setUserLocations((prev) => ({
        ...prev,
        [userId]: currLocation.coords, // Add or update the current user's location
      }));
  
      // Update user's location in DynamoDB
      await updateUserLocationInDB(userId, currLocation.coords);
  
      // Start watching the location
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 200,
          distanceInterval: 2,
        },
        async (newLocation) => {
          if(!userId || !newLocation.coords.latitude || !newLocation.coords.longitude) {
            return;
          }
          setLocation(newLocation);
  
          // Update userLocations state with new coordinates
          setUserLocations((prev) => ({
            ...prev,
            [userId]: newLocation.coords, // Update the current user's location
          }));
  
          // Update the location in DynamoDB
          await updateUserLocationInDB(userId, newLocation.coords);
        }
      );
    })();
  }, [userId]);  // Add userId to the dependency array
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid); // Set user ID when signed in
      } else {
        setUserId(null); // Clear user ID when signed out
      }
    });
  
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);
  
  const handleButtonClick = async () => {
    if (!isRecording) {
      await startRecording();
    } else {
      await stopRecording();
    }
  };

  // outside the startRecording function because of React Rule of Hooks
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRecording) {
      intervalId = setInterval(() => {
        setSecondsElapsed((prevElapsed) => prevElapsed + 1);
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const permissionResponse = await Audio.requestPermissionsAsync();
      if (permissionResponse.status !== "granted") {
        console.error("Permission to access microphone denied");
        setSnackbarMessage("Microphone permission denied");
        setSnackbarVisible(true);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);

      console.log("Recording started");
    } catch (error) {
      console.error("Failed to start recording:", error);
      setSnackbarMessage("Error starting recording");
      setSnackbarVisible(true);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setSecondsElapsed(0);
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log("Recording stopped and stored at", uri);
        await sendRecordingToServer(uri!);
      } catch (error) {
        console.error("Failed to stop recording:", error);
        setSnackbarMessage("Error stopping recording");
        setSnackbarVisible(true);
      } finally {
        setRecording(undefined);
      }
    }
  };

  const sendRecordingToServer = async (uri: string) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);

      if (!fileInfo.exists) {
        throw new Error("File does not exist");
      }

      if (!location || !location.coords) {
        throw new Error("Location data not available");
      }

      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;

      const formData = new FormData();
      formData.append("file", {
        uri: uri,

        type: "audio/mp4",
        name: "recording.m4a",
      } as any);

      // Step 1: Send recording to server and get transcription
      const response = await axios.post('https://8cf2-131-94-186-13.ngrok-free.app/start-recording/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const transcription = response.data.transcription;

      // Step 2: If transcription exists, send data to backend for storage in DynamoDB
      if (transcription) {
        const dataPayload = {
          user_id: userId, // or dynamically fetch the user ID
          latitude: latitude,
          longitude: longitude,
          transcript: transcription,
        };
  
        await axios.post('http://8cf2-131-94-186-13.ngrok-free.app/upload_data/', dataPayload, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        setSnackbarMessage('Transcription uploaded and stored successfully');

      } else {
        setSnackbarMessage("No transcription available");
      }
    } catch (error) {
      console.error("Error sending recording or storing data:", error);
      setSnackbarMessage("Error sending recording or storing data");
    } finally {
      setSnackbarVisible(true);
    }
  };

  const showMap = () => {
    setModalVisible(true); // Open the modal
  };

  const closeMap = () => {
    setModalVisible(false); // Close the modal
  };

  const goBack = () => {
    router.replace("/");
  };

  type LocationCoords = {
    latitude: GLfloat;
    longitude: GLfloat;
  };

  const userLocation = async () => {
    //First get permission
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status != "granted") {
      console.error("Permission to access location denied");
      setSnackbarMessage("Location permission denied");
      setSnackbarVisible(true);
      return;
    }

    let currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High, // Use Location.Accuracy.High for high accuracy
    });

    setLocation(currentLocation);
    setMapRegion({
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
    console.log(
      currentLocation.coords.latitude,
      currentLocation.coords.longitude
    );
  };

  useEffect(() => {
    userLocation();
  }, []);

  const uploadImage = async () => {
    console.log("Uploading image");

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (result.canceled) {
      console.log('User cancelled image picker');
      return;
    }

    const uri = result.assets[0].uri;
    console.log('Selected image:', uri);


    try {
      console.log("In try block");
      // Create a FormData object to send the image data
      const formData = new FormData();
      formData.append('file', {
        uri: uri.replace(/^file:\/{4}/, 'file:///'),
        type: 'image/jpeg',
        name: 'uploaded_image.jpeg',
      });
      console.log("Form data created");

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High, // Use Location.Accuracy.High for high accuracy
      }); 

      formData.append('user_id', userId!);
      formData.append('latitude', currentLocation.coords.latitude.toString());
      formData.append('longitude', currentLocation.coords.longitude.toString());

      // Make the API request to upload the image
      const response = await axios.post('https://8cf2-131-94-186-13.ngrok-free.app/upload_image/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
  
      console.log('Upload successful:', response.data);
      // Handle the response as needed (e.g., display a success message)
    } catch (error) {
      console.error('Error uploading image:', error);
      // Handle the error as needed (e.g., display an error message)
    }
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
    <View className="w-full flex items-center justify-center">
      <Image
        className="rounded-lg scale-50"
        source={require("../assets/images/logo.png")}
      />
      <Button
        mode="contained"
        onPress={handleButtonClick}
        style={[styles.button, { backgroundColor: isRecording ? 'red' : 'grey' }]}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </Button>

      <Button
        mode="contained"
        onPress={showMap}
        style={styles.button}
        >
          Show Map
      </Button>

      <Button
        mode="contained"
        onPress={uploadImage}
        style={styles.button}
        >
          Upload Image
      </Button>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeMap} // Close the modal when back button is pressed
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
          <MapView
              style={styles.map}
              region={mapRegion}
              onRegionChangeComplete={onRegionChangeComplete}
          >
              {Object.entries(userLocations).map(([id, loc], index) => {
                  console.log(userLocations)
                  // Check if latitude and longitude are valid
                  if (!loc.latitude || !loc.longitude || !id) {
                      console.log('Invalid location data:', loc);
                      return null; // Skip invalid entries
                  }
                  console.log(id)

                  return ( // Use return here to properly return the Circle component
                      <Circle
                          key={id} // Use user ID as the key
                          center={{
                              latitude: loc.latitude,
                              longitude: loc.longitude,
                          }}
                          radius={circleRadius} // Ensure circleRadius is defined and valid
                          strokeColor="rgba(0, 0, 0, 1)" // Define stroke color
                          fillColor={colorPalette[index % colorPalette.length]} // Fill color from palette
                      />
                  );
              })}
          </MapView>
          </View>

          <PressableButton onPress={handleButtonClick}>
            {isRecording ? (
              <TextHolder>
                <Text className="text-red-100 text-lg">
                  Stop Recording ({secondsElapsed}s)
                </Text>
              </TextHolder>
            ) : (
              "Start Recording"
            )}
          </PressableButton>

          <PressableButton variant="secondary" onPress={showMap}>
            Show Map
          </PressableButton>

          <PressableButton variant="tertiary" onPress={goBack}>
            {"<- Go Back"}
          </PressableButton>

          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={closeMap} // Close the modal when back button is pressed
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <MapView style={styles.map} region={mapRegion}>
                  {location && location.coords && (
                    <>
                      {/* Circle to mimic Google Maps' blue circle */}
                      <Circle
                        center={{
                          latitude: location.coords.latitude,
                          longitude: location.coords.longitude,
                        }}
                        radius={50} // Adjust the radius as per your requirement
                        strokeColor="rgba(0, 0, 0, 1)" // Light blue border
                        fillColor="rgba(0, 122, 255, 1)" // Lighter blue fill with some transparency
                      />
                    </>
                  )}
                </MapView>
              </View>
              <View className="px-6 w-full">
                <PressableButton onPress={closeMap}>Close Map</PressableButton>
              </View>
            </View>
          </Modal>

          <Snackbar
            visible={snackbarVisible}
            onDismiss={() => setSnackbarVisible(false)}
            duration={3000}
          >
            {snackbarMessage}
          </Snackbar>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Add transparency to the background
  },
  modalContent: {
    width: "90%",
    height: "70%",
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
});

export default RecordingButton;
