import type { Schema, IChatMessage } from "../../data/resource"
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { BedrockRuntimeClient, ConverseCommand, Message  } from "@aws-sdk/client-bedrock-runtime";
import { generateClient } from "aws-amplify/data";
//import { list } from 'aws-amplify/storage';

import { Amplify } from 'aws-amplify';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/submitQueryFunction';
import { v4 as uuidv4 } from 'uuid';

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as fs from 'fs';
import { GetS3FileAsByteArrayAsync } from "./GetS3FileAsByteArrayAsync";
import { Buffer } from 'buffer';

import * as winston from "winston";
const logger = winston.createLogger({
    transports: [new winston.transports.Console()],
  });

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

interface DocumentSections {
  plan: string;
  code: string;
  parameters: string;
  comment: string;
}

function extractSections(text: string): DocumentSections {
  
  const extractSection = (section: string): string => {
    const regex = new RegExp(`<${section}>\\n([\\s\\S]*?)\\n<\/${section}>|<${section}>([\\s\\S]*?)<\/${section}>`);
    const match = text.match(regex);
    return (match?.[1] || match?.[2] || '').trim();
  };

  return {
    plan: extractSection('plan'),
    code: extractSection('code'),
    parameters: extractSection('parameters'),
    comment: extractSection('comment')
  };
}

async function invokeOpenScadExecutorFunction(fileName: string, targetFilename: string, openscadExecutorFunctionName: string, bucketName: string) {

  const lambdaClient = new LambdaClient({});
    const invokeParams = {
      FunctionName: openscadExecutorFunctionName,
      InvocationType: 'RequestResponse' as const,
      Payload: JSON.stringify({
        fileName: fileName,
        targetFilename: targetFilename,
        bucket: bucketName
      }),
    };
    
    const response = await lambdaClient.send(new InvokeCommand(invokeParams));
    if(response.Payload)
        return JSON.parse(new TextDecoder().decode(response.Payload));
  }

export const handler: Schema["submitQuery"]["functionHandler"] = async (event) => {
    // arguments typed from `.arguments()`
    const { chatContextId, newUserChatItemId, newAssistantChatItemId, query, executorFunctionName, bucket } = event.arguments;
    if (!query || !chatContextId || !newUserChatItemId || !newAssistantChatItemId || !executorFunctionName || !bucket) {
        throw new Error("Missing query parameter(s)");
    }

    // https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_bedrock-runtime_code_examples.html
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/bedrock-runtime/command/ConverseCommand/
    // https://docs.aws.amazon.com/bedrock/latest/userguide/tool-use-examples.html
    const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });
    const dataClient = generateClient<Schema>();

    // Set the model ID, e.g., Claude 3 Haiku.
    const modelId = "anthropic.claude-3-haiku-20240307-v1:0";
    //const modelId = "us.anthropic.claude-3-5-haiku-20241022-v1:0"

    // load all conversation items for the chat context
    const chatContext = await dataClient.models.ChatContext.get({ id: chatContextId });

    var fetchChatItems = await chatContext.data?.chatItems();
    var chatItems = fetchChatItems;
    while(fetchChatItems?.nextToken)
    {
      fetchChatItems = await chatContext.data?.chatItems({ nextToken: fetchChatItems.nextToken });
      if(fetchChatItems?.data)
        chatItems?.data.push(...fetchChatItems.data);
    }

    var sortedItems = chatItems?.data.sort((a, b) => (a.createdAt > b.createdAt) ? 1 : -1)
    console.log("sortedItems: "+JSON.stringify(sortedItems));

    const filteredItems = sortedItems?.filter((item) => item.id !== newAssistantChatItemId);
    const conversation = await Promise.all(filteredItems?.map(async (item) => {
    
      const messages = (JSON.parse(item.messages as string) as IChatMessage[]) // filter out meta items and only get messages or images
      .filter((message) => message.itemType === "message"/*  || message.itemType === "image" */);

    // only keep the last image if there are multiple images in the list
    const lastImageIndex = messages.map((message, index) => message.itemType === "image" ? index : -1).filter(index => index !== -1).pop();
    const filteredMessages = messages.filter((message, index) => message.itemType === "message" || index === lastImageIndex);
    return {
        role: item.role,
        content: await Promise.all(filteredMessages.map(async function (message) {
          if(message.itemType === "message")
            return { text: message.text }
          else if(message.itemType === "image")
          {
            var imageBytes = await GetS3FileAsByteArrayAsync(bucket, message.attachment);
            const base64Image = imageBytes ? Buffer.from(imageBytes).toString('base64') : '';
            return { image: {
              format: "jpeg",
              source: {
                bytes: base64Image
              }
            }}
          }
        })),
      } as Message;
    }) || []);

    console.log("previous conversation: "+JSON.stringify(conversation));

    const converseCommandInput = {
      modelId: modelId,
      messages: conversation as Message[],
      inferenceConfig: { maxTokens: 512, temperature: 0.5, topP: 0.9 },
      system:[{
        text: "You are a helpful 3d modeling assistant. The user can ask you to create a 3D model and you will discuss with them the details and be able to improve the design in a step-by-step conversation. "+ 
        "Before you ask for the get_3D_model tool, ensure you have enough information to create a model with details. For example: If a user asks you to create a box, ask for the dimensions and if the user asks you to create something creative like a castle, ask for the theme. "+
        "Every time you decide to ask for the get_3D_model tool, you will start with a message to let the user know that you are going to work on it and that it might take a minute, then as a second message, you will ask for the tool."+
        "You should be helpful to the user and answer any question around topics related to 3d modeling, 3d printing, 3d reconstruction, 3d design and 3d scanning and you will create 3d models. Any other discussions you will politely decline."
      }],
      toolConfig: {
        tools: [
          {
            toolSpec: {
              name: "get_3D_model",
              description: "Create a 3D model from the user's specification. "+
                  "Use this tool, when the user asks for something to create or the prompt is just something like an object. "+
                  "For example, if the prompt is 'a castle', then this is a request for a 3d model. ",
              inputSchema: {
                json: 
                  {
                    "type": "object",
                    "properties": {
                      "description": { "type": "string" },
                    },
                    "required": ["description"]
                  }
              }
            }
          }
        ],
      },
    }

    // Create a command with the model ID, the message, and a basic configuration.
    const command = new ConverseCommand(converseCommandInput);
    const response = await bedrockClient.send(command);

    // update response in database
    console.log(response);

    if(response.stopReason === "tool_use")
    {
      console.log("tool use detected");
    }

    // get first item in response.output?.message?.content
    var assistantMessages = response.output?.message?.content;
    console.log("assistantMessages: "+JSON.stringify(assistantMessages));
    var assistantMessage = assistantMessages?.find((item) => item.text);
    var assistantMessageText = assistantMessage?.text || "Let me think about that for a moment...";
    await dataClient.models.ChatItem.update({ id: newAssistantChatItemId, 
      messages: JSON.stringify(
        [
          { 
            id: uuidv4(),
            itemType: "message",
            text: assistantMessageText,
            state: "completed",
            stateMessage: ""
          }
        ])
      });

    if (response.stopReason === "tool_use") {
        const toolRequest = response.output?.message?.content?.find((item) => item.toolUse);
        console.log("tool request: " + JSON.stringify(toolRequest));

        if (toolRequest && toolRequest.toolUse?.name === "get_3D_model") {
            console.log("3d model request detected");

            // Type guard to check if input is an object with a description property
            const input = toolRequest.toolUse?.input;
            if (typeof input === 'object' && input !== null && 'description' in input) {
                const subject = input.description;

                var currentChatItem = await dataClient.models.ChatItem.get({ id: newAssistantChatItemId });
                var messages = JSON.parse(currentChatItem.data?.messages as string) as IChatMessage[];
                var messageId = uuidv4();

                messages.push(
                  {
                    id: messageId,
                    itemType: "image",
                    text: "", 
                    state: "pending",
                    stateMessage: "creating model sketch...",
                    attachment: ""
                  } as IChatMessage
                );
                await dataClient.models.ChatItem.update({ id: newAssistantChatItemId, 
                  messages: JSON.stringify(messages)
                  });                

                const generate3dmodelId = "us.anthropic.claude-3-5-sonnet-20241022-v2:0";
                //const generate3dmodelId = "us.amazon.nova-pro-v1:0";
                //const generate3dmodelId = "us.meta.llama3-3-70b-instruct-v1:0";
                //const generate3dmodelId = "us.anthropic.claude-3-5-haiku-20241022-v1:0"


                const generate3dmodelMessages = filteredItems?.map((item) => {
                  let tempMessages = (JSON.parse(item.messages as string) as IChatMessage[]) // filter out meta items and only get messages
                    .filter((message) => message.itemType === "message" || message.itemType === "meta");
                  return {
                      role: item.role,
                      content: tempMessages.map((message) => ({ text: message.text })),
                    } as Message;
                });
                console.log("generate3dmodelMessages: "+JSON.stringify(generate3dmodelMessages));

                // const generate3dmodelMessages = [
                //     {
                //         role: "user",
                //         content: [{ text: subject }],
                //     },
                // ];

                // const system_prompt_3d_generator = "You are a professional OpenScad code writer with the skills to create highly detailed 3d models in OpenScad script language. "+
                // "You will strive for high detail, dimensional accuracy and structural integrity. "+
                // "If you are prompted to create functional parts, especially if they need to be assembled or are like lego bricks replicatable and combinable, they need to be fitting together. "+
                // "Always start with creating functions for specific details of the final model so you are not missing out on them later. "+
                // "For multi-color models, assemble all parts that have the same color in one function per color do not create a separate module at the end, instead just call the functions individually. "
                // +"Do not do any transformations whatsoever outside of the individual modules. Anything related to the colored parts needs to be done in their respective modules. "+
                // "Body parts should be connected, avoid parts floating in the air unless intended. "+
                // "Make models parametric where it makes sense. For example: A box should have parameters for width, height and depth and if the box is open on one side it also should have a wall-thickness parameter. "+
                // "Always set $fn to 100. Start every answer by creating a plan of how you are going to create the object and how it will ensure to fit the requested object. "+
                // "Elaborate step by step your thoughts and add the Openscad script as your last element to the response. "+
                // "Add decent commenting in your code to support your thoughts how this achieves the result. "+
                // "Do not add any additional characters like triple-hyphens to the beginning or end of the code. "+
                // "Return your results separated in exactly three xml tags. <plan></plan> with your detailed plan for the model creation. "+
                // "<code></code> containing the code and <comment></comment> for your final comments about the model, not mentioning any openscad specific things or function names. "+
                // "You must ensure that all xml tags contain an opening and closing tag in your response. "+
                // "If the model has features like a nose, eyes, mouth, etc., make sure they are in the right place and have the right size and that the model is facing towards the front. "
                //+"Animate the generated model to turn around the z-axis. "

                const system_prompt_3d_generator = "You are a professional OpenScad code writer with the skills to create highly detailed 3d models in OpenScad script language. "+
                "You will strive for high detail, dimensional accuracy and structural integrity. "+
                "If you are prompted to create functional parts, especially if they need to be assembled or are like lego bricks replicatable and combinable, they need to be fitting together. "+
                "Always start with creating functions for specific details of the final model so you are not missing out on them later. "+
                "For multi-color models, assemble all parts that have the same color in one function per color. create a separate module at the end, to assemble all modules. "
                +"Do not do any transformations whatsoever outside of the individual modules. Anything related to the colored parts needs to be done in their respective modules. "+
                "Body parts should be well connected, avoid disconnected parts floating in the air. "+
                "Make models parametric where it makes sense. For example: A box should have parameters for width, height and depth and if the box is open on one side it also should have a wall-thickness parameter. "+
                "Always set $fn to 100. Start every answer by creating a plan of how you are going to create the object and how it will ensure to fit the requested object. "+
                "Elaborate step by step your thoughts and add the Openscad script as your last element to the response. "+
                "Add decent commenting in your code to support your thoughts how this achieves the result. "+
                "Do not add any additional characters like triple-hyphens to the beginning or end of the code. "+
                "Return your results separated in exactly four xml tags. <plan></plan> with your detailed plan for the model creation. "+
                "<code></code> containing the code, <parameters></parameters> with a list of all available parameters for the created model and <comment></comment> for your final comments about the model, not mentioning any openscad specific things or function names. "+
                "You must ensure that all xml tags contain an opening and closing tag in your response. "+
                "If the model has features like a nose, eyes, mouth, etc., make sure they are in the right place and have the right size and that the model is facing towards the front. "
 

                const converse3DModelCommandInput = {
                    modelId: generate3dmodelId,
                    messages: generate3dmodelMessages as Message[],
                    inferenceConfig: { maxTokens: 4096, temperature: 1.0, topP: 0.9 },
                    system: [{
                        text: system_prompt_3d_generator
                    }],
                };

                const converse3DModelCommand = new ConverseCommand(converse3DModelCommandInput);
                const converse3DModelReponse = await bedrockClient.send(converse3DModelCommand);
                console.log(converse3DModelReponse);

                var converse3DModelAssistantMessages = converse3DModelReponse.output?.message?.content;
                console.log("converse3DModelAssistantMessages: "+JSON.stringify(converse3DModelAssistantMessages));
                var converse3DModelAssistantResponse = converse3DModelAssistantMessages?.find((item) => item.text);

                console.log("converse3DModelAssistantResponse: "+JSON.stringify(converse3DModelAssistantResponse));

                // create model using openscad
                const sections = extractSections(converse3DModelAssistantResponse?.text || "");
                const code = sections.code;
                const plan = sections.plan;
                const comment = sections.comment;

                // write code to file and upload to s3 bucket
                const nameOfS3Bucket = bucket;
                console.log("nameOfS3Bucket: "+nameOfS3Bucket);
                // upload code to s3 bucket and get uri
                const fileName = messageId+".scad";
                const key = "modelcreator/"+fileName;
                const scadFileUri = "s3://"+nameOfS3Bucket+"/"+key;
                console.log("scadFileUri: "+scadFileUri);
                // write code to file and upload to s3 bucket
                fs.writeFileSync("/tmp/code.scad", code);
                const s3Client = new S3Client({});
                const s3Params = {
                    Bucket: nameOfS3Bucket,
                    Key: key,
                    Body: fs.createReadStream("/tmp/code.scad")
                };
                const s3Response = await s3Client.send(new PutObjectCommand(s3Params));
                console.log("s3Response: "+JSON.stringify(s3Response));

                // show progress
                messages.pop();
                messages.push(
                  {
                    id: messageId,
                    itemType: "image",
                    text: "", 
                    state: "pending",
                    stateMessage: "creating preview image...",
                    attachment: ""
                  } as IChatMessage
                );
                await dataClient.models.ChatItem.update({ id: newAssistantChatItemId, 
                  messages: JSON.stringify(messages)
                  });

                const targetImagefilename = messageId+".png";
                const targetModelFilename = messageId+".3mf";
                var scadExecutorResult = await invokeOpenScadExecutorFunction(fileName, targetImagefilename, executorFunctionName, bucket);
                console.log("scadExecutorResult: "+JSON.stringify(scadExecutorResult));

                if(scadExecutorResult?.errorMessage && scadExecutorResult?.errorMessage !== "")
                  console.log("Error creating model: "+scadExecutorResult?.errorMessage);

                if((scadExecutorResult?.statusCode && scadExecutorResult?.statusCode !== 200) || 
                (scadExecutorResult?.errorMessage && scadExecutorResult?.errorMessage !== ""))
                {
                  messages.pop();
                  messages.pop();
                  messages.push(
                    {
                      id: messageId,
                      itemType: "errormessage",
                      text: "There was a problem creating the model. Please try again later.",
                      state: "error",
                      stateMessage: "",
                      attachment: ""
                    } as IChatMessage
                  );
                  await dataClient.models.ChatItem.update({ id: newAssistantChatItemId, 
                    messages: JSON.stringify(messages)
                    });  
                  return scadExecutorResult?.body;
                }
                
                const modelImageKey = "modelcreator/"+targetImagefilename;
                // update message inside of newAssistantChatItem with state completed
                messages.pop()
                messages.push(
                  {
                    id: messageId,
                    itemType: "image",
                    text: comment,
                    state: "pending",
                    stateMessage: "creating 3D model...",
                    attachment: modelImageKey
                  } as IChatMessage
                );
                await dataClient.models.ChatItem.update({ id: newAssistantChatItemId, 
                  messages: JSON.stringify(messages)
                  });  

                // render final model file
                var scadExecutorResult = await invokeOpenScadExecutorFunction(fileName, targetModelFilename, executorFunctionName, bucket);
                console.log("scadExecutorResult: "+JSON.stringify(scadExecutorResult));

                if(scadExecutorResult?.errorMessage && scadExecutorResult?.errorMessage !== "")
                  console.log("Error creating model: "+scadExecutorResult?.errorMessage);

                if((scadExecutorResult?.statusCode && scadExecutorResult?.statusCode !== 200) || 
                (scadExecutorResult?.errorMessage && scadExecutorResult?.errorMessage !== ""))
                {
                  messages.pop();
                  messages.pop();
                  messages.push(
                    {
                      id: messageId,
                      itemType: "errormessage",
                      text: "There was a problem creating the model. Please try again later.",
                      state: "error",
                      stateMessage: "",
                      attachment: ""
                    } as IChatMessage
                  );
                  await dataClient.models.ChatItem.update({ id: newAssistantChatItemId, 
                    messages: JSON.stringify(messages)
                    });  
                  return scadExecutorResult?.body;
                }

                const modelKey = "modelcreator/"+targetModelFilename;
                messages.pop()
                messages.push(
                  {
                    id: messageId,
                    itemType: "3dmodel",
                    text: comment,
                    state: "completed",
                    stateMessage: "",
                    attachment: modelKey
                  } as IChatMessage
                );
                await dataClient.models.ChatItem.update({ id: newAssistantChatItemId, 
                  messages: JSON.stringify(messages)
                  });  

                // add meta information that was created by the tool
                messages.push(
                  {
                    id: uuidv4(),
                    itemType: "meta",
                    text: converse3DModelAssistantResponse?.text,
                    state: "completed",
                    stateMessage: ""
                  } as IChatMessage
                );

                await dataClient.models.ChatItem.update({ id: newAssistantChatItemId, 
                  messages: JSON.stringify(messages)
                  });  

            } else {
                throw new Error("Input does not have a description property");
            }
        }
    }

    return JSON.stringify(response);
  }