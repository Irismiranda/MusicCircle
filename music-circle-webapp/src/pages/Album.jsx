import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Slider, SimplifiedList } from "../components"
import { useParams } from "react-router-dom"
import { formatListData, PlayBtnManager } from "../utils"
import useStore from "../store"

export default function Album(){
    const { standardWrapperWidth, spotifyApi } = useStore()
    const { albumId } = useParams()
    const [ albumData, setAlbumData ] = useState(null)
    const [ artistAlbums, setArtistAlbums] = useState(null)
    const [ albumTracks, setAlbumTracks ] = useState(null)
    const [ hoverItemId, setHoverItemId ] = useState(null)
    const [ isLoading, setIsLoading ] = useState(true)

    async function getAlbumData(){
        const response = await spotifyApi.getAlbum(albumId)
        setAlbumData(response)
    }

    async function getAlbumTracks(){
        const response = await spotifyApi.getAlbumTracks(albumId)
        const tracks = formatListData(response.items, "simplified")
        setAlbumTracks(tracks)
    }

    async function getArtistAlbums(){
        const response = await spotifyApi.getArtistAlbums(albumData.artists[0].id)
        const formatedData = formatListData(response.items, "album")
        setArtistAlbums( formatedData.filter(item => item.id !== albumData.id))    
    }

    useEffect(() => {
        if(albumId){
            setAlbumData(null)
            setIsLoading(true)
            getAlbumData()
            getAlbumTracks()  
        }
    }, [albumId])

    useEffect(() => {
        if(albumData){
            getArtistAlbums()
            setIsLoading(false)
        }
    }, [albumData])
    
    return(
        <div 
        className="wrapper default_padding relative" 
        style={{ width: standardWrapperWidth, overflow: "hidden" }}>
            {albumData ?
            <section>
                <div 
                className="flex profile_cover blur_cover" 
                style={{ backgroundImage: `url("${albumData?.images[0].url}")` }}>
                </div>
                <div 
                className="cover_data_grid"
                onMouseEnter={() => setHoverItemId(albumData?.id)}
                onMouseLeave={() => setHoverItemId(null)}>
                    <div className="cover_medium" style={{ backgroundImage: `url('${albumData?.images[0].url}')` }}>
                        <PlayBtnManager 
                        uri={albumData?.uri} 
                        id={albumData?.id}
                        category={"cover"} 
                        type={"album"} 
                        hoverItemId={hoverItemId}/>
                    </div>
                    <h4>Album</h4>
                    <h1>{albumData?.name}</h1>
                    <Link to={`/artist/${albumData?.artists[0].id}`}>
                        <h2>{albumData?.artists[0].name}</h2>
                    </Link>
                </div>
            </section> :
            <section className="cover_data_grid">
                <div className="cover_medium"></div>
                <div className="flex flex_column"> 
                    <div className="text_small_placeholder"> </div>
                    <div className="text_large_placeholder"> </div>
                    <div className="button_placeholder"> </div>
                </div>
            </section>}
            
            {(albumTracks || isLoading) && 
            <section>
                <h2> Tracks</h2>
                <SimplifiedList 
                isLoading={isLoading}
                list={albumTracks} 
                category={"track"}/>
            </section>}
            {artistAlbums && <h2>More on {albumData?.artists[0].name}</h2>}
            {((artistAlbums && albumData) || isLoading) && 
            <Slider 
            isLoading={isLoading}
            list={artistAlbums} 
            visibility={true} 
            category="album" 
            isLoggedUser={false}
            type={"list"}/>}
        </div>
    )
}
