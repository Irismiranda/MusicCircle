import React, { useEffect, useRef, useState } from "react"
import useStore from "../../store"
import { Link } from "react-router-dom"
import { Axios } from "../../Axios-config"
import { SvgDots, SvgHeart } from "../../assets"
import { PlayBtnManager, ShareBtnManager, CommentsManager, formatListData, useClickOutside, getUser } from "../../utils"

export default function Post(props){
    const { spotifyApi, loggedUser, deleteUserPost } = useStore()
    const [track, setTrack] = useState(null)
    const [hoverItemId, setHoverItemId] = useState(null)
    const [user, setUser] = useState(null)
    const [showMenuVisibility, setShowMenuVisibility] = useState(false)
    const [isPostVisible, setIsPostVisible] = useState(false)
    
    const { isLoading, data, isLoggedUser, setPosts, posts } = props

    const dropMenuRef = useRef(null)
    const dotsIconRef = useRef(null)

    useClickOutside(dropMenuRef, [dotsIconRef], () => setShowMenuVisibility(false))

    async function getTrack(){
        const track = await spotifyApi.getTrack(data.id)
        const formatedTrack = formatListData([track], data.type)
        setTrack(formatedTrack[0])
    }

    async function toggleHidePost(post_id){
        try {
            const response = await Axios.post(`/api/${loggedUser.id}/${post_id}/toggle_hide_post`)
            const updatedPost = response.data

            setPosts(prevPosts => prevPosts.map(post => post.post_id === updatedPost.post_id ? updatedPost : post))
            setShowMenuVisibility(false)
          } catch (error) {
            console.log("Toggle hide post error:", error)
          }
    }

    async function likePost(post_id){
        await Axios.post(`/api/toggle_like_post/${post_id}`, {
            logged_user_id: loggedUser.id
        })

        const updatedLikes = data.likes?.includes(loggedUser.id) ?
        data.likes?.filter(like => like !== loggedUser.id) :
        [...(data.likes || []), loggedUser.id]

        const updatedPost = {
            ...data, 
            likes: updatedLikes
        }

        setPosts(prevPosts => prevPosts
            .map( post => post.post_id === post_id ? updatedPost : post))
    }    

    async function deletePost(post_id){
        try {
            await Axios.post(`/api/${post_id}/delete_post`)

            deleteUserPost(post_id)
            setShowMenuVisibility(false)
          } catch (error) {
            console.log("Delete post error:", error)
          }
    }

    useEffect(() => {
        if(data.id){
            getTrack()
            getUser(data.user_id, setUser)
        }
    }, [data])

    return !isLoading ? (
        (track && (!data.hide_post || isLoggedUser)) && (
            <section
            className="inner_wrapper relative full_width"
            style={{ padding: "0px 20px 0px 0px" }}>
                <div 
                    key={data.post_id}
                    className={data.hide_post ? "transparent_section flex" : "flex"}>
                    <div 
                        className="cover_large cover_post"
                        style={{ backgroundImage: `url('${track.imgUrl}')`}}
                        onMouseEnter={() => setHoverItemId(track.id)}
                        onMouseLeave={() => setHoverItemId(null)}>
                        <div 
                        onMouseEnter={() => setHoverItemId(track.id)}>
                            <PlayBtnManager 
                                uri={`spotify:${track.type}:${track.id}`} 
                                id={track.id}
                                category={"cover"} 
                                type={track.type} 
                                hoverItemId={hoverItemId}
                            />
                        </div>
                    </div>
                    <div className="grid post_grid">
                        <div className="flex space_between full_width">
                            <h3>{track.name} 
                            {track.type !== "artist" && <span> by <Link to={`/artist/${track.artist_id}`}>{track.artist_name}</Link></span>}
                            </h3>
                            {isLoggedUser && 
                            <div ref={dotsIconRef}>
                                <SvgDots 
                                className="svg"
                                onClick={() => setShowMenuVisibility(!showMenuVisibility)}/>
                            </div>
                            }
                        </div>
                        {showMenuVisibility && 
                        <div
                        ref={dropMenuRef} 
                        className="wrapper default_padding post_drop_menu">
                            <h3 onClick={() => toggleHidePost(data?.post_id)}>{data?.hide_post ? "Show Post" : "Hide Post"}</h3>
                            <hr />
                            <h3 onClick={() => deletePost(data?.post_id)}>Delete Post</h3>
                        </div>}
                        
                        <div 
                        className="flex"
                        style={{ marginBottom: "10px" }}>
                            <Link to={`/account/${user?.id}`}>
                            {
                            user?.imgUrl ? 
                            <img 
                            className="profile_small"
                            src={user.imgUrl}/> :
                            <div className="profile_small"></div>
                            }
                            </Link>
                            <Link to={`/account/${user?.id}`}>
                                <h4>{user?.name}</h4>
                                <h5>{new Date(data?.time_stamp * 1000).toLocaleString()}</h5>
                            </Link>
                        </div>

                        <p>{data.description}</p>
                        
                        <div 
                        className="flex">
                            <h4>{data?.likes?.length || 0} Likes</h4>
                            <h4 onClick={() => setIsPostVisible()}>{data?.comments_count || 0} Comments</h4>
                            <div
                            onClick={() => likePost(data?.post_id)}>
                                <SvgHeart
                                style={{ 
                                    height: "15px",
                                    fill: data?.likes?.includes(loggedUser.id) ? '#AFADAD' : 'none'
                                    }}/>
                            </div>
                        </div>
                        
                    </div>
                </div>
                <div
                className="absolute flex"
                style={{ right: "20px", bottom: "20px" }}>   
                    <CommentsManager 
                    setIsPostVisible={setIsPostVisible}
                    isPostVisible={isPostVisible}
                    post={{...data, track: track, user: user}} 
                    setPosts={setPosts}
                    posts={posts}
                    />
                    <ShareBtnManager 
                    content={data}/>
                </div>
            </section>
        )
    ) : (
    <>
        {Array.from({ length: Math.ceil((window.innerHeight - 400) / 150) }, (_, index) => (
            <section 
            className="relative inner_wrapper full_width flex gap"
            style={{ padding: "0px 20px 0px 0px" }}>
                <div className="cover_post cover_large loading_shimmer"></div>
                <div className="flex flex_column gap">
                    <div className="text_medium_placeholder loading_shimmer"></div>
                    <div className="flex">
                        <div className="profile_small loading_shimmer"></div>
                        <div className="flex flex_column">
                            <div className="text_small_placeholder loading_shimmer"></div>
                            <div className="text_small_placeholder loading_shimmer"></div>
                        </div>
                    </div>
                </div>
            </section>
        ))}
    </>
    )
    
}