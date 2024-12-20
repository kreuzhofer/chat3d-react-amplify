import type { Schema } from "../../amplify/data/resource";

function ChatMessageUser(item: Schema["ChatItem"]["type"])
{
    return (
        <div className="message user">
            <div className="content">{item.message}</div>
        </div>
    );
}

export default ChatMessageUser;