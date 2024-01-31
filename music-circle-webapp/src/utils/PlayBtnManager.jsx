import React from "react"
import useStore from "../store"

export default function PlayBtnManager(props){
    const { spotifyApi, playerState, setRecommendationSeed, currentTrack } = useStore()
    const { uri, id, category, type, hoverItemId } = props
    const { deviceId } = playerState

    async function playItem() {
        if (type === "track") {
          await spotifyApi.play({ uris: [uri], device_id: deviceId })
          setRecommendationSeed({ 
            ids: [id], 
            type: "track" })
        } else{
          await spotifyApi.play({ context_uri: uri, device_id: deviceId })
          const methodName = `get${type.charAt(0).toUpperCase() + type.slice(1)}`
          
          const response = await spotifyApi[methodName](id)
      
          let retries = 0
          const maxRetries = 3
          let ids
      
          while (retries < maxRetries) {
            try {
              ids = response?.tracks?.map((track) => track.id)
      
              await Promise.all(ids.map((id) => spotifyApi.queue(id)))
              setRecommendationSeed({ 
                ids: type === "artist" ? uri : ids.slice(0, 5), 
                type: type === "artist" ? "artist" : "track" })
              return 
            } catch (err) {
              if (err.status === 502) {
                retries++
                await delay(1000)
              } else {
                throw err
              }
            }
          }
      
          throw new Error(`Failed after ${maxRetries} retries`)
        }
      }

    async function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    return (
        <>
            {(hoverItemId === id && currentTrack) && 
            <div 
            className={`play_btn play_btn_${category}`}
            onClick={() => playItem(uri)}>
            </div>}
        </>
    )
  }