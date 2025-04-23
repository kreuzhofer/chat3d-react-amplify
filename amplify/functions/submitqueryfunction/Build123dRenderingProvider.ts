import { IRenderingProvider, RenderModelResult } from "./IRenderingProvider";
import { S3 } from "aws-sdk";

export class Build123dRenderingProvider implements IRenderingProvider {
    private s3 = new S3();

    async generateSourceCodeFile(code: string, messageId: string, bucket: string): Promise<string> {
        console.log("Uploading code: ", code);
        const key = `modelcreator/${messageId}.b123d`;
        await this.s3
            .putObject({
                Bucket: bucket,
                Key: key,
                Body: code,
                ContentType: "text/plain",
            })
            .promise();
        return key;
    }

    async renderModel(sourceFileName: string, targetFileName: string, bucket: string): Promise<RenderModelResult> {
        // Placeholder: Replace with actual Build123d rendering logic
        console.log(`Rendering model from ${sourceFileName} to ${targetFileName} in bucket ${bucket}...`);

        // Simulate rendering process
        const targetModelKey = `modelcreator/${targetFileName}`;
        await this.s3
            .putObject({
                Bucket: bucket,
                Key: targetModelKey,
                Body: Buffer.from(`Simulated model data for ${targetFileName}`),
                ContentType: "application/octet-stream",
            })
            .promise();

        return {
            success: true,
            targetModelKey,
        };
    }
}

export default Build123dRenderingProvider;