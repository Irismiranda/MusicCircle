import React, { useEffect, useState } from "react"
import useStore from "../../store"
import { Axios } from "../../Axios-config"
import { Post } from ".."

export default function Feed(){
    const [index, setIndex] = useState(0)
    const [posts, setPosts] = useState(null)
    const [noMorePosts, setNoMorePosts] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    
    const { standardWrapperWidth, loggedUser } = useStore()

    async function getPosts(index, user_ids){
        setIsLoading(true)
        const postsArr = await Axios.post(`api/posts_feed/${index}`, {user_ids: user_ids})
            
        if(postsArr.data?.posts?.length > 0){
            setPosts(postsArr.data.posts)
            setIndex(prevIndex => prevIndex + 10)
        } else {
            setNoMorePosts(true)
        }
        setTimeout(() => setIsLoading(false), 3000)
    }

    const handleScroll = () => {
        const scrollHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop

        if (scrollHeight - scrollPosition <= windowHeight + 100) {
            getPosts(index, loggedUser?.following)
        }
    }

    useEffect(() => {
    window.addEventListener('scroll', handleScroll)

    return () => {
        window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    useEffect(() => {
        loggedUser && getPosts(index, loggedUser.following)
    }, [loggedUser])

    return (
        <div 
        className="wrapper default_padding relative flex flex_column justify_center gap" 
        style={{ 
            width: standardWrapperWidth,
            minHeight: "calc(100vh - 100px)",
            justifyContent: "start",
            }}>
            { posts && posts.map(post => {
                return (
                    <Post 
                    key={post.id}
                    isLoading={isLoading}
                    data={post}
                    posts={posts}
                    isLoggedUser={false} 
                    setPosts={setPosts}/>        
                )
            })
            }
            {isLoading && 
            <div className="loading_feed"></div>
            }
            { noMorePosts &&
            <div className="text_align_center">
                <h3>We have no more posts to show. Maybe you should go make new friends?</h3>
            </div>
            }
        </div>
    )
}