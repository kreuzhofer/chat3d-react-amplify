import { getUrl } from "aws-amplify/storage";
import { useEffect, useState } from "react";
import { Button } from "semantic-ui-react";

interface FileDownloadButtonProps {
    fileName: string;
    text: string;
}

const FileDownloadButton: React.FC<FileDownloadButtonProps> = ({ fileName, text }) => {
    const [downloadUrl, setDownloadUrl] = useState<string>("");

    useEffect(() => {
        getUrl({
            path: fileName,
            options:
            {
                expiresIn: 900,
            }
            // Alternatively, path: ({identityId}) => `album/{identityId}/1.jpg`
            }).then(linkToStorageFile => {
                console.log('signed URL: ', linkToStorageFile.url);
                console.log('URL expires at: ', linkToStorageFile.expiresAt);
                setDownloadUrl(linkToStorageFile.url.toString());
            });
    }, [fileName]);

    return (
        downloadUrl!=="" ? <Button as="a" href={downloadUrl}>{text}</Button> : <div>Generating URL...</div>
    );
}

export default FileDownloadButton;