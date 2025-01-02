import type { Schema, IChatMessage } from "../../amplify/data/resource";

function ChatMessageUser(item: Schema["ChatItem"]["type"])
{
    const messages = item.messages ? JSON.parse(item.messages as string) as IChatMessage[] : [];

    return (
        <>
            {messages.map((message) => (
                <div className="message user" key={message.id}>
                    <div className="content">{message.text}</div>
                </div>
            ))}
        </>
    );
}

export default ChatMessageUser;