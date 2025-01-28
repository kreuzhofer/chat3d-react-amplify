import { BedrockRuntimeClient, ConverseCommand, Message } from "@aws-sdk/client-bedrock-runtime";
import { ILLMAdapter, ILLMMessage, ILLMResponse } from "./ILLMAdapter";
import { ILLMDefinition } from "./LLMDefinitions";

export class BedrockAdapter implements ILLMAdapter {
    modelDefinition: ILLMDefinition;
    constructor(modelDefinition: ILLMDefinition) {
        this.modelDefinition = modelDefinition;
    }

    async submitQuery(messages: ILLMMessage[], context: string): Promise<ILLMResponse> {
        const system_prompt_3d_generator = this.modelDefinition.systemPrompt;
        const generate3dmodelId = this.modelDefinition.modelName;
        const bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });

        const generate3dmodelMessages = messages.map((message) => ({
            role: message.role,
            content: message.content.map((content) => ({ type: content.type, text: content.text }) )
        } as Message));

        const converse3DModelCommandInput = {
            modelId: generate3dmodelId,
            messages: generate3dmodelMessages as Message[],
            inferenceConfig: { maxTokens: 4096, temperature: 1.0, topP: 0.9 },
            system: [{
                text: system_prompt_3d_generator(context)
            }],
        };

        const converse3DModelCommand = new ConverseCommand(converse3DModelCommandInput);
        const converse3DModelReponse = await bedrockClient.send(converse3DModelCommand);
        console.log(converse3DModelReponse);
        const inputTokens3DModel = converse3DModelReponse.usage?.inputTokens || 0;
        const outputTokens3DModel = converse3DModelReponse.usage?.outputTokens || 0;
        const inputTokenCost3DModel = this.modelDefinition.inputTokenCostPerMille * inputTokens3DModel / 1000;
        const outputTokenCost3DModel = this.modelDefinition.outputTokenCostPerMille * outputTokens3DModel / 1000;
        const tokens3DModelCost = inputTokenCost3DModel + outputTokenCost3DModel;

        var converse3DModelAssistantMessages = converse3DModelReponse.output?.message?.content;
        console.log("converse3DModelAssistantMessages: "+JSON.stringify(converse3DModelAssistantMessages));
        var converse3DModelAssistantResponse = converse3DModelAssistantMessages?.find((item) => item.text);

        console.log("converse3DModelAssistantResponse: "+JSON.stringify(converse3DModelAssistantResponse));

        return {
            content: [{
                type: 'text',
                text: converse3DModelAssistantResponse?.text || undefined
            }],
            inputTokens: inputTokens3DModel,
            outputTokens: outputTokens3DModel,
            inputTokenCost: inputTokenCost3DModel,
            outputTokenCost: outputTokenCost3DModel,
            tokensCost: tokens3DModelCost
        };
    }
}