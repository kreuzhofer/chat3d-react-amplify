import {ExecutionProvider, ILLMDefinition} from './LLMDefinitions';
import { ILLMAdapter } from './ILLMAdapter';
import { OllamaAdapter } from './OllamaAdapter';
import { BedrockAdapter } from './BedrockAdapter';
import { OpenAIAdapter } from './OpenAIAdapter';
import { XAiGrokAdapter } from './XAiGrokAdapter';
import { DeepSeekAdapter } from './DeepSeekAdapter';

export class LLMAdapterFactory {
    static create(definition: ILLMDefinition): ILLMAdapter {
        switch (definition.executionProvider) {
            case ExecutionProvider.Ollama:
                return new OllamaAdapter(definition);
            case ExecutionProvider.AWS_Bedrock:
                return new BedrockAdapter(definition);
            case ExecutionProvider.OpenAI:
                return new OpenAIAdapter(definition);
            case ExecutionProvider.XAi:
                return new XAiGrokAdapter(definition);
            case ExecutionProvider.DeepSeek:
                return new DeepSeekAdapter(definition);
            default:
                throw new Error(`Unsupported Execution Provider: ${definition.executionProvider}`);
        }
    }
}
