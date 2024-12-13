import type { Schema } from "../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import ChatMessage from "../Components/ChatMessage";
import { useEffect, useState } from "react";

const client = generateClient<Schema>();

function Chat()
{
    const [chatMessages, setChatMessages] = useState<Array<Schema["ChatItem"]["type"]>>([]);

    useEffect(() => {
        client.models.ChatItem.observeQuery().subscribe({
            next: (data) => setChatMessages([...data.items]),
        });
/*
        setChatMessages(
            [
                 {
                     id: "0", context: "1", itemType: "message", role: "user", message: "Hello!",
                     createdAt: "",
                     updatedAt: ""
                 },
                 {
                     id: "1", context: "1", itemType: "message", role: "ai", message: "Hello, I am your AI 3D designer. What can I create for you today?",
                     createdAt: "",
                     updatedAt: ""
                 },
                 {
                    id: "2", context: "1", itemType: "message", role: "user", message: "Can you create a 3d model of a candle stand?",
                    createdAt: "",
                    updatedAt: ""
                },
                {
                    id: "3", context: "1", itemType: "message", role: "ai", message: "Sure! let me create the model for you. This may take about one minute...",
                    createdAt: "",
                    updatedAt: ""
                },
                {
                    id: "4", context: "1", itemType: "image", role: "ai", message: "This is what I created for you, do you like it?",
                    attachment: "images/candleStand.png",
                    createdAt: "",
                    updatedAt: ""
                },
                {
                    id: "5", context: "1", itemType: "message", role: "user", 
                    message: "Yes! can I please have an STL file of this?",
                    createdAt: "",
                    updatedAt: ""
                },
                {
                    id: "6", context: "1", itemType: "message", role: "ai", 
                    message: "Sure! let me render the STL for you. This may take between 1 and 5 minutes. You can also close the app and I'll notify you when it's ready.",
                    createdAt: "",
                    updatedAt: ""
                },
                {
                    id: "7", context: "1", itemType: "stl", role: "ai", message: "This is what I created for you, do you like it?",
                    attachment: "images/candleStand.png",
                    createdAt: "",
                    updatedAt: ""
                },
                {
                    id: "8", context: "1", itemType: "message", role: "ai", 
                    message: "Can I do anything else for you?",
                    createdAt: "",
                    updatedAt: ""
                },
            ]);
              */
    }, []);

    return (
        <div>
            <div className="ui container">
                <h2 className="ui header">AI Chat</h2>
                <div className="chat-container">
                    {chatMessages.map((item) => (
                        <ChatMessage {...item} />
                    ))}
                </div>
                <div className="input-container">
                    <div className="ui input input">
                        <input type="text" placeholder="Type a message..." />
                    </div>
                    <button className="ui primary button">Send</button>
                </div>
            </div>
        </div>
    );
}

export default Chat;