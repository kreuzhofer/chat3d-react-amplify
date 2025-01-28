import {ILLMAdapter, ILLMMessage, ILLMResponse} from './ILLMAdapter';
import { ILLMDefinition } from './LLMDefinitions';
import ollama from 'ollama';

export class OllamaAdapter implements ILLMAdapter {
    private modelDefinition: ILLMDefinition;
    constructor(modelDefinition: ILLMDefinition) {
        this.modelDefinition = modelDefinition;
    }

    async submitQuery(messages: ILLMMessage[], context: string): Promise<ILLMResponse> {
        // Implement the submitQuery method

        const response = await ollama.chat({
            model: this.modelDefinition.modelName,
            messages: [{ role: 'user', content: 'Why is the sky blue?' }],
            stream: false
          })
        console.log(response.message.content)

        return {
            content: [{ type: 'text', text: response.message.content }]
        };
    }
}