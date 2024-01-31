import React, { useEffect, useRef, useState } from "react"
import { Slider, List } from "../components"
import { useParams } from "react-router-dom"
import { formatListData, PlayBtnManager } from "../utils"
import useStore from "../store"

export default function Artist(){
    const { standardWrapperWidth, spotifyApi, loggedUser } = useStore()
    const { artistId } = useParams()
    const [ artistData, setArtistData ] = useState(null)
    const [ artistAlbums, setArtistAlbums] = useState(null)
    const [ artistTopTracks, setArtistTopTracks ] = useState(null)
    const [ isFollowing, setIsFollowing ] = useState(false)
    const [ hoverItemId, setHoverItemId ] = useState(null)
    const [ isLoading, setIsLoading ] = useState(true)

    const albumsSlider = useRef(null)

    async function getArtistData(){
        const response = await spotifyApi.getArtist(artistId)
        setArtistData(response)
    }

    async function getArtistTopTracks(){
        const response = await spotifyApi.getArtistTopTracks(artistId, loggedUser.country)
        const formatedData = formatListData(response.tracks, "track")
        setArtistTopTracks(formatedData)
    }

    async function getArtistAlbums(){
        const response = await spotifyApi.getArtistAlbums(artistId)
        const formatedData = formatListData(response.items, "album")
        setArtistAlbums(formatedData)
    }

    async function getIsFollowing(){
        const response = await spotifyApi.isFollowingArtists([artistId])
        setIsFollowing(response[0])
    }

    async function toggleFollow(){
        try {
            if(isFollowing){
                await spotifyApi.unfollowArtists([artistId])
            } else {
                !isFollowing && await spotifyApi.followArtists([artistId])
            }
        } catch(err){
            console.log(err)
        }
        getIsFollowing()
    }

    useEffect(() => {
        if(artistId && spotifyApi){
            setArtistData(null)
            setIsLoading(true)
            getArtistData()
            getArtistAlbums()
            getArtistTopTracks()
            getIsFollowing()
            setIsLoading(false)
        }
    }, [artistId, spotifyApi])
    
    return(
        <div 
        className="wrapper default_padding relative" 
        style={{ 
            width: standardWrapperWidth, 
            overflow: "hidden" }}>
                <section>
                <div 
                className="flex profile_cover blur_cover" 
                style={{ backgroundImage: `url("${artistData?.images[0].url}")` }}>
                </div>
                {artistData ? 
                <div 
                className="cover_data_grid"
                onMouseEnter={() => setHoverItemId(artistData?.id)}
                onMouseLeave={() => setHoverItemId(null)}>
                    <div className="cover_medium" style={{ backgroundImage: `url('${artistData?.images[0].url}')` }}>
                        <PlayBtnManager 
                        uri={artistData?.uri} 
                        id={artistData?.id}
                        category={"cover"} 
                        type={"artist"} 
                        hoverItemId={hoverItemId}/>
                    </div>
                    <h4>Artist</h4>
                    <h1>{artistData?.name}</h1>
                    <button onClick={() => toggleFollow()} className="outline_button">{isFollowing ? "Following" : "Follow"}</button>
                </div> :
                <div 
                className="cover_data_grid">
                    <div className="cover_medium"></div>
                    <div className="flex flex_column"> 
                        <div className="text_small_placeholder"> </div>
                        <div className="text_large_placeholder"> </div>
                        <div className="button_placeholder"> </div>
                    </div>
                </div>}
            </section>

            {(artistTopTracks || isLoading) && 
            <section>
                <h2> Popular Tracks</h2>
                <List
                isLoading={isLoading} 
                list={artistTopTracks} 
                category={"track"}
                showIndex={true}/>
            </section>}
            {artistAlbums && <h2 style={{ margin: "40px 0 20px" }}>Discography</h2>}
            {(artistAlbums || isLoading) && 
                <div>
                    <Slider 
                    isLoading={isLoading}
                    list={artistAlbums} 
                    visibility={true} 
                    category="album" 
                    isLoggedUser={false} 
                    type={"list"}/>
                </div>}
        </div>
    )
}
