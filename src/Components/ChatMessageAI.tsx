import type { Schema, IChatMessage } from "../../amplify/data/resource";
import { Loader, Segment, Icon, Placeholder, PlaceholderImage } from "semantic-ui-react";
import { StorageImage } from '@aws-amplify/ui-react-storage';
import ModelViewer from "./ModelViewer";

function ChatMessageAI(item: Schema["ChatItem"]["type"])
{
    const messages = item.messages ? JSON.parse(item.messages as string) as IChatMessage[] : [];

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
            {
                console.log("attachment", message.attachment);
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
                                    ) : null }
                                </Segment>
                            </div>
                        </div>
                    </div>
                )
            }
            else if(message.itemType === "3dmodel")
            {
                return(
                    <div className="message ai" key={message.id}>
                        <div className="content">{message.text}
                            <div className="response-3dmodel">
                                <Segment>
                                    <ModelViewer fileName={message.attachment} />
                                </Segment>
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
            return null;
        })}
        </>
    );
}

export default ChatMessageAI;