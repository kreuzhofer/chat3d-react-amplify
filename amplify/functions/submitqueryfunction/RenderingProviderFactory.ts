import { IRenderingProvider } from "./IRenderingProvider";
import { RenderingProvider } from "./LLMDefinitions";
import { OpenScadRenderingProvider } from "./OpenScadRenderingProvider";

export class RenderingProviderFactory {
    static initializeProvider(provider: RenderingProvider): IRenderingProvider {
        switch (provider) {
            case RenderingProvider.OpenScad:
                return new OpenScadRenderingProvider();
            default:
                throw new Error(`Unsupported Execution Provider: ${provider}`);
        }
    }
} 