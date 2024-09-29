import boto3
from botocore.exceptions import ClientError
from fastapi import FastAPI
from datetime import datetime

app = FastAPI()

# Initialize a DynamoDB client
dynamodb = boto3.resource('dynamodb')

# Upload data: user ID, date created, latitude, longitude, and transcript
@app.post("/upload_data/")
async def upload_data(user_id: str, latitude: float, longitude: float, transcript: str):
    # Create the table if it doesn't exist
    create_sarai_table_if_not_exists()

    # Get the current date and time for "date_created"
    date_created = datetime.now().isoformat()

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


def insert_item(user_id: str, date_created: str, latitude: float, longitude: float, transcript: str):
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


# Example usage
if __name__ == "__main__":
    # Create the table if it doesn't exist
    create_sarai_table_if_not_exists()

    # Insert an item
    insert_item('user123', datetime.now().isoformat(), 40.7128, -74.0060, "This is a test transcript.")

    # Delete an item (example usage)
    # delete_item('user123', '2024-09-28T14:00:00')