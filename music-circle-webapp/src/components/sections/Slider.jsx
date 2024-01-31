import React, { useState, useRef } from "react"
import useStore from "../../store"
import { Link } from "react-router-dom"
import { Axios } from "../../Axios-config"
import { PlayBtnManager, SliderScrollBtns } from "../../utils"

export default function Slider(props){
    const { list, visibility, category, isLoggedUser, type, isLoading } = props
    const { loggedUser, setUserTopTracks, setUserTopArtists } = useStore()
    const parentRef = useRef(null)
    const placeholderAreaRef = useRef(null)
    
    const [ hoverItemId, setHoverItemId ] = useState(null)

    async function toggleItemVisibility(itemId, category){
        const response = await Axios.post(`/api/user/data/top_${category}s/hide_item`, {
            userId: loggedUser.id,
            itemId: itemId,
        })
        category === "track" && setUserTopTracks(response.data.top_tracks)
        category === "artist" && setUserTopArtists(response.data.top_artists)
    }

    return(
        <section 
        className="relative">
            <SliderScrollBtns 
            parentRef={parentRef}
            list={list}
            visibility={visibility}/>

            {!isLoading ? 
            <div 
            className="slider_grid"
            ref={parentRef}>
                {list
                    .filter(item => item.isVisible === visibility)
                    .sort((a, b) => {
                        if (a.releaseDate && b.releaseDate) {
                            return b.releaseDate.localeCompare(a.releaseDate)
                        }
                        return 0
                    })
                    .slice(type === "top_list" ? 0 : undefined, type === "top_list" ? 10 : undefined)
                    .map((item) => {
                        return (
                            <div 
                            className="inner_wrapper grid" 
                            key={item.id}>
                                <div 
                                className="slider_image_wrapper">
                                    <Link 
                                    to={item.type !== "track" ? `/${item.type}/${item.id}` : ""}
                                    onClick={(item.type === "track") && ((e) => e.preventDefault())}>
                                        <div 
                                        onMouseEnter={() => setHoverItemId(item.id)}
                                        onMouseLeave={() => setHoverItemId(null)}
                                        style={{ backgroundImage: `url('${item.imgUrl}')`}} className="cover_medium cover_wrapper">
                                        </div>
                                    </Link>
                                    {isLoggedUser && 
                                    <button 
                                    onClick={() => toggleItemVisibility(item.id, item.type)}>
                                        {visibility ? "Hide" : "Show"}</button>}
                                    <div onMouseEnter={() => setHoverItemId(item.id)}>
                                        <PlayBtnManager 
                                        uri={item.uri} 
                                        id={item.id}
                                        category={"slider"} 
                                        type={item.type} 
                                        hoverItemId={hoverItemId}/>
                                    </div>
                                </div>
                                <Link to={category === "track" ? "" : `/${item.type}/${item.id}`}>
                                    <h3>{item.name}</h3>
                                    {(category === "track" || category === "album") && <h5>{item.artist_name}</h5>}
                                    <h4>{(category === "album" || category === "album") && 
                                    <span>{item.releaseDate.slice(0, -6)} • </span>}
                                    {category}</h4>
                                </Link>
                            </div>
                            )
                        })   
                    }     
            </div> :
            <div 
            ref={placeholderAreaRef}
            className="slider_grid">
                {Array.from({ length: Math.ceil(placeholderAreaRef.current?.clientWidth / 200) }, (_, index) => (
                <div 
                key={index} 
                className="inner_wrapper loading_shimmer"
                style={{ height: "270px" }}></div>
                ))}
            </div>}
        </section>
    )
}

