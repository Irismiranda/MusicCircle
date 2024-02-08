import React, { useEffect, useRef, useState } from "react"
import { normalizeText } from 'normalize-text'
import { formatListData } from "../../utils"
import {UserList, List} from ".."
import { Axios } from "../../Axios-config"
import useStore from "../../store"

export default function SearchMenu(){
    const [searchResults, setSearchResults] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [activeCategory, setActiveCategory] = useState("tracks")
    const [searchTerm, setSearchTerm] = useState("")
    const { spotifyApi } = useStore()
    const searchBarRef = useRef(null)

    async function search(){
        setIsLoading(true)
        setSearchResults(null)
        const options = {limit: 20}

        if(!activeCategory) return

        if(searchTerm === "" && activeCategory !== "users"){
            const response = await spotifyApi.getMyRecentlyPlayedTracks()

            const data = response.items.map(item => {
                return item.track
            })

            const formatedData = formatListData(data, data[0].type)
            setSearchResults(formatedData)

        } else if(activeCategory !== "users"){
            const methodName = `search${activeCategory.charAt(0).toUpperCase()}${activeCategory.slice(1)}`
            const response = await spotifyApi[methodName](searchTerm, options)

            if(response){

                const formatedData = formatListData(response[activeCategory].items, activeCategory.slice(0, -1))
                setSearchResults(formatedData)

            } else setSearchResults(null)
        } else{
            if(searchTerm !== ""){
                const normalizedSearchTerm = normalizeText(searchTerm).replace(/\s/g,'').toLowerCase()
                const response = await Axios.get(`/api/search/user/${normalizedSearchTerm}`)

                const formatedData = formatListData(response.data, "user")

                setSearchResults(formatedData)

            } else {
                setSearchResults(null)
            }
        }
        setIsLoading(false)
    }
    
    useEffect(() => {
        search()
    }, [searchTerm, activeCategory])

    return (
        <div
        className="search_list_wrapper flex flex_column">
            <section 
            className="flex space_between">
                <button 
                className="bullet_btn"
                style={{ backgroundColor: activeCategory === "tracks" ? "#F230AA" : ""}}
                onClick={() => setActiveCategory("tracks")}>
                    Tracks
                </button>

                <button 
                className="bullet_btn"
                style={{ backgroundColor: activeCategory === "albums" ? "#F230AA" : ""}}
                onClick={() => setActiveCategory("albums")}>
                    Albums
                </button>

                <button 
                className="bullet_btn"
                style={{ backgroundColor: activeCategory === "artists" ? "#F230AA" : ""}}
                onClick={() => setActiveCategory("artists")}>
                    Artists
                </button>

                <button 
                className="bullet_btn"
                style={{ backgroundColor: activeCategory === "users" ? "#F230AA" : ""}}
                onClick={() => {
                    setIsLoading(true)
                    setActiveCategory("users")}}>
                    Users
                </button>
            </section>

            <input 
            onChange={(e) => setSearchTerm(e.currentTarget.value)}
            className="search_bar" 
            placeholder="Search..." />

            {(searchBarRef?.current?.value === "" && searchResults?.length > 0) && <h2>Recently Listened</h2>}

            {(searchResults?.length > 0 || isLoading) ? 
            <section className="search_list_wrapper">
                {activeCategory === "users" ?
                <UserList 
                isLoading={isLoading}
                list={searchResults}
                showBtn={false}/> :
                <List 
                key={searchResults?.map(item => item.id)}
                isLoading={isLoading}
                list={searchResults} 
                category={activeCategory}
                showIndex={false} />}
            </section> :
            <h3>No {activeCategory} were found</h3>}

        </div>
    )
}
