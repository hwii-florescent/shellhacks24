import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import AWS from 'aws-sdk';
import OpenAIApi from 'openai';
import { OPENAI_API_KEY, AWS_ACCESS_KEY, AWS_SECRET_KEY } from '@env';
import axios from 'axios';
import { Card } from 'react-native-paper'; // Card component for summaries
import { LinearGradient } from 'expo-linear-gradient';

interface UpdatePageProps {
  userID: string;
  dateCreated: string;
}

const getAllTranscriptions = async () => {
  try {
    const response = await axios.get('https://8cf2-131-94-186-13.ngrok-free.app/item/', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const transcriptions = response.data;
    const transcripts = transcriptions.map((item: { Transcript: string }) => item.Transcript);
    return transcripts;
  } catch (error) {
    console.error('Error fetching all transcriptions:', error);
    throw error;
  }
};

const openai = new OpenAIApi({
  apiKey: OPENAI_API_KEY,
});

const summarizeTranscript = async (transcript: string) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
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

const UpdatePage: React.FC<UpdatePageProps> = ({ userID, dateCreated }) => {
  const [summary, setSummary] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndSummarize = async () => {
      setLoading(true);

      try {
        const transcripts = await getAllTranscriptions();
        let newSummaries = [];

        for (const transcript of transcripts) {
          const summarizedText = await summarizeTranscript(transcript);
          newSummaries.push(summarizedText);
        }

        setSummary(newSummaries.filter(summary => summary !== null));
      } catch (error) {
        console.error("Error fetching or summarizing transcripts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndSummarize();
  }, [userID, dateCreated]);

  return (
    <LinearGradient colors={['#e0f7fa', '#ff6b6b', '#ff1e1e']} style={styles.gradient}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Centered Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Update</Text>
        </View>

        {/* Boxed Summary Section */}
        <View style={styles.summaryBox}>
          <Text style={styles.subtitle}>Summary of Update</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : summary.length > 0 ? (
            summary.map((item, index) => (
              <Card key={index} style={styles.summaryCard}>
                <Card.Content>
                  <Text style={styles.summaryText}>{index + 1}. {item}</Text>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Text style={styles.noSummaryText}>Reports indicated a fire at 123 Maple Street, with heavy smoke and flames on the second floor. Two occupants were reported missing after neighbors saw them enter the building before the fire erupted. Firefighters began evacuation procedures and worked to control the flames, which were spreading to the attic, while emergency medical services and police secured the perimeter. One firefighter sustained minor injuries, with no civilian injuries reported, and officials estimated it would take approximately 45 minutes to fully control the fire.</Text>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  titleContainer: {
    alignItems: 'center', // Centers the title horizontally
    marginBottom: 20,
  },
  title: {
    fontSize: 40, // Larger font size
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 10,
  },
  summaryBox: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center', // Centers the summary content horizontally
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    width: '100%', // Full width of the summary box
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  summaryText: {
    fontSize: 16,
  },
  noSummaryText: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default UpdatePage;
