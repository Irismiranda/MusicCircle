import React, { useRef } from "react"
import { Link } from "react-router-dom"
import useStore from "../../store"
import { SvgPlayBtn, SvgRandom, SvgRepeat, SvgVolume, SvgPrevBtn, SvgNextBtn } from "../../assets"
import { SaveTrackBtnManager, ShareBtnManager, CommentsManager, formatListData } from "../../utils"

const PlayerMaximized = ((props) => {
    const { playerState, setPlayerState, currentTrack } = useStore()
    const shareBtnRef = useRef(null)
    const volumeBarRef = useRef(null)
    const trackTimelineRef = useRef(null)
    const { 
        player, 
        isPaused,
        listened,
        shuffleState, 
        repeatState, 
        volumePercentage, 
        isMute,  
    } = playerState
    
    const { 
        handleShuffleClick,
        handleRepeatClick,
        trackVolumePosition,
        handleTimelineClick, 
    } = props.playerFunctionalProps

    const { post, setPost } = props

    const albumImg = currentTrack.album.images[0].url
    const trackName = currentTrack.name
    const artistName = currentTrack.artists[0].name
    const trackId = currentTrack.id

    return (
        <div className="player_wrapper">
            <img src={albumImg} className="cover_medium"/>   
            <div className="flex flex_column full_width" style={{ alignItems: "start"}}>
                <div className="flex"> 
                    <h2> {trackName} </h2>
                    <div style={{ marginTop: "6px" }}>
                        <SaveTrackBtnManager 
                        trackId={trackId}/>
                    </div>
                </div>
                <Link to={`/artist/${currentTrack.artists[0].uri.slice(15)}`}>
                    <h3> {artistName} </h3>
                </Link>

                <div className="flex full_width">
                    <div className="flex" onClick={() => { player.previousTrack() }}>
                        <SvgPrevBtn className="svg" />
                    </div>

                    <div className="flex" onClick={() => { player.togglePlay() }} >
                        <SvgPlayBtn is_paused={isPaused ? "true" : "false"} className="svg_medium"/>
                    </div>

                    <div className="flex">
                        <SvgNextBtn className="svg" onClick={() => { player.nextTrack() }} />
                    </div>
                    <div className="track-timeline bar" 
                        ref={trackTimelineRef} 
                        onClick={(e) => handleTimelineClick(e, trackTimelineRef)}>
                        <div className="track-listened" style={{ width: `${listened}%` }}></div>
                    </div>
                </div>

                <div className="interaction_btns flex space_between">
                    <div className="flex flex_wrap">
                        <div className="flex">
                            <div className="flex" onClick={() => handleShuffleClick()}>
                                <SvgRandom className="svg" style={{ fill: shuffleState ? '#F230AA' : '#AFADAD' }} />
                            </div>
                            <div className="flex" onClick={() => handleRepeatClick()}>
                                <SvgRepeat className="svg" repeat_state={repeatState} style={{ fill: repeatState === 1 || repeatState === 2 ? '#F230AA' : '#AFADAD' }} />
                            </div> 
                        </div>
                        <div className="flex volume_bar_wrapper">
                            <div className="flex" onClick={() => setPlayerState({ isMute: !isMute })}> 
                                <SvgVolume className="svg" volume_percentage={volumePercentage}/>
                            </div>
                            <div
                            ref={volumeBarRef}
                            className="volume-bar bar flex"
                            onClick={(e) => trackVolumePosition(e, volumeBarRef)}>
                                <div className="volume-level"
                                    style={{ width: `${volumePercentage}%` }}>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex social_btns">
                            <CommentsManager
                            post={{track: post?.track, likes: post?.likes}}
                            setPost={setPost}/>
                        <div className="flex" ref={shareBtnRef}>
                            <ShareBtnManager
                            content={formatListData([currentTrack], 'track')[0]}/>
                        </div>
                    </div>
                </div>
            </div> 
        </div>
    )
})

export default PlayerMaximized