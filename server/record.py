from fastapi import FastAPI, File, UploadFile
from openai import OpenAI
from dotenv import load_dotenv
import os
from pathlib import Path
import boto3
from botocore.exceptions import ClientError
from pydantic import BaseModel
from decimal import Decimal

from datetime import datetime

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


# Initialize a DynamoDB client
dynamodb = boto3.resource('dynamodb')

# Data model for uploading data
class UploadData(BaseModel):
    user_id: str
    latitude: Decimal
    longitude: Decimal
    transcript: str

# Upload data: user ID, date created, latitude, longitude, and transcript
@app.post("/upload_data/")
async def upload_data(data: UploadData):
    # Create the table if it doesn't exist
    #create_sarai_table_if_not_exists()

    print("Uploading data...")

    # Get the user ID, latitude, longitude, and transcript from the request
    user_id = data.user_id
    latitude = data.latitude
    longitude = data.longitude
    transcript = data.transcript

    # Get the current date and time for "date_created"
    date_created = datetime.now().isoformat()

    print(date_created)

    # Insert an item with user data
    insert_item(user_id, date_created, latitude, longitude, transcript)

    return {"message": "Data uploaded successfully"}


def create_sarai_table_if_not_exists():
    table_name = 'SARAI'
    try:
        # Check if the table already exists
        table = dynamodb.Table(table_name)
        table.load()
        print(f"Table {table_name} already exists.")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            # Table doesn't exist, so create it
            table = dynamodb.create_table(
                TableName=table_name,
                KeySchema=[
                    {
                        'AttributeName': 'UserID',
                        'KeyType': 'HASH'  # Partition key
                    },
                    {
                        'AttributeName': 'DateCreated',
                        'KeyType': 'RANGE'  # Sort key
                    }
                ],
                AttributeDefinitions=[
                    {
                        'AttributeName': 'UserID',
                        'AttributeType': 'S'  # String
                    },
                    {
                        'AttributeName': 'DateCreated',
                        'AttributeType': 'S'  # String (ISO format datetime)
                    }
                ],
                ProvisionedThroughput={
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            )
            table.meta.client.get_waiter('table_exists').wait(TableName=table_name)
            print(f"Table {table_name} created successfully.")
        else:
            print(f"Error checking/creating table: {e}")


def insert_item(user_id: str, date_created: str, latitude: Decimal, longitude: Decimal, transcript: str):
    table = dynamodb.Table('SARAI')
    try:
        item = {
            'UserID': user_id,
            'DateCreated': date_created,
            'Latitude': latitude,
            'Longitude': longitude,
            'Transcript': transcript
        }
        response = table.put_item(Item=item)
        print(f"Item with UserID {user_id} and DateCreated {date_created} inserted successfully.")
        return response
    except ClientError as e:
        print(f"Error inserting item: {e}")


def delete_item(user_id, date_created):
    table = dynamodb.Table('SARAI')
    try:
        response = table.delete_item(
            Key={
                'UserID': user_id,
                'DateCreated': date_created
            }
        )
        print(f"Item with UserID {user_id} and DateCreated {date_created} deleted successfully.")
        return response
    except ClientError as e:
        print(f"Error deleting item: {e}")


def update_item(user_id, date_created, update_expression, expression_values):
    table = dynamodb.Table('SARAI')
    try:
        response = table.update_item(
            Key={
                'UserID': user_id,
                'DateCreated': date_created
            },
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ReturnValues="UPDATED_NEW"
        )
        print(f"Item with UserID {user_id} and DateCreated {date_created} updated successfully.")
        return response
    except ClientError as e:
        print(f"Error updating item: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)