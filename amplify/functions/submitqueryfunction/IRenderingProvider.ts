export interface IRenderingProvider {
    render(query: string): Promise<string>;
}