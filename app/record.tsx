import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Snackbar } from 'react-native-paper';
import axios from 'axios';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const RecordingButton: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | undefined>(undefined);

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

      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'audio/mp4',
        name: 'recording.m4a'
      } as any);

      const response = await axios.post('https://e86c-131-94-186-13.ngrok-free.app/start-recording/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSnackbarMessage(response.data.message || 'Recording uploaded successfully');
    } catch (error) {
      console.error('Error sending recording to server:', error);
      setSnackbarMessage('Error sending recording to server');
    } finally {
      setSnackbarVisible(true);
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
});

export default RecordingButton;