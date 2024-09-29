from fastapi import FastAPI, File, UploadFile, Form, Request
from openai import OpenAI
from dotenv import load_dotenv
import os
from pathlib import Path
import boto3
from botocore.exceptions import ClientError
from pydantic import BaseModel
from decimal import Decimal
import base64
import requests
import dotenv
from io import BytesIO
from fastapi.middleware.cors import CORSMiddleware

from datetime import datetime

app = FastAPI()

origins = [
    "*",  # Allow all origins (not recommended for production)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Origins that should be allowed
    allow_credentials=True,  # If credentials (e.g., cookies, Authorization headers) should be supported
    allow_methods=["*"],  # HTTP methods allowed (GET, POST, etc.)
    allow_headers=["*"],  # HTTP headers that are allowed in the request
)

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
    insert_item(user_id, date_created, Decimal(latitude), Decimal(longitude), transcript)

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


# Function to encode the image
def encode_image(uploaded_file: UploadFile) -> str:
    # Read the uploaded file and encode it to base64
    image_data = uploaded_file.file.read()  # Read the file contents
    base64_image = base64.b64encode(image_data).decode('utf-8')  # Encode to base64
    return base64_image

class UploadUserData(BaseModel):
    user_id: str
    latitude: str
    longitude: str
    transcript: str


@app.post("/upload_image/")
async def upload_image(    file: UploadFile = File(...), 
    user_id: str = Form(...), 
    latitude: str = Form(...), 
    longitude: str = Form(...)):

    print("Currently uploading image...")
    print("User ID: ", user_id)
    print("Latitude: ", latitude)
    print("Longitude: ", longitude)
    dotenv.load_dotenv()
    api_key = os.getenv("OPENAI_API_KEY")

    # Getting the base64 string
    base64_image = encode_image(file)

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Describe the person in the image. List the features of the person and the characteristics of their phenotypes that describe them accurately. Make sure you list out the specific details? If there is no person, describe the scene and any details that might help investigators."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        "max_tokens": 300
    }

    latitude_decimal = Decimal(latitude)
    longitude_decimal = Decimal(longitude)

    # Send request to OpenAI
    response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
    response_data = response.json()
    transcription = response_data.get('choices', [{}])[0].get('message', {}).get('content', '')

    upload_payload = UploadUserData(user_id=user_id, latitude=latitude, longitude=longitude, transcript=transcription)

    date_created = datetime.now().isoformat()

    # Insert an item with user data
    insert_item(user_id, date_created, Decimal(latitude), Decimal(longitude), transcription)

    #print(transcription)

    # upload_response = requests.post(
    #     "https://8cf2-131-94-186-13.ngrok-free.app/upload_data/",
    #     json=upload_payload.dict(),  # Use json= and convert the payload to dict
    #     headers={
    #         'Content-Type': 'application/json',
    #     }
    # )
    # print(upload_response.json())

    # # Check the status code first
    # if upload_response.status_code == 200:
    #     try:
    #         # Print the raw response text to check its content
    #         print("Response Text:", upload_response.text)

    #         # Try to parse the JSON response if the response is not empty
    #         response_data = upload_response.json()
    #         print("Parsed JSON:", response_data)
    #     except requests.exceptions.JSONDecodeError:
    #         print(f"Failed to parse JSON response. Raw content: {upload_response.text}")
    # else:
    #     # If status code is not 200, print the error status and content
    #     print(f"Request failed with status code {upload_response.status_code}. Response: {upload_response.text}")

    # print(upload_response.json())

    # Return the OpenAI response
    return response.json()

@app.post("/update_user_location/")
async def update_user_location(request: Request):
    table = dynamodb.Table('SARAI_Positions')
    data = await request.json()
    user_id = data['user_id']
    latitude = data['latitude']
    longitude = data['longitude']

    if not user_id or latitude is None or longitude is None:
        return {"message": "User ID, latitude, or longitude is missing or invalid"}
    
    # Insert or update the user's location in DynamoDB
    table.put_item(
        Item={
            'UserID': user_id,
            'latitude': Decimal(str(float(latitude))),  # Use string format for precision
            'longitude': Decimal(str(float(longitude)))
        }
    )
    
    return {"message": "User location updated successfully"}

@app.post("/get_gps_data/")
async def get_gps_data():
    # Scan the table to get all user locations
    table = dynamodb.Table('SARAI_Positions')
    response = table.scan()
    items = response['Items']
    return items

@app.post("/send_username/")
async def send_username(request: Request):
    table = dynamodb.Table('SARAI_Positions')
    data = await request.json()
    user_id = data.get('user_id')  # Extract user_id from the request
    username = data.get('username')  # Extract username from the request

    if not user_id or not username:
        return {"error": "user_id and username are required fields."}

    try:
        # Update the item in DynamoDB, setting the username
        response = table.update_item(
            Key={'UserID': user_id},  # Partition key that matches the existing item in the table
            UpdateExpression="SET username = :u",  # Set or add the username attribute
            ExpressionAttributeValues={':u': username},  # New username value to be added or updated
            ReturnValues="UPDATED_NEW"  # Return only the updated attributes
        )
        
        return {"message": f"Username for user {user_id} has been updated to {username}."}

    except Exception as e:
        print(f"Error updating item: {e}")  # Log the error for debugging
        return {"error": str(e)}



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)