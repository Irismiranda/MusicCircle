import React, { useState, useEffect, useRef } from "react"
import { Outlet } from "react-router-dom"
import { Axios } from "../../Axios-config"
import { PlayerMaximized, PlayerMinimized, PlayerOnScroll } from ".."
import { SvgDeviceIcon, SvgMinMaxBtn, SvgResizeHandle, musiccircle_instructions, connect_device_icon } from "../../assets"
import { formatListData, setProperties } from "../../utils"
import { useClickOutside } from "../../utils"
import useStore from "../../store"

export default function PlayerManager() {
    const [recommendations, setRecommendations] = useState(null)
    const [currentQueue, setCurrentQueue] = useState(null)
    const [queueIndex, setQueueIndex] = useState(null)
    const prevArtistUriRef = useRef(null)
    const prevSetVolume = useRef(null)
    const playerRef = useRef(null)
    const playerWrapperRef = useRef(null)
    const draggableHandleRef = useRef(null)
    const clientPrevPosY = useRef(null)
    const clientPrevPosX = useRef(null)
    const playerRectRef = useRef(null)
    const instructionsWindowRef = useRef(null)
    const instructionsBtnRef = useRef(null)
    
    const [showInstructions, setShowInstructions] = useState(false)
    const [track, setTrack] = useState(null)
    const [post, setPost] = useState({})
    const [isResizing, setIsResizing] = useState(false)
    const [playerSize, setPlayerSize] = useState({
        height: 248,
        width: 620,
    })

    const [isMoving, setIsMoving] = useState(false)
    const [playerPosStyle, setPlayerPosStyle] = useState({ 
        top: 0, 
        left: 0,
    })
    
    const { 
        setPlayerRef,
        currentTrack,
        setCurrentTrack,
        spotifyApi, 
        accessToken, 
        setArtistUri, 
        artistUri, 
        standardWrapperWidth, 
        playerState, 
        setPlayerState, 
        recommendationSeed } = useStore()

    const { 
        isMinimized,
        player, 
        shuffleState, 
        repeatState, 
        isScrolled,
        isMute,
    } = playerState

    useClickOutside(instructionsWindowRef, [instructionsBtnRef], () => setShowInstructions(false))

    async function handleShuffleClick() {
        spotifyApi.setShuffle(!shuffleState)
        setPlayerState({ shuffleState: !shuffleState })
    }

    async function handleRepeatClick() {
        if (repeatState === 0 || repeatState === 1) {
            const newState = repeatState + 1
            setPlayerState({ repeatState: newState })
        } else {
            setPlayerState({ repeatState: 0 })
        }
    }

    async function trackVolumePosition(e, volumeBarRef) {
        const volumeBarRect = volumeBarRef.current.getBoundingClientRect()
        const volumePercentage = calculatePosition(e, volumeBarRect) * 100
        const roundedPercentage = Math.round(volumePercentage)
        setPlayerState({ volumePercentage: roundedPercentage })
        try {
            await spotifyApi.setVolume(roundedPercentage)
        } catch (err) {
            console.log(err)
        }
    }

    async function getRecommendations(ids, type){
        const response = await spotifyApi.getRecommendations({ [`seed_${type}s`]: [ids], limit: 100 })
        const uriList = response.tracks.map(track => {
            return track.uri
        })
        setRecommendations(uriList)
        setQueueIndex(0)
    }

    async function setQueue() {
        if (recommendations[queueIndex]) {    
            let retries = 0
            const maxRetries = 5
    
            while (retries < maxRetries) {
                try {
                    await spotifyApi.queue(recommendations[queueIndex])
                    if (queueIndex < recommendations.length - 1) {
                        setQueueIndex(prevIndex => prevIndex + 1)
                    } else {
                        getRecommendations(currentTrack.id, "track")
                    }
                    return 
                } catch (err) {
                    if (err.status === 502) {
                        retries++
                        await delay(1000)
                    } else {
                        console.log(err)
                    }
                }
            }
            throw new Error(`Failed after ${maxRetries} retries`)
        }
    }
    
    async function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function getPost(){
        const response = await Axios.get(`/api/track_post/${artistUri.slice(15)}/${currentTrack.id}`)
        const track = formatListData([currentTrack], currentTrack.type)
        setPost({likes: response.data.likes, track: track[0]})
    }

    function handleTimelineClick(e, trackTimelineRef) {
        const rect = trackTimelineRef.current.getBoundingClientRect()
        const fraction = calculatePosition(e, rect)
        setPlayerState({ listened: fraction * 100 })
        const positionInSec = fraction * currentTrack.duration_ms
        player.seek(positionInSec).then(() => {
        }) 
    }

    function calculatePosition(e, rect) {
        const handleRelativePosition = e.clientX - rect.left
        const fraction = handleRelativePosition / rect.width
        return fraction
    }

    const handleScroll = () => {  

        const prevPlayerHeight = playerRef?.current?.offsetHeight
        
        if(window.scrollY > 1 + prevPlayerHeight){
            setPlayerState({ isScrolled: true })
        } else{
            setPlayerState({ isScrolled: false })
        }
    }

    const getInitialPos = (e) => {   
        if(isMinimized){

            clientPrevPosX.current = e.clientX
            clientPrevPosY.current = e.clientY 
            playerRectRef.current = playerRef.current.getBoundingClientRect()
            
            if(draggableHandleRef.current.contains(e.target)) {
                setProperties(setPlayerSize, 'width', playerRef?.current?.offsetWidth)
                setProperties(setPlayerSize, 'height', playerRef?.current?.offsetHeight)
                setIsResizing(true)
                setIsMoving(false)
            } else{  
                setIsMoving(true)
                setIsResizing(false)
            }
        }
    }

    const handlePlayerMove = (e) => {
        if (!isMoving) return

        const dx = e.clientX - clientPrevPosX.current
        const dy = e.clientY - clientPrevPosY.current

        const newLeft = Math.max(0, Math.min((playerRectRef.current.left + dx), document.documentElement.clientWidth - playerWrapperRef?.current.offsetWidth))
        const newTop = Math.max(0, Math.min((playerRectRef.current.top + dy), document.documentElement.clientHeight - playerWrapperRef?.current?.offsetHeight - 5))

        setPlayerPosStyle({ left: newLeft, top: newTop })
    }

    const handleResize = (e) => {
        if (!isResizing) return
        const { width, height } = playerSize
        const dx = e.clientX - clientPrevPosX.current + width
        const dy = e.clientY - clientPrevPosY.current + height

        const newWidth = Math.min(dx, document.documentElement.clientWidth - playerRectRef.current.x)

        if(dx > 480){
            setProperties(setPlayerSize, 'width', newWidth)
            setProperties(setPlayerSize, 'height', (newWidth / 2.5))
        } else{
            const maxHeight = Math.min(dy, 175)
            setProperties(setPlayerSize, 'width', newWidth)
            setProperties(setPlayerSize, 'height', maxHeight)
        }
    }

    useEffect(() => {
        async function updateMuteState(){
            const { isMute, volumePercentage } = playerState
            if(isMute && volumePercentage){
                prevSetVolume.current = volumePercentage
                setPlayerState({ volumePercentage: 0 })
                await spotifyApi.setVolume(0)
            } else if(!isMute && prevSetVolume.current){
                setPlayerState({ volumePercentage: prevSetVolume.current })
                await spotifyApi.setVolume(prevSetVolume.current)
            }
        }
        updateMuteState()
    }, [isMute])

    useEffect(() => {
        window.addEventListener("scroll", handleScroll)
    
        return () => {
            window.removeEventListener("scroll", handleScroll)
        }
    }, [])

    useEffect(() => {
        const script = document.createElement("script")
        script.src = "https://sdk.scdn.co/spotify-player.js"
        script.async = true

        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {

            const player = new window.Spotify.Player({
                name: 'MusicCircle',
                getOAuthToken: cb => { cb(accessToken); },
                volume: 0.5
            })

            setPlayerState({ player: player })
        
            player.connect()

            player.addListener('ready', ({ device_id }) => {
                setPlayerState({ deviceId: device_id })
            })

              
            player.addListener('player_state_changed', (state => {
                  
                if (!state) {
                    return
                }

                const interval = setInterval(() => {
                    player.getCurrentState().then((state) => {
                        if (state && state.position && state.duration && !state.paused) {
                            const totalListened = (100 * state.position) / state.duration
                            setPlayerState({ listened: totalListened })
                        }
                    })
                }, 50)

                setCurrentQueue(state.track_window.next_tracks)
                setTrack(state.track_window.current_track)

                try{
                    const currentArtistUri = state.track_window.current_track.artists[0].uri
                    if (!artistUri || currentArtistUri !== prevArtistUriRef.current) {
                    setArtistUri(currentArtistUri)
                    prevArtistUriRef.current = currentArtistUri
                    }
                }catch(err){
                    console.log(err)
                }

                setPlayerState({ 
                    shuffleState: state.shuffle, 
                    repeatState: state.repeat_mode, 
                    isPaused: state.paused })

                player.getVolume().then(volume => {
                    let percentage = volume * 100

                    setPlayerState({ volumePercentage: percentage })
                })

            }))

            player.addListener('player_state_changed', ({
                state,
                position,
                duration,
            }) => {
                const totalListened = (100 * position) / duration
                setPlayerState({ listened: totalListened })  
            })

            return () => clearInterval(interval)
        }

    }, [accessToken])

    useEffect(() => {

        const handleMouseUp = () => {
            setIsResizing(false)
        }
        
        if (isResizing) {
            window.addEventListener('mousemove', handleResize)
            window.addEventListener('mouseup',  handleMouseUp)
        } else {
            window.removeEventListener('mousemove', handleResize)
            window.removeEventListener('mouseup', handleMouseUp)
        }

        return () => {
            window.removeEventListener('mousemove', handleResize)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isResizing])

    useEffect(() => {       
        const handleMouseUp = () => {
            setIsMoving(false)
        }

        if (isMoving) {
            window.addEventListener('mousemove', handlePlayerMove)
            window.addEventListener('mouseup',  handleMouseUp)
        } else {
            window.removeEventListener('mousemove', handlePlayerMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }

        return () => {
            window.removeEventListener('mousemove', handlePlayerMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
    }, [isMoving])

    useEffect(() => {
        if(recommendations){
            recommendations[queueIndex]?.id === currentTrack?.id && setQueueIndex(prevIndex => prevIndex + 1)
        }

        if(currentTrack && currentQueue){
            currentTrack?.id === currentQueue[0]?.id && player.nextTrack()
        }

        if(currentQueue?.length < 2 && recommendations){
            setQueue()  
        } else if(recommendationSeed.ids && !recommendations){
            getRecommendations(recommendationSeed.ids, recommendationSeed.type)
        } else if(currentTrack && !recommendationSeed.ids && !recommendations){
            getRecommendations([currentTrack.id], "track")
        }
    }, [currentQueue, currentTrack, recommendationSeed, recommendations, queueIndex])

    useEffect(() => {
        playerRef?.current && setPlayerRef(playerRef)
    }, [playerRef])

    useEffect(() => {
        if(track && (track?.id !== currentTrack?.id)){
            setCurrentTrack(track)
        }
    }, [track])

    useEffect(() => {
        if(currentTrack){
            getPost()
        }
    }, [currentTrack])

    const playerFunctionalProps = {
        handleShuffleClick,
        handleRepeatClick,
        trackVolumePosition,
        handleTimelineClick,
        playerSize,
      }

    if (!currentTrack) {
        return (
            <>          
            { showInstructions ?
            <section
            ref={instructionsWindowRef}
            className="windowed wrapper flex instructions_window">
                <img src={musiccircle_instructions} style={{ alignSelf: "end", }}/>
                <div>
                    <h2 style={{ margin: "10px 23px" }}>Connect your player and chat to other listeners</h2>
                    <ol>
                        <li> Access your  <span>Spotify account</span> </li>
                        <li> Search for the
                            <img style={{ display: "inline", verticalAlign: "middle", margin: "0 6px" }} src={connect_device_icon}/> icon 
                            <span> (Connect to Device)</span> 
                        </li>
                        <li> Select <span>MusicCircle</span> </li>
                        <li> Tah-dah! You are ready to go 🎉</li>
                    </ol>
                    </div>
            </section> :
            <div className="flex connect_device_float">
            <SvgDeviceIcon className="svg_large"/>
            <div>
                <h3>Connect your Spotify Player</h3>
                <h4>To start your experience</h4>
            </div>
            <div 
            ref={instructionsBtnRef}
            className="more_info_button"
            onClick={() => setShowInstructions(true)}>
                <h5>?</h5>
            </div>
        </div>
        }
            <Outlet />
            </>
        )
    } else {
        const { isScrolled, isMinimized } = playerState
        return (
            <> 
                <div 
                ref={playerWrapperRef}
                className={isMinimized ? "player_minimized wrapper fixed" : "player_default wrapper sticky"}
                onMouseDown={(e) => getInitialPos(e)}
                style={{ 
                    width: isMinimized ? `${playerSize.width}px` : standardWrapperWidth,
                    height: isMinimized ? `${playerSize.height}px` : "",
                    left: isMinimized ?  playerPosStyle.left : "",
                    top: isMinimized ? playerPosStyle.top : ""}}>
                    
                    <div onClick={() => setPlayerState({ isMinimized: !isMinimized })}>
                        <SvgMinMaxBtn className="minMaxBtn" is_minimized={isMinimized.toString()}/>
                    </div>

                    { (!isScrolled && !isMinimized) &&
                    <div 
                    className="full_width"
                    ref={playerRef}>
                        <PlayerMaximized
                        playerFunctionalProps={playerFunctionalProps}
                        post={post}
                        setPost={setPost}
                    />
                    </div>
                    }

                    { (isScrolled && !isMinimized) 
                    && 
                    <div 
                    className="full_width"
                    ref={playerRef}>
                        <PlayerOnScroll 
                        playerFunctionalProps={playerFunctionalProps}
                        post={post}
                        setPost={setPost}
                    />
                    </div>
                    }

                    { isMinimized && 
                    <div 
                    className={playerSize.width > 480 ? "grid" : "min_layout"}
                    style={{ flexDirection: playerSize.height < 120 ? "row" : "column" }}
                    ref={playerRef}>
                        <PlayerMinimized 
                        playerFunctionalProps={playerFunctionalProps}
                        post={post}
                        setPost={setPost}
                    />
                    <div 
                        className="draggable_handle" 
                        ref={draggableHandleRef}
                        onMouseDown={(e) => getInitialPos(e)}>
                            <SvgResizeHandle />
                        </div>
                    </div>}   
                </div>
                <Outlet />
            </>
        )

    }

}
