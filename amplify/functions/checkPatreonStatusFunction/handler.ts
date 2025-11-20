import type { Schema } from "../../data/resource";
import { DynamoDB } from "aws-sdk";

export const handler: Schema["checkPatreonStatus"]["functionHandler"] = async (event) => {
  const { patreonEmail } = event.arguments;
  if (!patreonEmail) {
      throw new Error("Email is required");
  }
  console.log("patreonEmail: "+patreonEmail);
  const dynamoDb = new DynamoDB({
    region: "eu-west-1",
  });
  const params = {
    TableName: "Patron",
    IndexName: "patronsByEmail",
    KeyConditionExpression: "email = :patreonEmail",
    ExpressionAttributeValues: {
      ":patreonEmail": { S: patreonEmail },
    },
  };
  const data = await dynamoDb.query(params).promise();
  console.log("data: "+JSON.stringify(data));
  if (!data.Items || data.Items.length === 0) {
    throw new Error("Patreon not found");
  }

  return "OK"
}