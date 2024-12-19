import type { Schema } from "../../amplify/data/resource";
import ChatMessageAI from "./ChatMessageAI";
import ChatMessageUser from "./ChatMessageUser";

function ChatMessage(item: Schema["ChatItem"]["type"])
{
    if(item.role === "user")
    return (
        <ChatMessageUser {...item} />
    )
    else if(item.role === "assistant")
    return (
        <ChatMessageAI {...item} />
    );
}

export default ChatMessage;