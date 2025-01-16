import type { Schema, IChatMessage } from "../../amplify/data/resource";
import { Loader, Segment, Icon, Placeholder, PlaceholderImage } from "semantic-ui-react";
import { StorageImage } from '@aws-amplify/ui-react-storage';
import ModelViewer from "./ModelViewer";
import FileDownloadButton from "./FileDownloadButton";
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatMessageAIProps {
    item: Schema["ChatItem"]["type"];
    onRefreshClick: (id: string) => void;
}

const ChatMessageAI: React.FC<ChatMessageAIProps> = ({item, onRefreshClick}) =>
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
                            <Markdown remarkPlugins={[remarkGfm]}>{message.text}</Markdown>
                            <Loader active={message.state==="pending"} inline />
                        </div>
                    </div>
                )
            else if(message.itemType === "errormessage")
                return (
                    <div className="message ai error" key={message.id}>
                        <div className="content">
                            <Icon name="lemon"/>
                            <Markdown remarkPlugins={[remarkGfm]}>{message.text}</Markdown>
                        </div>
                    </div>
                )
            else if(message.itemType === "image")
                return(
                    <div className="message ai" key={message.id}>
                        <div className="content">
                            <Markdown remarkPlugins={[remarkGfm]}>{message.text}</Markdown>
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
                return(
                    <div className="message ai" key={message.id}>
                        <div className="content">
                            <Markdown remarkPlugins={[remarkGfm]}>{message.text}</Markdown>
                            <div className="response-3dmodel">
                                <Segment>
                                    <ModelViewer fileName={message.attachment} />
                                </Segment>
                            </div>
                            <div className="response-3dmodel">
                                <FileDownloadButton fileName={filePrefix+message.id+".3mf"} text="Download 3MF file" />
                                <FileDownloadButton fileName={filePrefix+message.id+".csg"} text="Download CSG file" />
                            </div>
                            <div className="response-actions">
                                <i className="thumbs up outline icon"></i>
                                <i className="thumbs down outline icon"></i>
                                <Icon link name="refresh" onClick={()=>onRefreshClick(item.id)}></Icon>
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