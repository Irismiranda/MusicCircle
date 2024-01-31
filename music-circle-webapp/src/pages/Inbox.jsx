import React, { useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Axios } from "../Axios-config"
import { getUser, useClickOutside } from "../utils"
import { ShareMenu, InboxChatList, InboxMessage } from "../components"
import { SvgSendBtn } from "../assets"
import { EmojiBar } from "../components"
import useStore from "../store"

    export default function Inbox(){
        const { standardWrapperWidth } = useStore()
        const { socket, loggedUser } = useStore()
        const [ chatId, setChatId ] = useState(null)
        const [ messages, setMessages ] = useState([])
        const [ privateChatList, setPrivateChatList ] = useState(null)
        const [ userData, setUserData ] = useState(null)
        const [ showShareMenu, setShowShareMenu ] = useState(false)
        const [ isLoading, setIsLoading ] = useState(false)
        const [ loadingChatList, setLoadingChatList] = useState(true)

        const [params, setSearchParams] = useSearchParams()
        
        const privateChatListWrapperRef = useRef(null)
        const prevChatId = useRef(null)
        const shareMenuRef = useRef(null)
        const shareMenuBtnRef = useRef(null)
        const textAreaRef = useRef(null)
        const messagesRef = useRef(null)

        useClickOutside(shareMenuRef, [shareMenuBtnRef], () => setShowShareMenu(false))

        async function getPrivateChatsList(){
            setLoadingChatList(true)
            const response = await Axios.get(`/api/${loggedUser.id}/inbox`)
            if(response.data.length > 0){
                setPrivateChatList(response.data)
            }
            setLoadingChatList(false)
        }

        async function sendMessage(){
            const messageData = {
                text: textAreaRef.current.value,
                sender: loggedUser.id,
                time_stamp: Math.floor(Date.now() / 1000),
            }

            textAreaRef.current.value = ""

            Axios.post('/api/send_inbox_message', { user_ids: [loggedUser.id, userData.id], message_data: messageData, recipients: [userData.id]})
        }

        useEffect(() => {
            getPrivateChatsList()
        }, [])

        useEffect(() => {
            setMessages(null)
            if(chatId){
                setIsLoading(true)
                socket?.emit('connectToPrivateChat', { chat_id: chatId })
                socket?.emit('connectToPrivateChatNotifications', { user_id: loggedUser.id })
            } 

            if(prevChatId.current && prevChatId.current !== chatId){
                socket?.emit('disconnectPrivateChat', { chat_id: prevChatId.current })
            } 

            return () => {
                socket?.emit('disconnectPrivateChatNotifications', { user_id: loggedUser.id })
            }
        }, [chatId])

        useEffect(() => {
            socket?.on('loadAllPrivateChatMessages', (data) => {
                if(data){
                    setMessages(data.messages)
                    const recipientId = data.user_ids.filter(user => user !== loggedUser.id)
                    getUser(recipientId[0], setUserData)
                    prevChatId.current = chatId
                    setIsLoading(false)
                }
            })

            return () => {
                socket?.off('loadAllPrivateChatMessages')
            } 
        }, [])

        useEffect(() => {
            socket?.on('loadNewPrivateChatMessage', (data) => {
                setMessages(prevMessages => {
                    if (prevMessages.some(message => message.message_id === data.message_id)) {
                        return prevMessages
                        .map(item => item.message_id === data.message_id ? data : item)
                    } else {
                        return [...prevMessages, data]
                    }
                })
            })

            return () => {
                socket?.off('loadNewPrivateChatMessage')
            }
        }, [])

        useEffect(() => {
            socket?.on('loadNewPrivateChatNotification', (data) => {
                setPrivateChatList(prevData => prevData
                    .map(item => item.id === data.id ? data : item ))
            })

            return () => {
                socket?.off('loadNewPrivateChatNotification')
            }
        }, [])
        
        useEffect(() => {
            const chatParam = params?.get('chat')
            if(chatParam && privateChatList?.some(chat => chat.chat_id === chatParam)){
                setIsLoading(true)
                setChatId(chatParam)
                setSearchParams({})
            }
        }, [params, privateChatList])
        
        return(
            <section
            ref={privateChatListWrapperRef}
            style={{ width: standardWrapperWidth, height: "calc(100vh - 100px)", gap: "0px" }}
            className="wrapper flex inbox_chat">
                {(privateChatList || isLoading) &&
                <div
                className="flex flex_column inbox_chat_list full_height">
                    { privateChatList?.map(item => {
                        return (
                            <InboxChatList 
                            placeholderAreaRef={privateChatListWrapperRef}
                            loadingChatList={loadingChatList}
                            item={item}
                            setChatId={setChatId}
                            currentChatId={chatId}/>
                            )
                        })
                    }
                   
                </div>}

                <div
                style={{ paddingRight: "10px", height: "calc(100vh - 100px)" }}
                className="full_width">
                    {(userData && !isLoading) &&
                        <section 
                        className="inbox_header_section flex align_center full_width">
                            <Link className="flex" to={`/account/${userData.id}`}>
                                <img className="profile_medium" src={`${userData.imgUrl}`}/>
                                <h3 style={{ fontWeight: "500" }}>{userData.name}</h3>
                            </Link>
                        </section>
                    }

                    {isLoading &&
                    <section 
                    className="flex inbox_header_section">
                        <div className="profile_medium loading_shimmer"> </div>
                        <div className="flex flex_column align_start"> 
                            <div className="text_medium_placeholder loading_shimmer"> </div>
                            <div className="text_small_placeholder loading_shimmer"> </div>
                        </div>
                    </section>
                    }

                    {(userData || isLoading) && <hr />}

                    {(messages?.length > 0 && !isLoading) &&
                    <div 
                    ref={messagesRef}
                    className="flex align_start inbox_chat_message_wrapper"
                    style={{ 
                        padding: "20px", 
                        height: `calc(100% - 210px)`, 
                        flexDirection: "column-reverse", 
                        }}>
                        {messages
                        .sort((a, b) => (a?.time_stamp > b?.time_stamp ? -1 : 1))
                        .map(message => {
                            return (
                                <InboxMessage 
                                message={message}/>
                            )
                        })}
                    </div>} 

                    {(!chatId && !isLoading) &&
                        <div 
                        className="flex flex_column align_center gap full_height justify_center">
                            <h1>Your messages</h1>
                            <h5>Why not say hi to a friend?</h5>
                            <button 
                            ref={shareMenuBtnRef}
                            onClick={() => setShowShareMenu(!showShareMenu)}>Send Message</button>
                        </div>
                    }
                    
                    {isLoading &&
                        <section 
                        className="inbox_chat_message_wrapper loading full_width"
                        style={{ 
                            height: `calc(100% - 170px)`, 
                            flexDirection: "column-reverse", 
                            }}>
                        </section>
                    }
               
                    {chatId && 
                    <div
                        className="flex align_center full_width"
                        style={{ padding: "0 20px" }}>
                            <textarea 
                            ref={textAreaRef}
                            className="share_menu_textarea"
                            placeholder="Say something cool..."/>
                            <div 
                            className="flex align_center text_area_btns">
                                <EmojiBar
                                textAreaRef={textAreaRef}/>
                                <SvgSendBtn
                                className="send_btn"
                                onClick={() => sendMessage()}/>
                            </div>
                        </div>}
                </div>

                {showShareMenu &&
                <section
                className="relative">
                    <div 
                    ref={shareMenuRef}
                    className="share_menu_wrapper wrapper windowed">
                        <ShareMenu 
                        closeMenu={() => setShowShareMenu(false)}
                        isPost={false}
                        getPrivateChatsList={getPrivateChatsList}
                        setPrivateChatList={setPrivateChatList}/>
                        
                    </div>
                </section>
                }
            
        </section>
       
        )
    }
