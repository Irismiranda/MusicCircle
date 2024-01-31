    import React, { useEffect, useRef, useState } from "react"
    import { Link } from "react-router-dom"
    import { PlayBtnManager} from "../../utils"

    export default function List(props){
        const { list, category, showIndex, isLoading } = props
        const [ hoverItemId, setHoverItemId ] = useState(null)
        const placeholderAreaRef = useRef(null)
        
        return !isLoading ? (
            <div className="list_wrapper">
                {list.map((item, index) => {
                        return (
                            <div 
                            className="relative"
                            key={item.uri}>
                                    <div 
                                    className="flex"                          
                                    onMouseEnter={() => setHoverItemId(item.id)}
                                    onMouseLeave={() => setHoverItemId(null)}>
                                        <Link 
                                        to={item.type !== "track" ? `/${item.type}/${item.id}` : ""}
                                        onClick={(item.type === "track") && ((e) => e.preventDefault())}>
                                            <img 
                                            src={`${item.imgUrl}`} 
                                            className="cover_small" />
                                        </Link>
                                        <div>
                                            <Link 
                                            to={item.type !== "track" ? `/${item.type}/${item.id}` : ""}
                                            onClick={(item.type === "track") && ((e) => e.preventDefault())}>
                                                <h3>{showIndex && <span>{index + 1}.</span>} {item.name}</h3>
                                            </Link>
                                            {(category === "track" || category === "album") && 
                                            <Link to={`/artist/${item.artist_id}`}>
                                                <h3>{item.artist_name}</h3>
                                            </Link>}
                                            <h4>{item.type}</h4>
                                        </div>
                                    </div>
                                <div onMouseEnter={() => setHoverItemId(item.id)}>
                                    <PlayBtnManager 
                                    uri={item.uri} 
                                    id={item.id}
                                    category={"list"} 
                                    type={item.type} 
                                    hoverItemId={hoverItemId}/>
                                </div>
                            </div>
                            )
                        })   
                    }     
            </div>
        ) : (
            <div 
            className="list_wrapper"
            ref={placeholderAreaRef}>
                {Array.from({ length: 8 }, (_, index) => (
                    <div 
                    className="flex"
                    key={index}>
                        <div className="cover_small loading_shimmer"> </div>
                        <div className="flex flex_column align_start"> 
                            <div className="text_medium_placeholder loading_shimmer"> </div>
                            <div className="text_medium_placeholder loading_shimmer"> </div>
                            <div className="text_small_placeholder loading_shimmer"> </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

