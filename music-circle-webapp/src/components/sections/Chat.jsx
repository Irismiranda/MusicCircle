import React, { useEffect, useState, useRef } from "react"
import { v4 as uuidv4 } from 'uuid'
import { SvgPinned, SvgSendBtn } from "../../assets"
import { EmojiBar, Messages } from "../index"
import useStore from "../../store"
import { Link } from "react-router-dom"

export default function Chat(){
    const messageTextArea = useRef(null)
    const { artistUri, spotifyApi, loggedUser, socket, standardWrapperWidth } = useStore()
    const [isLoading, setIsLoading] = useState(false)
    const [chatState, setChatState] = useState({
            artistData: null,
            artistId: null,
            chatId: null,
            isPinned: false,
        })

    function setChatProperties(property, value){
        setChatState((prevState) => ({
            ...prevState,
            [property]: value,
        }))
    }

    useEffect(() => {
        async function getArtistData(id) {
            setChatProperties('artistId', id)
            try{
                const artist = await spotifyApi.getArtist(id)
                const newArtistData = {
                    artistName: artist.name,
                    profilePic: artist.images[1].url,
                    id:id
                }
                setChatProperties('artistData', newArtistData)
            } catch(err){
                console.log(err)
            }
        }


    if(!chatState.isPinned && artistUri){
        const newId = artistUri.replace("spotify:artist:", "")

        getArtistData(newId)
        
        }
    }, [artistUri, chatState.isPinned])

    useEffect(() => {
        socket?.once('gotChat', (newChatId) => {
            setChatProperties('chatId', newChatId)
        }) 
    }, [socket])

    async function sendMessage() {
        if(!isLoading){
            setIsLoading(true)
            const { chatId, artistId } = chatState
            if (messageTextArea.current.value.trim()){
                const newMessage = {
                messageId: `${loggedUser.id}_${chatId}_${uuidv4()}`,
                id: artistId,
                chatId: chatId,
                userId: loggedUser.id,
                text: messageTextArea.current.value,
                userName: loggedUser.display_name,
                userProfilePic: loggedUser.images[0].url,
                timeStamp: Math.floor(Date.now() / 1000),
                display: true,
            }
            
            socket?.emit('sendMessage', newMessage )
    
            messageTextArea.current.value = ""
    
            }
            setIsLoading(false)
        }
    }
            
    if(chatState.artistData){
        const { artistId, artistData, isPinned } = chatState
        const { artistName, profilePic} = artistData
        return (
            <div className="wrapper default_padding chat_wrapper relative" style={{ width: standardWrapperWidth }}>
                <div 
                className="flex profile_cover blur_cover" 
                style={{ 
                    backgroundImage: `url("${profilePic}")`, 
                    height: "140px", }}>
                </div>
                <div className="flex space_between"
                style={{ marginBottom: "30px" }}>
                    <div className="flex gap">
                        <Link to={`/artist/${artistId}`}> 
                            <img src={profilePic} 
                            alt={artistName} 
                            className="profile_medium"/>
                        </Link>
                        <h2>
                            <Link to={`/artist/${artistId}`}>
                                {artistName}
                            </Link> Live Chat
                        </h2>
                    </div>
                    <div onClick={() => setChatProperties('isPinned', !isPinned)} className="svg">
                        <SvgPinned className="svg_medium pinned" is_pinned={isPinned ? "true" : "false"} style={{ fill: isPinned ? '#AFADAD' : 'none', }}/>
                    </div> 
                </div>
                <Messages 
                chatId={chatState.chatId} 
                chatProfileId={artistId} 
                type={"artist"} 
                key={chatState.chatId}/>
                <div className="flex relative">
                    <textarea 
                    id="chatInput" 
                    ref={messageTextArea} 
                    placeholder={`Say something nice to other ${artistName} fans...`} 
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                        }
                    }}>
                    </textarea>
                    <div className="input_menu_wrapper">
                        <EmojiBar
                        textAreaRef={messageTextArea}/>
                        <div onClick={() => sendMessage()}>
                            <SvgSendBtn className="send_btn"/>
                        </div>
                    </div>
                </div>
            </div>
        )
    } else return null
}