import React, { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import useStore from "../../store"
import { Axios } from "../../Axios-config"
import { SvgHeart } from "../../assets"
import { getUser } from "../../utils"

const Reply = React.memo((props) => {
    const { 
        setPosts,
        post,
        replies,
        setReplies,
        setRepliesLoaded,
        reply,
        isNewReply,
        setIsNewReply,
        postId, 
        replyToComment, 
        currentComment,
        scrollOnLoad,
        setScrollOnLoad,
    } = props

    const { loggedUser } = useStore()
    const [ user, setUser ] = useState(null)
    
    const [params, setSearchParams] = useSearchParams()

    async function handleReplies(user_id){   
        if(!user){
            getUser(user_id, setUser)
            setRepliesLoaded(prevCount => prevCount + 1)
        }

        if(scrollOnLoad && isNewReply){
            const newReplyElement = document.getElementById(reply.reply_id)
            newReplyElement.scrollIntoView({ behavior: "smooth", block: "end" })
            setScrollOnLoad(false)
            setIsNewReply(false)
        }
    }

    async function deleteReply(post_id, comment_id, reply_id){
        await Axios.post(`/api/${post_id}/delete_reply/${comment_id}/${reply_id}`)

        const updatedReplies = replies.filter(reply => reply.reply_id !== reply_id)
        
        setReplies(updatedReplies)

        const updatedPost = {
            ...post,
            comments_count: post.comments_count - 1
        }

        setPosts(prevPosts => prevPosts.map((post) => post.post_id === updatedPost.post_id ? updatedPost : post))


    }

    async function likeReply(post_id, comment_id, reply_id){
        await Axios.post(`/api/${post_id}/toggle_like_reply/${comment_id}/${reply_id}`, {
            logged_user_id: loggedUser.id
        })

        const udatedLikes = reply.likes?.includes(loggedUser.id) ?
        reply.likes.filter(like => like !== loggedUser.id) :
        [...(reply.likes || []), loggedUser.id]

        const updatedReply = {...reply, likes: udatedLikes}

        setReplies(prevReplies => prevReplies
            .map(prevReply => {
                return prevReply.reply_id === reply_id ?
                updatedReply :
                prevReply
            }))
    }

    useEffect(() => {
        if(reply){
            handleReplies(reply.user_id)
        }
    }, [reply])

    useEffect(() => {
        const replyParam = params?.get('reply')
        if(replyParam === reply.reply_id){
            const currentReply = document.getElementById(replyParam)
            currentReply.scrollIntoView({ behavior: "smooth", block: "end" })
            setSearchParams({})
        }

    }, [params])

    return (
        reply &&
        <section 
        id={reply.reply_id}
        key={reply.reply_id}
        className="full_width"
        style={{ minWidth: "70px" }}>
            <div 
            className="flex space_between">
                <div>
                    <Link to={`/account/${user?.id}`}>
                        <div className="flex"
                        style={{ marginBottom: "10px" }}>
                            {
                            user?.imgUrl ? 
                            <img 
                            className="profile_small"
                            src={user.imgUrl}/> :
                            <div className="profile_small"></div>
                            }
                            <h3>{user?.name}</h3>
                        </div>
                    </Link>
                    <p
                    style={{ margin: "10px 0" }}>
                        {reply?.reply_to && 
                        <a 
                        className="user_handle"
                        style={{ maxWidth: "340px", marginBottom: "4px" }}
                        href={`/account/${reply.reply_to.user_id}`}>
                            @{reply?.reply_to.user_handle}
                        </a>} 
                        {reply?.text}
                    </p>
                </div>
                <div
                onClick={() => likeReply(postId, currentComment?.comment_id, reply.reply_id)}>
                    <SvgHeart 
                    style={{ 
                        height: "15px",
                        marginRight: "20px",
                        fill: reply?.likes?.includes(loggedUser.id) ? '#AFADAD' : 'none',
                        }}/>
                </div>
            </div>
            <div className="flex">
                <h4>{new Date(reply?.timestamp * 1000).toLocaleString()}</h4>
                <h4>{reply.likes?.length || 0} Likes</h4>
                {(user?.id !== loggedUser.id) && 
                <h4 
                className="pointer"
                onClick={() => replyToComment(user?.id, user?.userHandle, currentComment?.comment_id)}>
                    Reply
                </h4>}
                {(user?.id === loggedUser.id) &&
                <h4 
                className="pointer"
                onClick={() => deleteReply(postId, currentComment?.comment_id, reply.reply_id)}>
                    Delete Comment
                </h4>}
            </div>
        </section>
        )
        
})

export default Reply