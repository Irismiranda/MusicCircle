import React, { useEffect, useState, useRef } from "react"
import { Axios } from "../../Axios-config"
import { useClickOutside } from "../../utils"
import { SvgEmojiBtn } from "../../assets"

export default function EmojiBar(props){
    const [showEmojiBar, setShowEmojiBar] = useState(false)
    const [emojiList, setEmojiList] = useState(null)
    const [selectedCategory, setSelectedCategory] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    const emojiListRef = useRef(null)

    const categories = [
        { 
            slug: 'smileys-emotion',
            emoji: '😊'
        },
        {
            slug: 'people-body',
            emoji: '💃'
        },
        {
            slug: 'animals-nature',
            emoji: '🦄'
        },
        {
            slug: 'food-drink',
            emoji: '🍭'
        },
        {
            slug: 'travel-places',
            emoji: '🏖️'
        },
        {
            slug: 'objects',
            emoji: '✂️'
        },
        {
            slug: 'flags',
            emoji: '🏳️‍🌈'
        }
    ]

    const { textAreaRef } = props
    
    const emoji_searchbar = useRef(null)
    const emojiBtnRef = useRef(null)
    const emojiBarRef = useRef(null)

    useClickOutside(emojiBarRef, [emojiBtnRef], () => {
        setShowEmojiBar(false)
    })

    function insertEmoji(emoji){
        if(textAreaRef.current.value){
        textAreaRef.current.value += emoji
        } else {
        textAreaRef.current.value = emoji
        }
    }
    
    async function getEmojis(category){
        setSelectedCategory(category)
        setIsLoading(true)
        const response = await Axios.post("/api/emoji_category", {
        category: category
        })
        const emojis = response.data.map(emoji => {
            return <p style={{cursor: "pointer"}} key={emoji.slug} onClick={() => insertEmoji(emoji.character)}>{emoji.character}</p>
        })
        setEmojiList(emojis)
        setIsLoading(false)
     }

     async function searchEmojis(){
        setSelectedCategory(null)
        setEmojiList(null)
        setIsLoading(true)
        const search_term = emoji_searchbar.current.value
        const response = await Axios.post("/api/search_emojis", {
            search_term: search_term,
         })

         if(response.data.length > 0){
             const emojis = response.data.map(emoji => {
                 return <p style={{cursor: "pointer"}} onClick={() => insertEmoji(emoji.character)}>{emoji.character}</p>
            })
            setEmojiList(emojis)
         } else {
            setEmojiList(
            <h5 
            style={{
                width: "210px", 
                color: "grey", 
                marginTop: "30px", 
                textAlign: "center"}}>
                    Sorry, no results were found 🫣
            </h5>)
         }      
        setIsLoading(false)  
     }

    useEffect(() => {
        setSelectedCategory('smileys-emotion')
        getEmojis('smileys-emotion')
    }, [])

    return (
        <>
            {showEmojiBar && 
            <div 
            ref={emojiBarRef}
            className="wrapper default_padding emoji_bar">
                <input 
                ref={emoji_searchbar} 
                className="search_bar"
                placeholder="Search..." 
                onInput={() => searchEmojis()}/>
                <div className="categories flex" >
                    {
                        categories.map( category => {
                            return (
                                <span key={category.slug} className={ selectedCategory === category.slug ? "selected" : "" } style={{cursor: "pointer"}} onClick={() => getEmojis(category.slug)}> {category.emoji} </span>
                            )
                        })
                    }
                </div>
                <div 
                className="emoji_list"
                style={{ 
                    gap: isLoading ? "8px" : "", 
                    gridTemplateColumns: isLoading ? "repeat(6, 28px)" : "" }}
                ref={emojiListRef}>
                    {(!emojiList || isLoading) ? 
                    <>
                    {Array.from({ length: 18 }, (_, index) => (
                        <div 
                        className="loading_shimmer full_width full_height"
                        key={index}>
                        </div>
                    ))}
                    </> : 
                    emojiList}
                </div>
            </div>}

            <div 
            ref={emojiBtnRef} 
            onClick={() => setShowEmojiBar(!showEmojiBar)}>
                <SvgEmojiBtn className="emoji_btn svg" />
            </div>
        </>
    )
}