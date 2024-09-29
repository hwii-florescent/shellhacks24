import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import AWS from 'aws-sdk';
import OpenAIApi from 'openai';
import { OPENAI_API_KEY, AWS_ACCESS_KEY, AWS_SECRET_KEY } from '@env';
import axios from 'axios';


interface UpdatePageProps {
  userID: string;
  dateCreated: string;
}

const getAllTranscriptions = async () => {
  try {
    // Step 1: Make a GET request to retrieve all transcription data
    const response = await axios.get('https://ab8f-131-94-186-11.ngrok-free.app/start-recording', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Step 2: Extract all transcription data from response
    const transcriptions = response.data;

    // Step 3: Log or return the transcription data
    console.log('All Transcriptions:', transcriptions);
    return transcriptions;
  } catch (error) {
    console.error('Error fetching all transcriptions:', error);
    throw error; // Rethrow error for further handling
  }
};

// OpenAI API configuration
// const openai = new OpenAIApi(new Configuration({
//   apiKey: 'your-openai-api-key',
// }));
const openai = new OpenAIApi({
    apiKey: OPENAI_API_KEY,
    // baseURL: 'https://api.openai.com/v1' // You can explicitly set this if needed
  });

// Summarize the transcript using OpenAI
const summarizeTranscript = async (transcript: string) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a summarizer. Please summarize the given transcript precisely.' },
        { role: 'user', content: transcript },
      ],
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error with OpenAI API: ", error);
    return '';
  }
};

// The main component for the page
const UpdatePage: React.FC<UpdatePageProps> = ({ userID, dateCreated }) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndSummarize = async () => {
      setLoading(true);
      const transcript = await getAllTranscriptions();
      if (transcript) {
        const summarizedText = await summarizeTranscript(transcript);
        setSummary(summarizedText || '');
      }
      setLoading(false);
    };

    fetchAndSummarize();
  }, [userID, dateCreated]);

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Update</Text>
      <Text style={{ fontSize: 18, marginTop: 10 }}>Summary of update</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Text style={{ fontSize: 16, marginTop: 20 }}>{summary}</Text>
      )}
    </ScrollView>
  );
};

export default UpdatePage;
