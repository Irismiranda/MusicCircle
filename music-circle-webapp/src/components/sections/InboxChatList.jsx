import React, { useEffect, useRef, useState } from "react"
import { getUser } from "../../utils"
import useStore from "../../store"
import { Axios } from "../../Axios-config"
import { Link } from "react-router-dom"

export default function InboxChatList(props){   
    const { item, setChatId, currentChatId, loadingChatList, placeholderAreaRef } = props
    const { loggedUser } = useStore()
    const [userData, setUserData] = useState(null)
    const [lastMessage, setLastMessage] = useState(null)
    const [isMarkedAsRead, setIsMarkedAsRead] = useState(true)
    const [isSelected, setIsSelected] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    async function getLastMessage(chat_id){
        const response = await Axios.get(`/api/${chat_id}/inbox/private_chat/last_message`)
        setLastMessage(response.data)
        setIsLoading(false)
    }

    async function markAsRead(){
        await Axios.post(`api/${loggedUser.id}/toggle_marked_as_read/${lastMessage.notification_id}`)
        setIsMarkedAsRead(true)
    }

    useEffect(() => {
        if(item){
            setIsLoading(true)
            const recipientId = item.user_ids.filter(id => id !== loggedUser.id)[0]
            getUser(recipientId, setUserData)
            getLastMessage(item.chat_id)
        }
    }, [item])

    useEffect(() => {
        if(lastMessage && !lastMessage?.marked_as_read && lastMessage?.sender !== loggedUser.id){
            setIsMarkedAsRead(false)
        }  
    }, [lastMessage])
    
    useEffect(() => {
        if(currentChatId === item?.chat_id){
            setIsSelected(true)
        } else if(isSelected){
            setIsSelected(false)
        }
    }, [currentChatId])


    useEffect(() => {
        if(currentChatId === item?.chat_id && !isMarkedAsRead && lastMessage){
            markAsRead()  
        }
    }, [lastMessage, currentChatId])


    return !loadingChatList ? (
        <>
        {!isLoading ?
        <section
        className={ `${!isMarkedAsRead && "notification_section"} ${isSelected && "selected_section"} pointer relative` }
        onClick={() => setChatId(item.chat_id)}
        key={item.chat_id}>
            <div>
                <div 
                className="flex relative"
                style={{ zIndex: "1" }}>  
                <Link to={`/account/${userData?.id}`}>
                    {
                    userData?.imgUrl ? 
                    <img 
                    className="profile_small"
                    src={userData?.imgUrl}/> :
                    <div className="profile_small"></div>
                    }
                </Link>  
                    <div>
                        <h3>
                            {userData?.name}
                        </h3>
                        <p>
                            {lastMessage?.sender === loggedUser.id ? 
                            "You: " : `${userData?.name}: `}
                            {lastMessage?.text}
                        </p>
                        <h6>{new Date(lastMessage?.time_stamp * 1000).toLocaleString()}</h6>
                    </div>
                </div>
                {isSelected && <div className="selected_section_wrapper">

                </div>}
            </div>
            <hr style={{ marginTop: "15px" }}/>
        </section> :
        <section>
            <div 
            className="flex"
            style={{ height: "82px" }}>
                <div className="profile_small loading_shimmer"> </div>
                <div className="flex flex_column align_start"> 
                    <div className="text_medium_placeholder loading_shimmer"> </div>
                    <div className="text_small_placeholder loading_shimmer"> </div>
                </div>
            </div>
        </section>}
        </>
    ) :
    (
        <section>
            {Array.from({ length: Math.ceil(placeholderAreaRef.current?.clientHeight / 82) }, (_, index) => (
                    <div 
                    className="flex"
                    key={index}
                    style={{ height: "82px" }}>
                        <div className="profile_small loading_shimmer"> </div>
                        <div className="flex flex_column align_start"> 
                            <div className="text_medium_placeholder loading_shimmer"> </div>
                            <div className="text_small_placeholder loading_shimmer"> </div>
                        </div>
                    </div>
                ))}
        </section>
    )
}
