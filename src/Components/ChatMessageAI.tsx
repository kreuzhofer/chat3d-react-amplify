import type { Schema, ChatMessage } from "../../amplify/data/resource";
import { Loader, Segment, Icon } from "semantic-ui-react";
import { StorageImage } from '@aws-amplify/ui-react-storage';


function ChatMessageAI(item: Schema["ChatItem"]["type"])
{
    const messages = item.messages ? JSON.parse(item.messages as string) as ChatMessage[] : [];

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
                                    <StorageImage alt="cat" path={message.attachment} />
                                    {/* <Image className="response-image" src={message.attachment}/> */}
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
            else if(message.itemType === "stl")
                return(
                    <div className="message ai" key={message.id}>
                        <div className="content">{message.text}
                            <div className="response-actions">
                                <a href="images/candleStand.stl" download="candleStand.stl" className="ui primary button">Download STL</a>
                            </div> 
                            <div className="response-actions">
                                <i className="thumbs up outline icon"></i>
                                <i className="thumbs down outline icon"></i>
                            </div>
                        </div>
                    </div>
                )
            return null;
        })}
        </>
    );
}

export default ChatMessageAI;