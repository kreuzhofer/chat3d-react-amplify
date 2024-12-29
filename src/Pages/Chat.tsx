import type { Schema } from "../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import ChatMessage from "../Components/ChatMessage";
import { useEffect, useState, useRef } from "react";
import { Button, Container, Input } from 'semantic-ui-react'
import { useParams, useNavigate } from "react-router";
import { v4 as uuidv4 } from 'uuid';
import outputs from "../../amplify_outputs.json";
// import { getCurrentUser } from 'aws-amplify/auth';

const client = generateClient<Schema>();

function Chat()
{
    const [chatMessages, setChatMessages] = useState<Array<Schema["ChatItem"]["type"]>>([]);
    const [query, setQuery] = useState<string>("");
    const chatContextRef = useRef<any>(null);
    const chatIdRef = useRef<string>("");
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const handleScrollToBottom = () => {
        //
        messagesEndRef.current?.scrollIntoView();
      };

    var params = useParams();
    if(params.chatId !== undefined)
    {
        if(chatIdRef.current !== params.chatId)
            chatIdRef.current = (params.chatId);
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

    async function submitChatBackendCall() {
        console.log("submitChatBackendCall");
        console.log("chatId: "+chatIdRef.current);
        console.log("chatContext: "+JSON.stringify(chatContextRef.current));
        if(chatIdRef.current === "new")
            chatIdRef.current = "";
        if (chatContextRef.current === null && chatIdRef.current === "") {
            console.log("No context and no chatId");
            const chatContextCreate = await client.models.ChatContext.create({ name: "unnamed chat" });
            if(chatContextCreate.data)
            {
                chatIdRef.current = chatContextCreate.data.id;
                chatContextRef.current = chatContextCreate.data;
            }
            console.log("chat context data: " + JSON.stringify(chatContextCreate.data));
            console.log("chat context created: " + chatContextCreate.data?.id);
            console.log("chat context owner: " + chatContextCreate.data?.owner);
            navigate("/chat/" + chatContextRef.current.id);
        }

        if(chatContextRef.current !== null)
        {
            setQuery(""); // remove last query
            var { newUserChatItem, newAssistantChatItem } = await createNewChatItems(chatContextRef.current.id);
            var result = await client.queries.submitQuery({
                chatContextId: chatContextRef.current.id, 
                query: query, 
                newUserChatItemId: newUserChatItem.data?.id, 
                newAssistantChatItemId: newAssistantChatItem.data?.id,
                executorFunctionName: outputs.custom.openscadExecutorFunctionWithImageName,
                bucket: outputs.storage.bucket_name
             });
            console.log("ChatQueryResult: "+JSON.stringify(result));
        }

        async function createNewChatItems(chatContextId: string) {
            console.log("creating new chat items for context: " + chatContextId);
            var newUserChatItem = await client.models.ChatItem.create({
                chatContextId: chatContextId, role: "user",
                messages: JSON.stringify([
                    {
                        id: uuidv4(),
                        text: query,
                        itemType: "message",
                        state: "completed",
                        stateMessage: ""
                    }
                ])
            });
            if(newUserChatItem.errors)
                console.log(newUserChatItem.errors);
            var newAssistantChatItem = await client.models.ChatItem.create({
                chatContextId: chatContextId, role: "assistant",
                messages: JSON.stringify([
                    {
                        id: uuidv4(),
                        text: "",
                        itemType: "message",
                        state: "pending",
                        stateMessage: "thinking..."
                    }
                ])
            });
            if(newAssistantChatItem.errors)
                console.log(newAssistantChatItem.errors);

            console.log("created new chat items: " + newUserChatItem.data?.id + " and " + newAssistantChatItem.data?.id);
            return { newUserChatItem, newAssistantChatItem };
        }
    }

    useEffect(() => {

        async function fetchChatContext()
        {
            const chatContextGet = await client.models.ChatContext.get({ id: chatIdRef.current });
            chatContextRef.current = chatContextGet.data;
            console.log("Chat context auto loaded")
            handleScrollToBottom();
        }

        console.log("chatId in useEffect: "+chatIdRef.current);
        if(chatIdRef.current === "new")
        {
            chatContextRef.current = null;
            chatIdRef.current = "";
            setChatMessages([]);
            navigate("/chat");
        }

        if(chatIdRef.current !== "" && chatContextRef.current === null)
        {
            fetchChatContext();
        }

        if(chatIdRef.current !== "")
        {
            const subscription = client.models.ChatItem.observeQuery({
                filter: { chatContextId: { eq: chatIdRef.current } },
                }).subscribe({
                next: (data) => {
                    const sortedItems = data.items.sort((a, b) => (a.createdAt > b.createdAt) ? 1 : -1);
                    setChatMessages([...sortedItems])
                    console.debug("data.items: "+JSON.stringify(data.items));
                    handleScrollToBottom();
                },
            });
            console.log("ChatItem subscription created");
            return ()=>{
                subscription.unsubscribe()
                console.log("ChatItem subscription removed");
            };
        }
        else return ()=>{};
    }, [chatIdRef.current]);

    return (
        <div>
            <div className="ui container">
                <div className="chat-container">
                    {chatMessages.map((item) => (
                        <ChatMessage {...item} key={item.id} />
                    ))}
                </div>
                {chatMessages.length === 0 ? (
                    <Container>
                        <div className="chat-welcome">
                            What can I create for you today?
                        </div>
                    </Container>
                ) : null}
                <div className="input-container" ref={messagesEndRef}>
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