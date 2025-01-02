import type { Schema } from "../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import ChatMessage from "../Components/ChatMessage";
import { useEffect, useState, useRef } from "react";
import { Button, Icon, Input, Image, Menu, MenuItem, Popup, Sidebar, SidebarPushable, SidebarPusher } from 'semantic-ui-react'
import { useParams, useNavigate, NavLink } from "react-router";
import { v4 as uuidv4 } from 'uuid';
import outputs from "../../amplify_outputs.json";
import { fetchUserAttributes, getCurrentUser, signOut } from "aws-amplify/auth";

const client = generateClient<Schema>();

function Chat()
{
    const [chatMessages, setChatMessages] = useState<Array<Schema["ChatItem"]["type"]>>([]);
    const [query, setQuery] = useState<string>("");
    const chatContextRef = useRef<any>(null);
    const chatIdRef = useRef<string>("");
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [subScriptions] = useState<any[]>([]);
    const [chatContexts, setChatContexts] = useState<Array<Schema["ChatContext"]["type"]>>([]);
    const [sideOverlayVisible, setSideOverlayVisible] = useState<boolean>(true);
    const chatAreaRef = useRef<HTMLDivElement | null>(null);
    const [user, setUser] = useState<any>(null);
    const [userAttributes, setUserAttributes] = useState<any>(null);

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

    const getUser = async () => {
        const user = await getCurrentUser();
        if (user) setUser(user);
        console.log(user);
        const attributes = await fetchUserAttributes();
        if(attributes) {
            console.log(attributes);
            setUserAttributes(attributes);
        }
    };

    useEffect(() => {

        // try {
        //     console.log("user from useAuthenticator", user);
        //     console.log("user attributes: "+JSON.stringify(user?.attributes));
        //     getCurrentUser().then((user) => {  
        //         console.log("user", user);
        //         if(user !== null)
        //         {
        //             var username = user.username;
        //             console.log("username", username);
    
        //             fetchUserAttributes().then((attributes) => {
        //                 console.log("attributes", attributes);
        //             });
        //         }
        //         const user = await Auth.currentUserInfo();

        //     });
        // } catch (error) {
        //     console.error("error fetching user", error);
        // }
        getUser();

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
            subScriptions.push(subscription);
        }

        const chatContextSubscription = client.models.ChatContext.observeQuery().subscribe({
            next: (data) => {
                const sortedItems = data.items.sort((a, b) => (a.createdAt < b.createdAt) ? 1 : -1);
                setChatContexts([...sortedItems]);
            },
        });
        subScriptions.push(chatContextSubscription);

        return ()=>{
            subScriptions.forEach((subscription) => {
                subscription.unsubscribe()
                console.log("subscription removed");
            });
            subScriptions.length = 0;
        };
    }, [chatIdRef.current]);

    return (
            <>
            <SidebarPushable>
                <Sidebar
                    animation="overlay"
                    visible={sideOverlayVisible}
                    onHide={() => setSideOverlayVisible(false)}
                    className="chat-sidebar"
                    target={chatAreaRef.current || undefined}
                >

                <div className="top-menubar">
                    <Popup trigger={
                        <Icon bordered link name="columns" onClick={() => setSideOverlayVisible(!sideOverlayVisible)} />
                    }>Close sidebar</Popup>
                </div>
                <Menu vertical borderless fluid>
                    <MenuItem as={NavLink}
                        to="/chat/new">
                        <Icon name="edit"/>
                        New Chat
                    </MenuItem>
                </Menu>
                <Menu vertical borderless fluid className="chat-contexts">
                    {chatContexts.map((item) => (
                        <MenuItem as={NavLink}
                            to={"/chat/"+item.id}
                            key={item.id}>
                            <div className="hover-content">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                    <span>{item.name}</span>
                                    <Popup
                                        contentStyle={{ display: 'flex', justifyContent: 'flex-end' }}
                                        trigger={<Icon name="ellipsis horizontal" onClick={(e: { preventDefault: () => any; }) => e.preventDefault()} />}
                                        on='click'
                                        position='right center'
                                        hideOnScroll
                                    >
                                        <Menu>
                                            <MenuItem onClick={(e) => e.preventDefault()}>
                                                <Icon name="edit"/>
                                                Rename
                                            </MenuItem>
                                            <MenuItem onClick={(e) => e.preventDefault()}>
                                                <Icon name="trash"/>
                                                Delete
                                            </MenuItem>
                                        </Menu>
                                    </Popup>
                                </div>
                            </div>   
                            <div className="default-content">
                                {item.name}
                            </div> 
                        </MenuItem>
                    ))}
                </Menu>

                <div className="footer-menubar">
                    <div className="settings">
                        <Popup trigger={<Icon bordered link name="setting"/>}>Settings</Popup>
                    </div>
                    <div className="spacer"></div>
                    <div className="user">
                        <Popup on={"click"} trigger={
                            <Image avatar src={userAttributes?.picture} />
                            } hideOnScroll>
                            <Menu vertical borderless fluid>
                                <MenuItem onClick={() => signOut()}>
                                    <Icon name="sign-out"/>
                                    Sign out
                                </MenuItem>
                            </Menu>
                        </Popup>
                    </div>
                </div>

                </Sidebar>
                <SidebarPusher>

            <div className={sideOverlayVisible ? "chat-grid" : "chat-grid full-width"} ref={chatAreaRef}>
                <div className="top-menubar">
                    <div className="chat-buttons-left" style={{display: !sideOverlayVisible ? "block" : "none"}}>
                        <Popup trigger={
                            <Icon bordered link name="columns" 
                                onClick={() => setSideOverlayVisible(!sideOverlayVisible)} />
                        }>Open sidebar</Popup>
                        <Popup trigger={
                            <Icon bordered link name="edit" 
                                onClick={() => navigate("/chat/new")} />
                        }>New chat</Popup>
                    </div>
                    <img src="/images/chat3dlogo.png" height={30} width={30}/>
                    <div className="chat-title">
                        Chat3D
                    </div>
                </div>
                <div className="chat-container" style={{display: chatIdRef.current === "" ? "none" : "block"}}>
                    {chatMessages.map((item) => (
                        <ChatMessage {...item} key={item.id} />
                    ))}
                    <div ref={messagesEndRef}></div>
                </div>
                {chatMessages.length === 0 ? (
                    <div className="chat-welcome">
                        What can I create for you?
                    </div>
                ) : null}
                <div className="input-container">
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
                                
            </SidebarPusher>
            </SidebarPushable>
        </>
    );
}

export default Chat;