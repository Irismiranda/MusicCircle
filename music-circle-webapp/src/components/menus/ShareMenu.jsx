import React, { useEffect, useState, useRef } from "react"
import { Axios } from "../../Axios-config"
import { SvgLinkIcon, SvgFeedIcon } from "../../assets"
import { SliderScrollBtns, formatListData } from "../../utils"
import { EmojiBar } from "../"
import { normalizeText } from "normalize-text"
import useStore from "../../store"
import { useNavigate } from "react-router-dom"

export default function ShareMenu(props){
    const { loggedUser, addUserPost } = useStore()
    const navigate = useNavigate()

    const [isLoading, setIsLoading] = useState(true)
    const [userDataList, setUserDataList] = useState(null)
    const [searchResult, setSearchResult] = useState(null)
    const [sendList, setSendList] = useState([])
    const [showMessage, setShowMessage] = useState(false)
    const [publishing, setPublishing] = useState(false)
    const [isTextAreaEmpty, setIsTextAreaEmpty] = useState(true)

    const userSearchInputRef = useRef(null)
    const parentRef = useRef(null)
    const placeholderAreaRef = useRef(null)
    const textAreaRef = useRef(null)

    const { content, closeMenu, isPost, getPrivateChatsList, hideUserList, sendTo } = props

    function toggleSendList(name, id){
        if(sendList.some((user) => user.id === id)){
            const updatedList = sendList.filter(item => item.id !== id)
            setSendList(updatedList)
        } else if(sendList){ 
            const item = {name: name, id: id}
            setSendList((prevList) => [...prevList, item])
        }
    }

    function copyToClipboard(){
        navigator.clipboard.writeText(`https://open.spotify.com/${content.type}/${content.id}`)
        setShowMessage(true)
        setTimeout(() => setShowMessage(false), 5000)
    }

    async function getUsersData(idList){
        setIsLoading(true)

        const userList = []
        await Promise.all(
            idList.slice(0, 15).map(async (id) => {
                const response = await Axios.get(`/api/user/${id}`)
                userList.push(response.data)
            })
        )

        const formatedData = formatListData(userList, "user")
        
        setUserDataList(formatedData)
        setSearchResult(formatedData)
        setIsLoading(false)
    }

    async function searchUsers() {
        const searchTerm = userSearchInputRef.current.value
        
        const normalizedSearchTerm = normalizeText(searchTerm).toLowerCase()        
        let searchResults
        
        if (searchTerm === "") {
            searchResults = searchResults?.length > 0 ? userDataList?.slice(15) : []
        } else {
            searchResults = userDataList?.filter((user) =>
            normalizeText(user.userHandle).toLowerCase().includes(normalizedSearchTerm) ||
            normalizeText(user.name).toLowerCase().includes(normalizedSearchTerm)
            )
        }
        
        setSearchResult(searchResults)
    }

    async function sendMessage(){
        setPublishing(true)

        const sendListIds = sendList.length > 0 ? sendList.map(item => item.id) : [sendTo]

        const messages = []

        sendListIds.map(userId => {
            const messageData = {
                text: textAreaRef.current.value,
                sender: loggedUser.id,
                time_stamp: Math.floor(Date.now() / 1000),
                mark_as_read: false,
                user_ids: [userId, loggedUser.id]
            }
            if(content){
                messageData.content = {
                    content_id: content.id, 
                    content_type: content.type
                }
            }

            messages.push(messageData)
        })
        
        
        const response = await Axios.post('/api/send_inbox_message', { messages: messages, logged_user_id: loggedUser.id })
        
        
        if(getPrivateChatsList){
            getPrivateChatsList()
        }
        
        closeMenu()
        navigate(`/inbox?chat=${response.data.chat_id}`)
    }

    async function sharePost(){
        setPublishing(true)

        const post = await Axios.post(`/api/${loggedUser.id}/share_post/${content.id}`, {
            description: textAreaRef.current.value,
            type: content.type,
            time_stamp: Math.floor(Date.now() / 1000),
            artist_id: content.artist_id,
            hide_post: false,
        })

        addUserPost(post.data)
        closeMenu()
    }
    

    useEffect(() => {
        getUsersData(loggedUser.following)
    }, [])

    return (
        <div className={publishing ? "share_menu_inner_wrapper posting_wrapper" : "share_menu_inner_wrapper"}>
            {!hideUserList &&
            <input 
            ref={userSearchInputRef} 
            className="search_bar" 
            placeholder="Find a friend..." 
            onInput={() => searchUsers()} />}

            {!hideUserList && 
            <section className="slider_inner_wrapper">
                {!isLoading ?
                <div>
                    {(searchResult?.length > 0) ? 
                    <div>
                        <div 
                        className="user_slider_grid"
                        ref={parentRef}>
                            {searchResult.map((user) => {
                                return (
                                    <div 
                                    className={sendList.some((item) => item.name === user.name) ? 
                                        "flex flex_column user_slider_item user_slider_selected" : 
                                        "flex flex_column user_slider_item"}
                                    key={user.id}
                                    onClick={() => toggleSendList(user.name, user.id)}>
                                        {
                                        user.imgUrl ? <img 
                                        className="profile_small"
                                        src={user.imgUrl}/> :
                                        <div className="profile_small"></div>
                                        }
                                        <h3>{user.name}</h3>
                                    </div>
                                )
                            })}
                        </div>
                    <SliderScrollBtns 
                    parentRef={parentRef}
                    list={userDataList}
                    />   
                    </div> :
                    <h3>No results found...</h3>} 
                </div> :
                <div 
                ref={placeholderAreaRef}
                className="user_slider_grid">
                    {Array.from({ length: Math.ceil(placeholderAreaRef.current?.clientWidth / 180) }, (_, index) => (
                    <div 
                    key={index} 
                    className="user_slider_item loading_shimmer"
                    style={{ height: "99px" }}></div>
                    ))}
                </div>
                }
            </section>}
            
            {sendList.length > 0 && 
            <div 
            className="flex"
            style={{ flexWrap: "wrap" }}>
                {sendList.map((item) => {
                    return (
                        <button 
                        key={`${item.id}_button`}
                        onClick={() => toggleSendList(item.name, item.id)}
                        className="bullet_btn">
                            {item.name}
                        </button>
                    )
                })}
            </div>}

            <section 
            className="relative"> 
                <textarea 
                onChange={() => setIsTextAreaEmpty(textAreaRef.current.value === "")}
                ref={textAreaRef}
                className="share_menu_textarea"
                placeholder={isPost ? "Say something about this..." : "Say something cool :)"}/>
                <EmojiBar 
                textAreaRef={textAreaRef}/>
                <button
                className="full_width" 
                disabled={(sendList?.length === 0 && !sendTo) || (isTextAreaEmpty && !content)} 
                onClick={() => sendMessage()}>
                    Send
                </button>
            </section>

            {isPost &&
            <section 
            className="flex full_width"
            style={{ margin: "20px 0px"}}>
                <div 
                className="flex full_width justify_center"
                onClick={() => copyToClipboard()}>
                    <SvgLinkIcon className="svg" />
                    {showMessage && <h5>Copied to Clipboard!</h5>}
                </div>
                    <div 
                    className="flex full_width justify_center"
                    onClick={() => sharePost()}>
                        <SvgFeedIcon className="svg"/>
                    </div>
            </section>
            }       

        </div>
    )
}