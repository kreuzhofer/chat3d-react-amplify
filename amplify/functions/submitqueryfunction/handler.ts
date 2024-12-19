import type { Schema } from "../../data/resource"
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { BedrockRuntimeClient, ConverseCommand, Message  } from "@aws-sdk/client-bedrock-runtime";
import { generateClient } from "aws-amplify/data";

import { Amplify } from 'aws-amplify';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/submitQueryFunction';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

async function invokeLambdaFunction(query: string) {
    const lambdaClient = new LambdaClient({});
    const invokeParams = {
      FunctionName: 'Chat3DPromptEvaluationCdk-Chat3DPromptEvaluationFu-JMgtnYiwKGwT',
      InvocationType: 'RequestResponse' as const,
      Payload: JSON.stringify({
        subject: query,
      }),
    };
    
    const response = await lambdaClient.send(new InvokeCommand(invokeParams));
    if(response.Payload)
        return JSON.parse(new TextDecoder().decode(response.Payload));
  }

export const handler: Schema["submitQuery"]["functionHandler"] = async (event) => {
    // arguments typed from `.arguments()`
    const { chatContextId, query } = event.arguments;
    if (!query || !chatContextId) {
        throw new Error("ChatContextId and Query are required");
    }

    // https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_bedrock-runtime_code_examples.html
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/bedrock-runtime/command/ConverseCommand/
    const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });
    const dataClient = generateClient<Schema>();

    // Set the model ID, e.g., Claude 3 Haiku.
    const modelId = "anthropic.claude-3-haiku-20240307-v1:0";

    // load all conversation items for the chat context
    const chatContext = await dataClient.models.ChatContext.get({ id: chatContextId });

    var chatItems = await chatContext.data?.chatItems();
    var sortedItems = chatItems?.data.sort((a, b) => (a.createdAt > b.createdAt) ? 1 : -1);
    const conversation = sortedItems?.map((item) => {
      return {
        role: item.role,
        content: [{ text: item.message }],
      };
    });
    conversation?.push({ role: "user", content: [{ text: query }] });

    console.log(JSON.stringify(conversation));

    // add new item to database
    await dataClient.models.ChatItem.create({ chatContextId: chatContextId, role: "user", message: query, itemType: "message" });

    const converseCommandInput = {
      modelId: modelId,
      messages: conversation as Message[],
      inferenceConfig: { maxTokens: 512, temperature: 0.5, topP: 0.9 },
    }

    // Create a command with the model ID, the message, and a basic configuration.
    const command = new ConverseCommand(converseCommandInput);
    const response = await bedrockClient.send(command);

    // add response to database
    console.log(response);
    if (response.output?.message?.content) {
      response.output?.message?.content.forEach(async element => {
        await dataClient.models.ChatItem.create({ chatContextId: chatContextId, role: "assistant", message: element.text, itemType: "message" });
      });
        
    } else {
        throw new Error("Response content is undefined");
    }

    return JSON.stringify(response);
    // call lambda function to get the result. the lambda is known by its name
    // var lambdaResult = await invokeLambdaFunction(query);
    // if(!lambdaResult)
    //     return "error";
    // return lambdaResult;
  }