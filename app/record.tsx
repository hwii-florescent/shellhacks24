import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

const RecordingButton: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);

  const handleButtonClick = () => {
    setIsRecording(!isRecording);
  };

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={handleButtonClick}
        style={[
          styles.button,
          { backgroundColor: isRecording ? 'red' : 'grey' } // Change color based on recording state
        ]}
      >
        {isRecording ? 'Recording...' : 'Start Recording'}
      </Button>
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
