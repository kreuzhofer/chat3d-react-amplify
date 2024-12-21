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
    const [chatId, setChatId] = useState<string>("");
    const navigate = useNavigate();

    var params = useParams();
    if(params.chatId !== undefined)
    {
        if(params.chatId !== chatId)
            setChatId(params.chatId);
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
        if(chatContext === null && chatId === "")
        {
            console.log("No context and no chatId");
            const chatContextCreate = await client.models.ChatContext.create({ name: "unnamed chat" });
            setChatContext(chatContextCreate.data);
            console.log("chat context data: "+JSON.stringify(chatContextCreate.data));
            console.log("chat context created: "+chatContextCreate.data?.id);
            console.log("chat context owner: "+chatContextCreate.data?.owner);
            // create user message immetiately
            var newUserChatItem = await client.models.ChatItem.create({ chatContextId: chatContextCreate.data?.id, role: "user", message: query, itemType: "message" });
            var newAssistantChatItem = await client.models.ChatItem.create({ chatContextId: chatContextCreate.data?.id, role: "assistant", message: "", itemType: "message", state: "pending" });
            setQuery(""); // remove last query
            var result = await client.queries.submitQuery({chatContextId: chatContextCreate.data?.id, query: query, newUserChatItemId: newUserChatItem.data?.id, newAssistantChatItemId: newAssistantChatItem.data?.id });
            console.log("ChatQueryResult: "+JSON.stringify(result));

            // navigate to new context
            navigate("/chat/"+chatContextCreate.data?.id);
        }
        if(chatContext === null && chatId !== "")
        {
            console.log("No context but chatId");
            const chatContextGet = await client.models.ChatContext.get({ id: chatId });
            setChatContext(chatContextGet.data);
            console.log("chat context retrieved: "+chatContextGet.data?.id);
            const fetchChatItems = await chatContextGet.data?.chatItems();
            const sortedItems = fetchChatItems?.data.sort((a, b) => (a.createdAt > b.createdAt) ? 1 : -1);
            setChatMessages(sortedItems ? [...sortedItems] : []);
        }
        if(chatContext !== null)
        {
            var newUserChatItem = await client.models.ChatItem.create({ chatContextId: chatContext.id, role: "user", message: query, itemType: "message" });
            var newAssistantChatItem = await client.models.ChatItem.create({ chatContextId: chatContext.id, role: "assistant", message: "", itemType: "message", state: "pending" });
            setQuery(""); // remove last query
            var result = await client.queries.submitQuery({chatContextId: chatContext.id, query: query, newUserChatItemId: newUserChatItem.data?.id, newAssistantChatItemId: newAssistantChatItem.data?.id });
            console.log("ChatQueryResult: "+JSON.stringify(result));
        }
    }

    useEffect(() => {

        async function fetchChatContext()
        {
            const chatContextGet = await client.models.ChatContext.get({ id: chatId });
            setChatContext(chatContextGet.data);
            console.log("Chat context auto loaded")
        }

        console.log("chatId in useEffect: "+chatId);
        if(chatId !== "")
        {
            fetchChatContext();
        } else setChatContext(null);

        if(chatId !== "")
        {
            const subscription = client.models.ChatItem.observeQuery({
                filter: { chatContextId: { eq: chatId } },
                }).subscribe({
                next: (data) => {
                    const sortedItems = data.items.sort((a, b) => (a.createdAt > b.createdAt) ? 1 : -1);
                    setChatMessages([...sortedItems])
                    console.log("data.items: "+JSON.stringify(data.items));
                },
            });
            console.log("ChatItem subscription created");
            return ()=>{
                subscription.unsubscribe()
                console.log("ChatItem subscription removed");
            };
        }
        else return ()=>{};
    }, [chatId]);

    return (
        <div>
            <div className="ui container">
                <h2 className="ui header">AI Chat</h2>
                <div className="chat-container">
                    {chatMessages.map((item) => (
                        <ChatMessage {...item} key={item.id} />
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
                            onSend={submitChatBackendCall}
                            
                        >
                            <input />
                            <Button onClick={submitChatBackendCall}>Send</Button>
                        </Input>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Chat;