import { useEffect } from "react";

interface ModelViewerProps {
    fileName: string;
}

function ModelViewer({ fileName }: ModelViewerProps) {
    useEffect(() => {
        
    }, [fileName]);
    return (
        <div>
        <h1>3D Model Viewer</h1>
        <p>Coming soon...</p>
        </div>
    );
}

export default ModelViewer;