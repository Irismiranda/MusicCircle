import React, { useEffect, useState } from "react"
import useStore from "../store"
import { Axios } from "../Axios-config"
import { useParams } from "react-router-dom"

export default function ToggleFollowBtn(props){
    const { currentUserId, setUserProfileData } = props
    const [ isFollowing, setIsFollowing ] = useState(false)
    const { setLoggedUser, loggedUser } = useStore()
    const { userId } = useParams()
    
    async function getIsFollowing(id){
        const response = await Axios.get(`/api/${loggedUser.id}/is_following/${id}`)
        setIsFollowing(response.data)
    }

    async function toggleFollow(id){
        const response = await Axios.post(`/api/${loggedUser.id}/toggle_follow/${id}`)
        setIsFollowing(response.data.isFollowing)
        setLoggedUser(response.data.updatedLoggedUser)
        if(userId === loggedUser.id){
            setUserProfileData(response.data.updatedLoggedUser)
        } else {
            setUserProfileData(response.data.updatedCurrentUser)
        }
        
        const stringData = JSON.stringify(response.data.updatedLoggedUser)
        localStorage.setItem("loggedUser", stringData)
    }

    useEffect(() => {
        if(loggedUser){
            getIsFollowing(currentUserId)
        }
    }, [currentUserId, loggedUser])

    return (
        <>
            <button onClick={() => toggleFollow(currentUserId)}> {isFollowing ? "Following" : "Follow"} </button>
        </>
    )
  }