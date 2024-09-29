import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, Text, Dimensions } from 'react-native';
import { Button, Snackbar } from 'react-native-paper';
import axios from 'axios';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import MapView, {Circle, Marker} from 'react-native-maps';
import * as Location from 'expo-location';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {launchImageLibrary} from 'react-native-image-picker';
import * as ImagePicker from 'expo-image-picker';

const RecordingButton: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | undefined>(undefined);

  //For the map feature
  const [modalVisible, setModalVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  //Getting user data
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        setUserId(user.uid); // This is the user ID
      } else {
        // No user is signed in
        setUserId(null);
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

  const startRecording = async () => {
    try {
      const permissionResponse = await Audio.requestPermissionsAsync();
      if (permissionResponse.status !== 'granted') {
        console.error('Permission to access microphone denied');
        setSnackbarMessage('Microphone permission denied');
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
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setSnackbarMessage('Error starting recording');
      setSnackbarVisible(true);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        console.log('Recording stopped and stored at', uri);

        await sendRecordingToServer(uri!);
      } catch (error) {
        console.error('Failed to stop recording:', error);
        setSnackbarMessage('Error stopping recording');
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
        throw new Error('File does not exist');
      }
  
      if (!location || !location.coords) {
        throw new Error('Location data not available');
      }
  
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;
  
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'audio/mp4',
        name: 'recording.m4a',
      } as any);
  
      // Step 1: Send recording to server and get transcription
      const response = await axios.post('https://ab8f-131-94-186-11.ngrok-free.app/start-recording/', formData, {
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
  
        await axios.post('https://ab8f-131-94-186-11.ngrok-free.app/upload_data/', dataPayload, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        setSnackbarMessage('Transcription uploaded and stored successfully');
      } else {
        setSnackbarMessage('No transcription available');
      }
    } catch (error) {
      console.error('Error sending recording or storing data:', error);
      setSnackbarMessage('Error sending recording or storing data');
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
    latitude: GLfloat;
    longitude: GLfloat;
  };

  const userLocation = async () => {
    //First get permission
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status != 'granted') {
      console.error('Permission to access location denied');
      setSnackbarMessage('Location permission denied');
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
    console.log(currentLocation.coords.latitude, currentLocation.coords.longitude);
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

      console.log("Current location: ", currentLocation.coords.latitude, currentLocation.coords.longitude)

      formData.append('user_id', userId!);
      formData.append('latitude', currentLocation.coords.latitude.toString());
      formData.append('longitude', currentLocation.coords.longitude.toString());

      console.log("Form data appended");
      console.log("Form data: ", formData);

      // Make the API request to upload the image
      const response = await axios.post('https://ab8f-131-94-186-11.ngrok-free.app/upload_image/', formData, {
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
    <View style={styles.container}>
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
          <Button
          mode="contained"
          onPress={closeMap}
          >
            Close Map
        </Button>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Add transparency to the background
  },
  modalContent: {
    width: '90%',
    height: '70%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default RecordingButton;