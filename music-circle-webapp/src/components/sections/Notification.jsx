import React, { useState, useEffect } from "react"
import { getUser } from "../../utils"
import { Axios } from "../../Axios-config"
import useStore from "../../store"
import { SvgCommentBtn, SvgHeart, SvgFollowerIcon } from "../../assets"
import { Link } from "react-router-dom"

export default function Notification(props){
    const [userData, setUserData] = useState(null)
    const { loggedUser, setSelectedNotification } = useStore()
     
    const { data } = props

    const messages = {
        like: 'liked your',
        inbox: 'sent you a',
        follow: 'started following you',
        comment: 'commented on your',
        reply: 'replied to your',
    }

    const icons = {
        like: <SvgHeart className="svg"/>,
        inbox: <SvgCommentBtn className="svg"/>,
        follow: <SvgFollowerIcon className="svg_medium"/>,
        comment: <SvgCommentBtn className="svg"/>,
        reply: <SvgCommentBtn className="svg"/>,
    }

    async function handleClick(notification_id){
        if(!data.marked_as_read){
            await Axios.post(`api/${loggedUser.id}/toggle_marked_as_read/${notification_id}`)
        }
        setSelectedNotification(data) 
    }

    useEffect(() => { 
        getUser(data.user, setUserData)
    }, [data])

    return (
        <>
            <div 
            key={data.id}
            onClick={() => handleClick(data.id, data.content_id, data.data_type)}
            className={`flex relative ${userData ? "notification_wrapper" : ""} ${!data.marked_as_read ? "notification_section" : ""}`}>
                {userData ?
                <>
                    <Link to={`account/${data.user}`}>
                        {userData?.imgUrl ? 
                        <img 
                        className="profile_small"
                        src={userData?.imgUrl}/> :
                        <div className="profile_small"></div>
                        }
                    </Link>
                    <div>
                        <p>
                            {`${userData.name} ${messages[data.notification_type]} ${data.data_type ? data.data_type : ""}`}
                        </p>
                        <h6>{new Date(data.time_stamp * 1000).toLocaleString()}</h6>
                    </div>
                    <div>
                        {icons[data.notification_type]}
                    </div>
                </>
                 : 
                <div className="full_width flex">
                    <div className="profile_small loading_shimmer"> </div>
                    <div className="flex flex_column align_start"> 
                        <div className="text_medium_placeholder loading_shimmer"> </div>
                        <div className="text_small_placeholder loading_shimmer"> </div>
                        <div className="text_small_placeholder loading_shimmer"> </div>
                    </div>                
                </div>
                }

            </div>
        <hr />
    </>
    )
}

