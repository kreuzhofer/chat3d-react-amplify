import {ILLMAdapter, ILLMMessage, ILLMResponse} from './ILLMAdapter';
import { ILLMDefinition } from './LLMDefinitions';
import { env } from '$amplify/env/submitQueryFunction';
import OpenAI from "openai";
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const OpenScadResponse = z.object({
    plan: z.string(),
    code: z.string(),
    parameters: z.record(z.string()),
    comment: z.string()
});

export class OpenAIAdapter implements ILLMAdapter {
    private modelDefinition: ILLMDefinition;
    openai: OpenAI;
    constructor(modelDefinition: ILLMDefinition) {
        this.modelDefinition = modelDefinition;
        console.log("OpenAI Key:"+env.OPENAI_API_KEY);
        this.openai = new OpenAI({ 
            apiKey: env.OPENAI_API_KEY,
            project: env.OPENAI_PROJECT_ID,
            organization: env.OPENAI_ORGANIZATION_ID
        });
    }

    async submitQuery(conversation: ILLMMessage[], context: string): Promise<ILLMResponse> {
        const completion = await this.openai.chat.completions.create({
            messages: [
            { role: "developer", content: this.modelDefinition.systemPrompt(context) },
            ...conversation.map((message) => ({
                role: message.role,
                content: message.content.map((content) => ({ type: content.type, text: content.text }))
            } as ChatCompletionMessageParam))
            ],
            model: this.modelDefinition.modelName,
            store: false,
            //...(this.modelDefinition.modelName.startsWith("gpt") ? { max_tokens: 4096 } : { max_completion_tokens: 4096 }),
            stop: ["</comment>"]
        });
        
        console.log(JSON.stringify(completion));

        const inputTokens = completion.usage?.prompt_tokens || 0;
        const outputTokens = completion.usage?.completion_tokens || 0;
        const inputTokenCost = this.modelDefinition.inputTokenCostPerMille * inputTokens / 1000;
        const outputTokenCost = this.modelDefinition.outputTokenCostPerMille * outputTokens / 1000;
        const tokenCost = inputTokenCost + outputTokenCost;

        const responseText = completion.choices[0].message.content ? completion.choices[0].message.content + "</comment>" : undefined;

        return {
            content: [{ type: completion.choices[0].message.role, text: responseText }],
            inputTokens: inputTokens,
            outputTokens: outputTokens,
            inputTokenCost: inputTokenCost,
            outputTokenCost: outputTokenCost,
            tokensCost: tokenCost
        };
    }
}