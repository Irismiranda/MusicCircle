import React, { useState, useEffect } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { SvgHeart } from "../../assets"
import { Reply } from ".."
import useStore from "../../store"
import { getUser } from "../../utils"
import { Axios } from "../../Axios-config"

const Comment = React.memo((props) => {
    const [replies, setReplies] = useState([])
    const [showReplies, setShowReplies] = useState(false)
    const [repliesLoaded, setRepliesLoaded] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [userData, setUserData] = useState(null)
    const [isNewReply, setIsNewReply] = useState(false)
    const [listening, setIsListening] = useState(false)

    const { 
        setPosts,
        post,
        comment, 
        comments,
        setComments,
        setReplyTo, 
        postId,
        setCommentsLoaded,
        scrollOnLoad,
        setScrollOnLoad,
        isNewComment,
    } = props

    const { text, likes, timestamp } = comment || {}

    const { loggedUser, socket } = useStore()

    const [params, setSearchParams] = useSearchParams()

    async function deleteComment(post_id, comment_id){       
        await Axios.post(`/api/${post_id}/delete_comment/${comment_id}`)
        setComments(comments.filter(comment => comment.comment_id !== comment_id))

        const updatedPost = {
            ...post,
            comments_count: post.comments_count - 1
        }

        setPosts(prevPosts => prevPosts.map((post) => post.post_id === updatedPost.post_id ? updatedPost : post))
    }

    async function handleData(data){       
        if(!userData){
            getUser(data.user_id, setUserData)
            setCommentsLoaded(prevCount => prevCount + 1)
        }
    }

    function handleReplies(data, call){
        if(call === "loadAllReplies"){
            setReplies(data)
        } else if (call === "loadNewReply" && data[0].reply_to.comment_id === comment.comment_id){
            setReplies((prevReplies) => {
                if (prevReplies.some((prevReply) => prevReply.reply_id === data[0].reply_id)) {
                    return prevReplies.map((prevReply) =>
                    prevReply.reply_id === data[0].reply_id ? data[0] : prevReply
                    )
                } else {
                    setIsNewReply(true)
                    return [...prevReplies, data[0]]
                }
            })
        }
    }

    function replyToComment(user_id, user_handle, comment_id){
        setReplyTo({user_id: user_id, comment_id: comment_id, user_handle: user_handle})
        setShowReplies(true)
    }

    async function likeComment(post_id, comment_id){       
        await Axios.post(`/api/${post_id}/toggle_like_comment/${comment_id}`, {
            logged_user_id: loggedUser.id
        })

        const updatedLikes = comment.likes ? [...comment.likes] : []

        if (updatedLikes.includes(loggedUser.id)) {
            updatedLikes.splice(updatedLikes.indexOf(loggedUser.id), 1);
        } else {
            updatedLikes.push(loggedUser.id)
        }

        const updatedComment = {...comment, likes: updatedLikes}
        
        setComments(comments
            .map(prevComment => prevComment.comment_id === comment_id ? updatedComment : prevComment))
    }

    useEffect(() => {
        comment && handleData(comment)
        if(scrollOnLoad && isNewComment){
            const newCommentElement = document.getElementById(comment.comment_id)
            newCommentElement.scrollIntoView({ behavior: "smooth", block: "end" })
            setScrollOnLoad(false)
        }
    }, [comment])
    
    useEffect(() => {
        if(repliesLoaded >= replies.length){
            setIsLoading(false)
        }
    }, [repliesLoaded])

    useEffect(() => {
        if(comment && !listening){
            socket?.emit('listenToReplies', { post_id: postId, comment_id: comment.comment_id })
            setIsListening(true)
        }
    
        return () => {
            socket?.emit('disconnectFromReplies', { comment_id: comment.comment_id })
        }
    }, [comment])


    useEffect(() => {
        socket?.on(`loadAllReplies_${comment.comment_id}`, (reply) => {
            if(!reply || reply?.length === 0){
                setIsLoading(false)
            } else {
                handleReplies(reply, 'loadAllReplies')
            }
        })

        return () => {
            socket?.off(`loadAllReplies_${comment.comment_id}`)
        }      
    }, [])

    useEffect(() => {
        socket?.on(`loadNewReply_${comment.comment_id}`, (reply) => {
            if(!reply || reply?.length === 0){
                return
            } else {
                handleReplies(reply, 'loadNewReply')
            } 
        })

        return () => {
            socket?.off(`loadNewReply_${comment.comment_id}`)
        }
    }, [])

    useEffect(() => {
        const commentParam = params?.get('comment')
        const replyParam = params?.get('reply')
       
        if(commentParam === comment.comment_id){
            const currentComment = document.getElementById(commentParam)
            
            currentComment.scrollIntoView({ behavior: "smooth", block: "center" })
            !replyParam && setSearchParams({})
        }
    }, [params])


    return (
        <section 
        id={comment.comment_id}
        key={comment?.comment_id}
        className="flex flex_column align_start full_width"
        style={{ gap: "15px" }}>
            <div 
            className="flex space_between">
                <div>
                    <Link to={`/account/${userData?.id}`}>
                        <div 
                        className="flex"
                        style={{ marginBottom: "15px" }}>
                            {
                            userData?.imgUrl ? 
                            <img 
                            className="profile_small"
                            src={userData?.imgUrl}/> :
                            <div className="profile_small"></div>
                            }
                            <h3>{userData?.name}</h3>
                        </div>
                    </Link>
                    <p>{text}</p>
                </div>
                <div
                onClick={() => likeComment(postId, comment?.comment_id)}>
                    <SvgHeart 
                    style={{ 
                        height: "15px",
                        marginRight: "20px",
                        fill: likes?.includes(loggedUser.id) ? '#AFADAD' : 'none', 
                        }}/>
                </div>
            </div>
            <div className="flex">
                <h5>{new Date(timestamp * 1000).toLocaleString()}</h5>
                <h5>{likes?.length || 0} Likes</h5>
                {(userData?.id !== loggedUser.id) && 
                <h5 
                className="pointer"
                onClick={() => replyToComment(userData.id, userData?.userHandle, comment?.comment_id)}>Reply</h5>}
                {(userData?.id === loggedUser.id) &&
                <h5
                className="pointer"
                onClick={() => deleteComment(postId, comment?.comment_id)}>Delete Comment</h5>}
            </div>
            {replies?.length > 0 && 
            <h4 
            className="pointer"
            onClick={() => setShowReplies(!showReplies)}> 
            {showReplies ? "Hide" : "View"} {replies?.length} replies </h4>}

            <section
            className="replies_section flex flex_column">
                {showReplies &&
                    replies 
                    .sort((a, b) => (b?.timestamp > a?.timestamp ? -1 : 1))
                    .map(reply => {
                        return (
                            <section
                            key={reply?.id}
                            className="full_width"
                            style={{ display: isLoading ? "none" : "" }}>
                                <Reply 
                                setPosts={setPosts}
                                post={post}
                                replies={replies}
                                setReplies={setReplies}
                                setRepliesLoaded={setRepliesLoaded}
                                reply={reply}
                                isNewReply={isNewReply}
                                setIsNewReply={setIsNewReply}
                                postId={postId}
                                replyToComment={replyToComment}
                                currentComment={comment}
                                scrollOnLoad={scrollOnLoad}
                                setScrollOnLoad={setScrollOnLoad}
                                />
                            </section>
                        )
                    })
                }
                {(isLoading && showReplies) &&
                    <div 
                    className="loading full_width"
                    style={{ height: "100px" }}>
                    </div>
                }
            </section>
        </section>
        )
})

export default Comment