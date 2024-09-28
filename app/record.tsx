import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Modal, ImageBackground } from "react-native";
import { Snackbar } from "react-native-paper";
import axios from "axios";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import MapView, { Circle, Marker } from "react-native-maps";
import { PressableButton } from "./ui/common/PressableButton";
import * as Location from "expo-location";

const RecordingButton: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [recording, setRecording] = useState<Audio.Recording | undefined>(
    undefined
  );

  //For the map feature
  const [modalVisible, setModalVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );

  const handleButtonClick = async () => {
    if (!isRecording) {
      await startRecording();
    } else {
      await stopRecording();
    }
  };

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

      const formData = new FormData();
      formData.append("file", {
        uri: uri,
        type: "audio/mp4",
        name: "recording.m4a",
      } as any);

      const response = await axios.post(
        "https://e86c-131-94-186-13.ngrok-free.app/start-recording/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setSnackbarMessage(
        response.data.message || "Recording uploaded successfully"
      );
    } catch (error) {
      console.error("Error sending recording to server:", error);
      setSnackbarMessage("Error sending recording to server");
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

  type LocationCoords = {
    latitude: number;
    longitude: number;
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
          <PressableButton onPress={handleButtonClick}>
            {isRecording ? "⏹️ Stop Recording" : "⏺️ Start Recording"}
          </PressableButton>

          <PressableButton onPress={showMap}>🗺️ Show Map</PressableButton>

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
              <PressableButton onPress={closeMap}>Close Map</PressableButton>
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
