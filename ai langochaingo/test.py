import boto3
from botocore.exceptions import ClientError

# Initialize a DynamoDB client
dynamodb = boto3.resource('dynamodb')

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
                        'AttributeName': 'Operation',
                        'KeyType': 'HASH'  # Partition key
                    },
                    {
                        'AttributeName': 'Team',
                        'KeyType': 'RANGE'  # Sort key
                    }
                ],
                AttributeDefinitions=[
                    {
                        'AttributeName': 'Team',
                        'AttributeType': 'S'  # String
                    },
                    {
                        'AttributeName': 'Operation',
                        'AttributeType': 'S'  # String
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

def insert_item(id, sort_key, **kwargs):
    table = dynamodb.Table('SARAI')
    try:
        item = {
            'Operation': id,
            'Team': sort_key,
            **kwargs
        }
        response = table.put_item(Item=item)
        print(f"Item with id {id} and sort key {sort_key} inserted successfully.")
        return response
    except ClientError as e:
        print(f"Error inserting item: {e}")

def delete_item(id):
    table = dynamodb.Table('SARAI')
    try:
        response = table.delete_item(
            Key={
                'Operation': id,
            }
        )
        print(f"Item with id {id} is deleted successfully.")
        return response
    except ClientError as e:
        print(f"Error deleting item: {e}")

def update_item(id, sort_key, update_expression, expression_values):
    table = dynamodb.Table('SARAI')
    try:
        response = table.update_item(
            Key={
                'Operation': id,
                'Team': sort_key
            },
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ReturnValues="UPDATED_NEW"
        )
        print(f"Item with id {id} and sort key {sort_key} updated successfully.")
        return response
    except ClientError as e:
        print(f"Error updating item: {e}")

# Example usage
if __name__ == "__main__":
    # Create the table if it doesn't exist
    create_sarai_table_if_not_exists()

    # Insert an item
    insert_item('user123', 'profile')

    # Update an item

    # Delete an item
    # delete_item('user123', 'profile')