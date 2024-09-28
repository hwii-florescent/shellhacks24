from fastapi import FastAPI, File, UploadFile
from openai import OpenAI
from dotenv import load_dotenv
import os
from pathlib import Path

app = FastAPI()

# Loads the .env file
load_dotenv()

# Records the audio to a file and transcribes it
@app.post("/start-recording/")
async def start_recording(file: UploadFile = File(...)):
    # Generate a unique filename
    audio_path = f"recording_{file.filename}"
    
    with open(audio_path, "wb") as audio_file:
        audio_file.write(await file.read())

    print(f"Recording saved as {audio_path}")

    transcription = await transcribe_audio(audio_path)

    print(transcription)
    return {"message": "Recording processed successfully", "transcription": transcription}

# Transcribes the audio using the Whisper-1 model
async def transcribe_audio(audio_path: str):
    # Gets the API key
    api_key = os.environ.get('OPENAI_API_KEY')

    # Gets the client of OpenAI
    client = OpenAI(api_key=api_key)
    
    file_path = Path(audio_path)

    if file_path.exists():
        print("File exists")
    else:
        print("File does not exist")
    
    # Opens the audio file
    with open(audio_path, "rb") as audio_file:
        # Transcribes the audio
        transcription = client.audio.transcriptions.create(
            model="whisper-1", 
            file=audio_file
        )

    # Prints the transcription
    print(transcription.text)

    os.remove(audio_path)

    return transcription.text

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)