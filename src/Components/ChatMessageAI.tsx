import type { Schema } from "../../amplify/data/resource";
import { Image } from "semantic-ui-react";

function ChatMessageAI(item: Schema["ChatItem"]["type"])
{
    if(item.itemType === "message")
    return (
        <div className="message ai">
            <div className="content">{item.message}</div>
        </div>
    )
    else if(item.itemType === "image")
    return(
        <div className="message ai">
            <div className="content">{item.message}
                <div className="response-3dmodel">
                    <Image className="response-image" src={item.attachment}/>
                </div>
                <div className="response-actions">
                    <i className="thumbs up outline icon"></i>
                    <i className="thumbs down outline icon"></i>
                    <i className="refresh icon"></i>
                </div>  
            </div>
        </div>
    )
    else if(item.itemType === "stl")
    return(
        <div className="message ai">
            <div className="content">{item.message}
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
}

export default ChatMessageAI;