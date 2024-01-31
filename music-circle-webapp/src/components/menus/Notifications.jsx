import React, { useEffect } from "react"
import { Notification } from "../"
import useStore from "../../store"

export default function Notifications(){
    const { notifications } = useStore()
    
    return (
        <>
            {notifications &&
            <div>
                {notifications.map(notification => <Notification data={notification}/>)}
            </div>}
        </>
    )
}

