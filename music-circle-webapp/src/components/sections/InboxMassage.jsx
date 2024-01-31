import React, { useEffect, useState } from "react"
import useStore from "../../store"
import { formatListData, PlayBtnManager } from "../../utils"

export default function InboxMessage(props){
    const { message } = props
    const { loggedUser, spotifyApi } = useStore()
    const [content, setContent] = useState(null)
    const [hoverItemId, setHoverItemId] = useState(null)

    async function getContent(){
        const { content_type, content_id } = message.content
        const methodName = `get${content_type.charAt(0).toUpperCase() + content_type.slice(1)}`
        
        const contentData = await spotifyApi[methodName](content_id)
        const data = formatListData([contentData], content_type)
        setContent(data[0])        
    }

    useEffect(() => {
        if(message.content){
            getContent()
        } else if(content){
            setContent(null)
        }
    }, [message])

    return(
        <section 
        className="flex flex_column full_width">
            <div 
            className="inbox_chat_message"
            style={{ 
                alignSelf: message.sender === loggedUser.id ? "end" : "start",
                textAlign: message.sender === loggedUser.id ? "end" : "start"
                }}>
                <p>{message.text}</p>
                {content &&
                <div 
                className="flex"
                style={{ 
                    padding: "10px 0px", 
                    flexDirection: message.sender === loggedUser.id ? "row-reverse" : "row" 
                }}
                onMouseEnter={() => setHoverItemId(content.id)}
                onMouseLeave={() => setHoverItemId(null)}>
                    <div 
                    className="cover_small relative"
                    style={{ backgroundImage: `url(${content.imgUrl})` }}>
                        <PlayBtnManager 
                        uri={content.uri} 
                        id={content.id}
                        category={"list"} 
                        type={content.type} 
                        hoverItemId={hoverItemId}/>
                    </div>
                    <div>
                        <h4>{content.artist_name && content.artist_name}</h4>
                        <h5>{content.name}</h5>
                    </div>
                </div>}
            </div>
            <h5 
            style={{ 
                alignSelf: message.sender === loggedUser.id ? "end" : "start",
                textAlign: message.sender === loggedUser.id ? "end" : "start",
                margin: "3px 25px",
                }}>
                    {new Date(message.time_stamp * 1000).toLocaleString()}
            </h5>
        </section>
    )
}