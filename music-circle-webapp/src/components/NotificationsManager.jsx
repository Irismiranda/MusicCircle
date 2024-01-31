import React, { useEffect, useState } from "react"
import { Outlet, useNavigate } from "react-router-dom"
import useStore from "../store"

export default function NotificationsManager(){
    const [notificationsCount, setNotificationsCount] = useState(null)
    const { 
        setSelectedNotification, 
        setNotifications, 
        updateNotifications, 
        selectedNotification, 
        notifications, 
        socket, 
        loggedUser 
    } = useStore()

    const navigate = useNavigate()

    function handleSelectedNotification(){
        const {poster_id, content_id, comment_id, reply_id, notification_type} = selectedNotification
        console.log(selectedNotification)
        if(notification_type === 'comment'){
            if(poster_id){
                navigate(`account/${poster_id}?post=${content_id}&&comment=${comment_id}`)
            } else {
                navigate(`?post=${content_id}&&comment=${comment_id}`)
            } 
        } else if(notification_type === 'reply'){
            if(poster_id){
                navigate(`account/${poster_id}?post=${content_id}&&comment=${comment_id}&&reply=${reply_id}`)
            } else {
                navigate(`?post=${content_id}&&comment=${comment_id}&&reply=${reply_id}`)
            }
        } else if(notification_type === 'like'){
            if(poster_id){
                navigate(`account/${poster_id}?post=${content_id}${comment_id ? `&&comment=${comment_id}` : ""}${reply_id ? `&&reply=${reply_id}` : ""}`)
            } else {
                navigate(`?post=${content_id}&&comment=${comment_id}&&reply=${reply_id}`)
            }
        } else if(notification_type === 'inbox'){
            navigate(`inbox?chat=${content_id}`)
        } else if(notification_type === 'follow'){
            navigate(`account/${user}`)
        }
        setSelectedNotification(null)
    }

    useEffect(() => {
        selectedNotification && handleSelectedNotification()
    }, [selectedNotification])

    useEffect(() => {
        if(loggedUser){
            socket?.emit('listenToUserNotifications', { user_id: loggedUser.id })
        }

        return () => {
            if(loggedUser){
                socket?.emit('disconnectUserNotifications', { user_id: loggedUser.id })
            }
        }
    }, [loggedUser, socket])

    useEffect(() => {
        socket?.on('loadAllNotifications', (data => {
            setNotifications(data)
        }))

        return () => {
            socket?.off(`loadAllNotifications`)
        }   
    }, [socket])

    useEffect(() => {
        socket?.on('loadNewNotification', (data => {
            updateNotifications(data)
        }))

        return () => {
            socket?.off(`loadNewNotification`)
        }   
    }, [socket])

    useEffect(() => {
        if(notifications){
            const count = notifications.filter(not => not.marked_as_read === false).length
            if(count > 0){
                setNotificationsCount(count)
            } else if(notificationsCount){
                setNotificationsCount(null)
            }
        }    
    }, [notifications])

    useEffect(() => {
    }, [notifications])

    return (
        <>
            {notificationsCount && 
                <div
                className="notifications_count">
                <h5>{notificationsCount}</h5>
            </div>
            }
            <Outlet />
        </>
    )

}