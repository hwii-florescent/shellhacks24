import pyaudio
import wave


CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100

p = pyaudio.PyAudio()


#Opens the audio stream
stream = p.open(format= FORMAT,
                channels=CHANNELS,
                rate=RATE, 
                input=True,
                frames_per_buffer=CHUNK)

print("start recording...")


#Records for three seconds
frames = []
seconds = 5
for i in range(0, int(RATE/CHUNK * seconds)):
    data = stream.read(CHUNK)
    frames.append(data)
    
print("recording stopped")

#Closes the recoding
stream.stop_stream()
stream.close()
p.terminate()


#Outputs the recording to a file
wf = wave.open("output.wav", 'wb')
wf.setnchannels(CHANNELS)
wf.setsampwidth(p.get_sample_size(FORMAT))
wf.setframerate(RATE)
wf.writeframes(b''.join(frames))
wf.close()


from openai import OpenAI
from dotenv import load_dotenv
import os

#Loads the .env file
load_dotenv()

#Gets the API key
api_key = os.environ.get('OPENAI_API_KEY')


#Gets the client of OpenAI
client = OpenAI(api_key=api_key)

#Opens the audio file
audio_file= open("output.wav", "rb")

#Transcribes the audio
transcription = client.audio.transcriptions.create(
  model="whisper-1", 
  file=audio_file
)

#Prints the transcription
print(transcription.text)

import bs4
from langchain_chroma import Chroma
from langchain_community.document_loaders import WebBaseLoader#
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from datetime import datetime
from pydantic import BaseModel, PositiveInt
from langchain.schema import Document



docs = Document(
    page_content="This is the text content of the document.", 
    metadata={"source": "some source", "date": "2024-09-28"}
)

print(docs.page_content)
print(docs.metadata)
#Sets the text into the docs
#audio_file.close()


#removes after loading text string
#os.remove("output.wav")

from langchain_community.document_loaders import TextLoader

loader = TextLoader("demofile2.txt")
docs = loader.load()


#Text splits into different vectors
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
splits = text_splitter.split_documents(docs)
vectorstore = Chroma.from_documents(documents=splits, embedding=OpenAIEmbeddings())

# Retrieve and generate using the relevant snippets of the blog.
retriever = vectorstore.as_retriever()

def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

prompt = ''' This is a search and rescue mission, and I have a piece of dialogue that may contain important clues about the mission. 
Your task is to analyze the dialogue closely, focusing on the meaning and significance of the words and phrases used. Pay attention to 
any possible references to locations, times, or people involved, as well as the emotional tone or urgency expressed. Please do not make 
any assumptions or deductions beyond what is explicitly stated in the text.'''

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

rag_chain.invoke("What is Task Decomposition?")