import type { Schema } from "../../data/resource"
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

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
    const { query } = event.arguments;
    if (!query) {
        throw new Error("Query is required");
    }

    // call lambda function to get the result. the lambda is known by its name
    var lambdaResult = await invokeLambdaFunction(query);
    if(!lambdaResult)
        return "error";
    return lambdaResult;
  }