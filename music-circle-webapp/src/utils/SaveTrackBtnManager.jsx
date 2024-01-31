import React, { useState, useEffect } from "react"
import useStore from "../store"
import { SvgHeart } from "../assets"

export default function SaveTrackBtnManager(props){
    const { spotifyApi } = useStore()
    const [isLiked, setIsLiked] = useState(false)

    const { trackId } = props

    async function getIsTrackSaved(id) {
        const response = await spotifyApi.containsMySavedTracks([id])
        setIsLiked(response)
    }

    async function handleHeartClick(id) {
        const trackIds = [id]
        if (!isLiked) {
            try{
                await spotifyApi.addToMySavedTracks(trackIds)
                setIsLiked(true)
            } catch(err){
                console.log(err)
            }
        } else {
            try{
                await spotifyApi.removeFromMySavedTracks(trackIds)
                setIsLiked(false)
            } catch(err){
                console.log(err)
            }
        }
    }

    useEffect(() => {
        if (trackId) {
            getIsTrackSaved(trackId)
        }
    }, [trackId])


    return (
        <div 
        style={{ height: "16px" }}
        onClick={() => handleHeartClick(trackId)}>
            <SvgHeart 
            className="svg"
            style={{ 
                fill: isLiked ? '#F230AA' : 'none', 
                stroke: isLiked ? "#F230AA" : "#AFADAD"}}/>
        </div>
    )
  }