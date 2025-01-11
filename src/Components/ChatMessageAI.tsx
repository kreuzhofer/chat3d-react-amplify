import type { Schema, IChatMessage } from "../../amplify/data/resource";
import { Loader, Segment, Icon, Placeholder, PlaceholderImage, Button } from "semantic-ui-react";
import { StorageImage } from '@aws-amplify/ui-react-storage';
import ModelViewer from "./ModelViewer";
import FileDownloadButton from "./FileDownloadButton";
import { getUrl } from "aws-amplify/storage";

function ChatMessageAI(item: Schema["ChatItem"]["type"])
{
    const messages = item.messages ? JSON.parse(item.messages as string) as IChatMessage[] : [];
    const filePrefix = "modelcreator/";

    return(
        <>
        {messages.map((message) => {
            if(message.itemType === "message")
                return (
                    <div className="message ai" key={message.id}>
                        <div className="content">
                            {message.text}
                            <Loader active={message.state==="pending"} inline />
                        </div>
                    </div>
                )
            else if(message.itemType === "errormessage")
                return (
                    <div className="message ai error" key={message.id}>
                        <div className="content">
                            <Icon name="lemon"/>{message.text}
                        </div>
                    </div>
                )
            else if(message.itemType === "image")
                return(
                    <div className="message ai" key={message.id}>
                        <div className="content">{message.text}
                            <div className="response-3dmodel">
                                <Segment>
                                    <Loader active={message.state==="pending"}>{message.stateMessage}</Loader>
                                    {message.state==="pending" ? (
                                        message.attachment === null || message.attachment === "" ? (
                                            <Placeholder style={{height: "256px", width: "256px"}}>
                                                <PlaceholderImage square />
                                            </Placeholder>
                                        ) : (
                                            <StorageImage alt="image" path={message.attachment} />
                                        )
                                    ) : <StorageImage alt="image" path={message.attachment} /> }
                                </Segment>
                            </div>
                        </div>
                    </div>
                )
            else if(message.itemType === "3dmodel")
            {
                getUrl({
                    path: filePrefix+message.id+".step",
                    // Alternatively, path: ({identityId}) => `album/{identityId}/1.jpg`
                  }).then(linkToStorageFile => {
                    console.log('signed URL: ', linkToStorageFile.url);
                    console.log('URL expires at: ', linkToStorageFile.expiresAt);
                  });
                return(
                    <div className="message ai" key={message.id}>
                        <div className="content">{message.text}
                            <div className="response-3dmodel">
                                <Segment>
                                    <ModelViewer fileName={message.attachment} />
                                </Segment>
                            </div>
                            <div className="response-3dmodel">
                                <Button as="a" href="{}"></Button>
                            </div>
                            <div className="response-actions">
                                <i className="thumbs up outline icon"></i>
                                <i className="thumbs down outline icon"></i>
                                <i className="refresh icon"></i>
                            </div>
                        </div>
                    </div>
                )
            }
            else if(message.itemType === "cadfiles")
            {
                return(
                    <div className="message ai" key={message.id}>
                        <div className="content">{message.text}
                            <div className="response-3dmodel">
                                <FileDownloadButton fileName={filePrefix+message.id+".csg"} text="Download CSG file" />
                            </div>
                        </div>
                    </div>
                )
            }            
            return null;
        })}
        </>
    );
}

export default ChatMessageAI;