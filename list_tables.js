require('dotenv').config();
const { DynamoDBClient, ListTablesCommand } = require("@aws-sdk/client-dynamodb");

async function listAllTables() {
    console.log('Listing all DynamoDB tables in region:', process.env.AWS_REGION);

    const client = new DynamoDBClient({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    });

    try {
        const response = await client.send(new ListTablesCommand({}));
        console.log('\n=================== AWS DYNAMODB TABLES ===================');
        console.log(JSON.stringify(response.TableNames, null, 2));
        console.log('===========================================================\n');
    } catch (err) {
        console.error('List tables error:', err);
    }
}

listAllTables();
