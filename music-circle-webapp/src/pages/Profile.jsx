import React, { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import { Slider, Post } from "../components"
import { Axios } from "../Axios-config"
import { UserSearchSection, ShareMenu } from "../components"
import { ToggleFollowBtn, useClickOutside } from "../utils"
import { placeholder_img } from "../assets"
import useStore from "../store"

export default function Profile(){
    const { 
        standardWrapperWidth, 
        loggedUser, 
        userTopTracks, 
        userTopArtists, 
        setUserTopTracks, 
        setUserTopArtists, 
        userPosts,
        setUserPosts,
    } = useStore()
    const { userId } = useParams()
    const [isFIrstLoad, setIsFirstLoad] = useState(true)
    const [ isLoggedUser, setIsLoggedUser ] = useState(false)
    const [ userProfileData, setUserProfileData ] = useState(null)
    const [ topTracks, setTopTracks ] = useState(null)
    const [ topArtists, setTopArtists ] = useState(null)
    const [ posts, setPosts ] = useState(null)
    const [ showShareMenu, setShowShareMenu ] = useState(false)
    const [ showVisibleTopTracks, setShowVisibleTopTracks ] = useState(true)
    const [ showVisibleTopArtists, setShowVisibleTopArtists ] = useState(true)
    const [ isLoading, setIsLoading ] = useState(true)
    const [ userListVisibility, setUserListVisibility ] = useState({
        following: false,
        followers: false,
    })
    const followersRef = useRef(null)
    const followingRef = useRef(null)
    const sendMessageMenuRef = useRef(null)
    const sendMessageBtnRef = useRef(null)
        
    useClickOutside(sendMessageMenuRef, [sendMessageBtnRef], () => setShowShareMenu(false))

    async function getUser(id){
        const response = await Axios.get(`/api/user/${id}`)
        setUserProfileData(response.data)
        const topTracksList = await Axios.get(`/api/user/data/top_tracks/${id}`)
        const topArtistsList = await Axios.get(`/api/user/data/top_artists/${id}`)
        setTopTracks(topTracksList.data)
        setTopArtists(topArtistsList.data)
    }

    async function getPosts(userId){
        const response = await Axios.get(`/api/${userId}/user_posts`)
        setPosts(response.data)
        isLoggedUser && setUserPosts(response.data)
        setIsLoading(false)
    }

    function toggleVisibility(item){
        if(!isLoggedUser || !userProfileData) return
        
        item === "following" && setUserListVisibility({
            following: true,
            followers: false,
        })
        
        item === "followers" && setUserListVisibility({
            following: false,
            followers: true,
        })
    }
    
    async function hideSection(category){
        const response = await Axios.post(`/api/user/data/${category}/hide_category`, {
            userId: loggedUser.id
        })
        category === "top_artists" && setUserTopArtists(response.data)
        category === "top_tracks" && setUserTopTracks(response.data)
    }

    useEffect(() => {
        setIsLoading(true)
        setPosts(null)
        setTopTracks(null)
        setTopArtists(null)
        setUserProfileData(null)

        setUserListVisibility({
            following: false,
            followers: false,
        })

        userId && getUser(userId)
        if(userId === loggedUser?.id){
            setIsLoggedUser(true)
        } else{
            setIsLoggedUser(false)
            userId && getPosts(userId)
        }
    }, [userId, loggedUser])

    useEffect(() => {
        if(isLoggedUser && (userPosts.length === 0)){
            getPosts(userId)
            setIsFirstLoad(false)
        } else if(!isLoggedUser){
            setIsFirstLoad(true)
        }
    }, [isLoggedUser])

    useEffect(() => {
        if(isLoggedUser && userTopArtists){
            setTopArtists(userTopArtists)
        }
    }, [userTopArtists, isLoggedUser])
    
    useEffect(() => {
        if(isLoggedUser && userTopTracks){
            setTopTracks(userTopTracks)
        }
    }, [userTopTracks, isLoggedUser])

    useEffect(() => {
        if(isLoggedUser && !isFIrstLoad && userPosts){
            setPosts(userPosts)
        }
    }, [userPosts])

    useEffect(() => {
        if(topArtists?.items.filter(artist => !artist.isVisible).length === 0){
            setShowVisibleTopArtists(true)
        }
    }, [topArtists])

    useEffect(() => {
        if(topTracks?.items.filter(track => !track.isVisible).length === 0){
            setShowVisibleTopTracks(true)
        }
    }, [topTracks])

    return(
        <>
            {showShareMenu &&
            <div
            ref={sendMessageMenuRef} 
            className="wrapper windowed default_padding share_menu_wrapper"
            style={{ width: "375px", overflow: "visible" }}>
                <ShareMenu 
                isPost={false}
                hideUserList={true}
                closeMenu={() => setShowShareMenu(false)}
                sendTo={userProfileData.id}/>
            </div>
            }

            <div className="wrapper default_padding profile" style={{ width: standardWrapperWidth }}>
                {userListVisibility.following &&
                <UserSearchSection 
                idList={userProfileData?.following} 
                setUserProfileData={setUserProfileData}
                setUserListVisibility={setUserListVisibility}
                exceptionRef={followingRef}/>}

                {userListVisibility.followers &&
                <UserSearchSection 
                idList={userProfileData?.following_you} 
                setUserProfileData={setUserProfileData}
                setUserListVisibility={setUserListVisibility}
                exceptionRef={followersRef}/>}
                
                {userProfileData ? 
                <section 
                className="flex" 
                style={{ marginBottom: "30px" }}>
                    <img src={userProfileData?.images[1] ? `${userProfileData?.images[1].url}` : placeholder_img} 
                    className="profile_large" 
                    style={{ marginRight: "90px" }}/>

                    <div className="user_data_grid">
                        <h2>
                            {userProfileData?.display_name}
                            <br/>
                            <span className="user_handle">
                                @{userProfileData?.user_handle}
                            </span>
                        </h2>
                        {!isLoggedUser && 
                        <ToggleFollowBtn
                        className="follow_btn"
                        currentUserId={userId} 
                        loggedUser={loggedUser} 
                        setUserProfileData={setUserProfileData}/>}
                        {!isLoggedUser && 
                        <button 
                        ref={sendMessageBtnRef}
                        onClick={() => setShowShareMenu(true)}
                        className="message_btn">
                            Send Message
                        </button>}

                        <h3 
                        style={{ gridArea: "d" }}>
                            {posts?.length || 0} Posts
                        </h3>
                        <h3 
                        ref={followersRef}
                        onClick={() => { toggleVisibility("followers") }}
                        style={{ cursor: isLoggedUser ? "pointer" : "", textAlign: "center", gridArea: "e" }}> {userProfileData?.following_you?.length || 0} Followers 
                        </h3>
                        <h3 
                        ref={followingRef}
                        onClick={() => { toggleVisibility("following") }}
                        style={{ cursor: isLoggedUser ? "pointer" : "", textAlign: "end", gridArea: "f"  }}> {userProfileData?.following?.length || 0} Following 
                        </h3>

                    </div>
                </section> :
                <section 
                className="flex" 
                style={{ marginBottom: "30px", gap: "50px" }}>
                    <div className="profile_large loading_shimmer"></div>
                    <div className="flex flex_column align_start">
                        <div className="text_large_placeholder loading_shimmer"> </div>
                        <div className="text_small_placeholder loading_shimmer"> </div>
                    </div>
                </section>}

                <section className={ showVisibleTopArtists ? "flex space_between slider_wrapper aling_start" : "slider_wrapper flex space_between hidden_items_section aling_start" }>
                    <div className="flex aling_start">
                        {(topArtists?.show_top_artists || isLoggedUser) && <h2> Top Artists </h2>}
                        {(isLoggedUser && topArtists?.items.filter(artist => !artist.isVisible).length > 0) && 
                        <button 
                        className="toggle_btn"
                        onClick={() => setShowVisibleTopArtists(!showVisibleTopArtists)}>
                            {showVisibleTopArtists ? "Manage Hidden Artists" : "Show Artists" }
                        </button>}
                    </div>
                    {isLoggedUser && 
                    <button 
                    className="toggle_btn"
                    onClick={() => hideSection("top_artists")}>
                        {topArtists?.show_top_artists ? "Hide From My Profile" : "Show On My Porfile"}
                    </button>}
                </section>
                {((topArtists && 
                topArtists?.items.length > 0 && 
                (topArtists?.show_top_artists || isLoggedUser)) || isLoading) && 
                <section
                className={topArtists?.show_top_artists ? "relative" : "hidden_section relative"}>
                    <div 
                    className={showVisibleTopArtists ? "" : "hidden_items_grid"}>
                        <Slider 
                        isLoading={isLoading}
                        list={topArtists?.items} 
                        category={"artist"}
                        visibility={showVisibleTopArtists} 
                        isLoggedUser={isLoggedUser} 
                        type={showVisibleTopArtists ? "top_list" : "hidden_items_list"}/>
                    </div>
            </section>}
            <section className={ showVisibleTopTracks ? "slider_wrapper flex space_between aling_start" : "slider_wrapper flex space_between hidden_items_section aling_start" }>
                <div className="flex aling_start">
                    {(topTracks?.show_top_tracks || isLoggedUser) && <h2>  Top Tracks </h2>}
                    {(isLoggedUser && topTracks?.items.filter(track => !track.isVisible).length > 0) && 
                    <button 
                    className="toggle_btn"
                    onClick={() => setShowVisibleTopTracks(!showVisibleTopTracks)}>{showVisibleTopTracks ?  "Manage Hidden Tracks" : "Show Tracks"}</button>}
                </div>
                    {isLoggedUser && 
                    <button 
                    className="toggle_btn"
                    onClick={() => hideSection("top_tracks")}>
                        {topTracks?.show_top_tracks ? "Hide From my Profile" : "Show On My Profile"}
                    </button>}
            </section>
            {((topTracks && 
            topTracks?.items.length > 0 && 
            (topTracks?.show_top_tracks || isLoggedUser)) || isLoading) && 
            <section
            className={topTracks?.show_top_tracks ? "relative" : "hidden_section relative"}>
                    <div className={showVisibleTopTracks ? "" : "hidden_items_grid"}>
                        <Slider 
                        isLoading={isLoading}
                        list={topTracks?.items} 
                        category="track" 
                        visibility={showVisibleTopTracks} 
                        isLoggedUser={isLoggedUser} 
                        type={showVisibleTopTracks ? "top_list" : "hidden_items_list"}/>
                    </div>
            </section>}
            {(posts?.length > 0 || isLoading) && 
            <section 
            className="flex flex_column align_stretch"
            style={{ gap: "30px" }}>
            <h2> Posts </h2>
                { posts
                ?.sort((a, b) => (b?.time_stamp > a?.time_stamp ? 1 : -1))
                ?.map(post => {
                    return (
                        <Post 
                        isLoading={isLoading}
                        data={post}
                        posts={posts}
                        isLoggedUser={isLoggedUser} 
                        setPosts={setPosts}/>        
                    )
                })
                }
            </section>}
            </div>
        </>
    )
}
