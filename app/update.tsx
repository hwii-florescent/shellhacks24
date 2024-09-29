import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import OpenAIApi from 'openai';
import { OPENAI_API_KEY } from '@env';
import { useRouter } from 'expo-router';
import { PressableButton } from './ui/common/PressableButton';


const openai = new OpenAIApi({
  apiKey: OPENAI_API_KEY,
});

const getAllTranscriptions = async () => {
  try {
    const response = await axios.get('https://8cf2-131-94-186-13.ngrok-free.app/item/', {
      headers: { 'Content-Type': 'application/json' },
    });
    interface TranscriptItem {
      Transcript: string;
    }

    return response.data.map((item: TranscriptItem) => item.Transcript);
  
  } catch (error) {
    // console.error('Error fetching all transcriptions:', error);
    // throw error;
  }
};

const summarizeTranscript = async (transcript: string) => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a neutral summarizer. Please summarize the events happening in the given transcript. Do not include hypothetical situations. Consolidate all of the information within 4 sentences, include only factual details. Do not include any analysis, planning or preparation steps. Do not include who was responsible for any given action. Respond in only past tense. Do not speak of any discussion happening but rather glean from that information. Refer to the information given as the situation or events.' },
        { role: 'user', content: transcript },
      ],
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error with OpenAI API: ", error);
    return '';
  }
};

interface UpdatePageProps {
  userID: string;
  dateCreated: string;
}

const UpdatePage: React.FC<UpdatePageProps> = ({ userID, dateCreated }) => {
  const router = useRouter();
  const [summary, setSummary] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndSummarize = async () => {
      setLoading(true);
      try {
        const transcripts = await getAllTranscriptions();
        const newSummaries = await Promise.all(transcripts.map(summarizeTranscript));
        setSummary(newSummaries.filter(Boolean));
      } catch (error) {
        //console.error("Error fetching or summarizing transcripts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndSummarize();
  }, [userID, dateCreated]);

  const handleBackPress = () => {
    router.push('/record');
  }

  return (
    <LinearGradient colors={['#ff0000', '#ff3333', '#ff6666', '#ffffff', '#ffffff']} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Event Updates</Text>
        

        <View style={styles.summaryBox}>
          <Text style={styles.subtitle}>Summary of Update</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#ff0000" />
          ) : summary.length > 0 ? (
            summary.map((item, index) => (
              <Text key={index} style={styles.summaryText}>
                {item}
              </Text>
            ))
          ) : (
            <Text style={styles.noSummaryText}>
              No summary available
            </Text>
          )}
        </View>
        <View className=''><PressableButton variant="tertiary" onPress={handleBackPress}>
          {'<- Back'}
        </PressableButton></View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    padding: 20,
  },
  title: {
    marginTop:30,
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    color: 'black',
    textAlign: 'center',
    marginBottom: 15,
  },
  summaryBox: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 10,
    textAlign: 'center', // Center the text
  },
  noSummaryText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    textAlign: 'center',
  },
});

export default UpdatePage;