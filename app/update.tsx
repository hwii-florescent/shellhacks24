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
    const response = await axios.get('https://8cf2-131-94-186-13.ngrok-free.app/item/', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  

    // Step 2: Extract all transcription data from response
    const transcriptions = response.data;
    const transcripts = transcriptions.map((item: { Transcript: string }) => item.Transcript);
    
    // Step 3: Log or return the transcription data
    console.log("All transcripts", transcripts);
    return transcripts;
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
        { role: 'system', content: 'You are a neutral summarizer. Please summarize the events happening in the given transcript. Do not include hypothetical situations. Consolidate all of the information within 4 sentences, include only factual details. Do not include any analysis, planning or preperation steps. Do not include who was responsible for any given action. Respond in only past tense.' },
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
  const [summary, setSummary] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndSummarize = async () => {
      setLoading(true);  // Start loading state
  
      try {
        const transcripts = await getAllTranscriptions();  // Fetch all transcripts
        let newSummaries = [];
  
        // Use for...of to handle async/await correctly
        for (const transcript of transcripts) {
          const summarizedText = await summarizeTranscript(transcript);  // Await each summarization
          newSummaries.push(summarizedText);  // Collect summaries
        }
  
        setSummary(newSummaries.filter(summary => summary !== null));  // Update summary state with the new summaries
        console.log(summary);

      } catch (error) {
        console.error("Error fetching or summarizing transcripts:", error);
      } finally {
        setLoading(false);  // Stop loading state
      }
    };
  
    fetchAndSummarize();
  }, [userID, dateCreated]);

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Update</Text>
      <Text style={{ fontSize: 18, marginTop: 10 }}>Summary of update</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : summary.length > 0 ? (
        summary.map((item, index) => (
          <Text key={index} style={{ fontSize: 16, marginTop: 20 }}>
            {index + 1}. {item}
          </Text>
        ))
      ) : (
        <Text style={{ fontSize: 16, marginTop: 20 }}>
          No Summaries Available
        </Text>
      )}
    </ScrollView>
  );
};

export default UpdatePage;
