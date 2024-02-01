import React, { useEffect } from "react"
import { Notification } from "../"
import useStore from "../../store"

export default function Notifications(){
    const { notifications } = useStore()

    return (
        <>
            {notifications &&
            <div>
                {notifications
                .sort((a, b) => a.time_stamp > b.time_stamp ? -1 : 1)
                .map(notification => <Notification key={notification.id} data={notification}/>)}
            </div>}
        </>
    )
}

