        import React, { useRef } from "react"
        import { Link } from "react-router-dom"
        import useStore from "../../store"
        import { SvgPlayBtn, SvgRandom, SvgRepeat, SvgVolume, SvgPrevBtn, SvgNextBtn } from "../../assets"
        import { SaveTrackBtnManager, ShareBtnManager, CommentsManager, formatListData } from "../../utils"

        const PlayerMinimized = ((props) => {
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
                isMute
            } = playerState
            
            const { 
                handleShuffleClick,
                handleRepeatClick,
                trackVolumePosition,
                handleTimelineClick,
                playerSize,
            } = props.playerFunctionalProps

            const { post, setPost } = props

            const albumImg = currentTrack.album.images[0].url
            const trackName = currentTrack.name
            const artistName = currentTrack.artists[0].name
            const trackId = currentTrack.id

            if(playerSize.width > 480){   
                return (
                <>
                        <div className="cover_flexible overlay" style={{ background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8379726890756303) 100%), url(${albumImg})` }}>
                        <div className="flex social_btns">
                            <CommentsManager
                            post={{track: post?.track, likes: post?.likes}}
                            setPost={setPost}/>
                        <div ref={shareBtnRef}>
                            <ShareBtnManager
                            content={formatListData([currentTrack], 'track')[0]}/>
                        </div>
                        <SaveTrackBtnManager 
                        trackId={trackId}/>
                    </div>
                        </div>
                
                        <h2> {trackName} </h2>
                        <Link to={`/artist/${currentTrack.artists[0].uri.slice(15)}`}>
                            <h3> {artistName} </h3>
                        </Link>
                        
                    <div className="flex main_btns">
                        <div onClick={() => { player.previousTrack() }}>
                            <SvgPrevBtn className="svg" />
                        </div>
    
                        <div onClick={() => { player.togglePlay() }} >
                            <SvgPlayBtn is_paused={isPaused ? "true" : "false"} className="svg_medium"/>
                        </div>
    
                        <div>
                            <SvgNextBtn className="svg" onClick={() => { player.nextTrack() }} />
                        </div>
    
                    </div>
                    
                    <div 
                    className="track-timeline bar" 
                    ref={trackTimelineRef} 
                    onClick={(e) => handleTimelineClick(e, trackTimelineRef)}>
                        <div className="track-listened" style={{ width: `${listened}%` }}></div>
                    </div>
                    
                    <div className="flex secondary_btns">
                        <div className="flex">
                            <div onClick={() => handleShuffleClick()}>
                                <SvgRandom className="svg" style={{ fill: shuffleState ? '#F230AA' : '#AFADAD' }} />
                            </div>
                            <div onClick={() => handleRepeatClick()}>
                                <SvgRepeat className="svg" repeat_state={repeatState} style={{ fill: repeatState === 1 || repeatState === 2 ? '#F230AA' : '#AFADAD' }} />
                            </div>
                        </div>
                        <div onClick={() => setPlayerState({ isMute: !isMute })}> 
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
                </> 
            )
        } else return (           
            <>
                <div className="flex secondary_btns">
                    <h5> 
                        {trackName} by 
                        <Link to={`/artist/${currentTrack.artists[0].uri.slice(15)}`}>
                            {artistName}
                        </Link>
                    </h5>
                    {(playerSize.height > 80 || playerSize.width > 480) && <div className="flex">
                        <div onClick={() => handleShuffleClick()}>
                            <SvgRandom className="svg" style={{ fill: shuffleState ? '#F230AA' : '#AFADAD' }} />
                        </div>
                        <div onClick={() => handleRepeatClick()}>
                            <SvgRepeat className="svg" repeat_state={repeatState} style={{ fill: repeatState === 1 || repeatState === 2 ? '#F230AA' : '#AFADAD' }} />
                        </div>
                    </div>}
                </div>
                    
                <div className="flex main_btns">
                    <div onClick={() => { player.previousTrack() }}>
                        <SvgPrevBtn className="svg" />
                    </div>

                    <div onClick={() => { player.togglePlay() }} >
                        <SvgPlayBtn is_paused={isPaused ? "true" : "false"} className="svg_medium"/>
                    </div>

                    <div>
                        <SvgNextBtn className="svg" onClick={() => { player.nextTrack() }} />
                    </div>

                    <div 
                    className="track-timeline bar" 
                    ref={trackTimelineRef} 
                    onClick={(e) => handleTimelineClick(e, trackTimelineRef)}>
                        <div className="track-listened" style={{ width: `${listened}%` }}></div>
                    </div>

                    <div onClick={() => setPlayerState({ isMute: !isMute })}> 
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
                    
                    {playerSize.height > 145 && <div className="flex social_btns">  
                            <CommentsManager
                            post={{track: post?.track, likes: post?.likes}}
                            setPost={setPost}/>
                        <div ref={shareBtnRef}>
                            <ShareBtnManager
                            content={formatListData([currentTrack], 'track')[0]}/>
                        </div>
                        <SaveTrackBtnManager 
                        trackId={trackId}/>
                    </div>} 
                </> 
            )
        })

        export default PlayerMinimized

