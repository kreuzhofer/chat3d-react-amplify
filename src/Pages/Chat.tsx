import type { Schema } from "../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import ChatMessage from "../Components/ChatMessage";
import { useEffect, useState } from "react";
import { Button, Input } from 'semantic-ui-react'
import { useParams, useNavigate } from "react-router";
// import { getCurrentUser } from 'aws-amplify/auth';

const client = generateClient<Schema>();

function Chat()
{
    const [chatMessages, setChatMessages] = useState<Array<Schema["ChatItem"]["type"]>>([]);
    const [query, setQuery] = useState<string>("");
    const [chatContext, setChatContext] = useState<any>(null);
    const navigate = useNavigate();

    var params = useParams();
    if(params.chatId !== undefined)
    {
        var chatId = params.chatId;
    }

    // try {
    //     getCurrentUser().then((user) => {  
    //         console.log("user", user);
    //         if(user !== null)
    //         {
    //             var username = user.username;
    //             console.log("username", username);
    //         }
    //     });
    // } catch (error) {
    //     console.error("error fetching user", error);
    // }

    async function submitChatBackendCall()
    {
        if(chatContext === null && chatId === undefined)
        {
            const chatContextCreate = await client.models.ChatContext.create({ name: "unnamed chat" });
            setChatContext(chatContextCreate.data);
            console.log("chat context data: "+JSON.stringify(chatContextCreate.data));
            console.log("chat context created: "+chatContextCreate.data?.id);
            console.log("chat context owner: "+chatContextCreate.data?.owner);
            navigate("/chat/"+chatContextCreate.data?.id);
        }
        if(chatContext === null && chatId !== undefined)
        {
            const chatContextGet = await client.models.ChatContext.get({ id: chatId });
            setChatContext(chatContextGet.data);
            console.log("chat context retrieved: "+chatContextGet.data?.id);
            const fetchChatItems = await chatContextGet.data?.chatItems();
            const sortedItems = fetchChatItems?.data.sort((a, b) => (a.createdAt > b.createdAt) ? 1 : -1);
            setChatMessages(sortedItems ? [...sortedItems] : []);
        }
        if(chatContext !== null)
        {
            var result = await client.queries.submitQuery({chatContextId: chatContext.id, query: query });
            console.log(JSON.stringify(result));
        }
    }

    useEffect(() => {
        client.models.ChatItem.observeQuery({
            filter: { chatContextId: { eq: chatId } },
            }).subscribe({
            next: (data) => {
                const sortedItems = data.items.sort((a, b) => (a.createdAt > b.createdAt) ? 1 : -1);
                setChatMessages([...sortedItems])
                console.log("data.items: "+data.items);
            },
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
                        <Input 
                            type="text" 
                            placeholder="Type a message..." 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={(e: { key: string; }) => {
                                if (e.key === "Enter") {
                                    submitChatBackendCall();
                                }
                            }}
                        />
                    </div>
                    <Button 
                        className="ui primary button"
                        onClick={submitChatBackendCall}
                    >
                        Send
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default Chat;