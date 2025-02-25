import { IRenderingProvider } from "./IRenderingProvider";

export class OpenScadRenderingProvider implements IRenderingProvider {
    async render(query: string): Promise<string> {
        return "Rendering OpenScad";
    }
}