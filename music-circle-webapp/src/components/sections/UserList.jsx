import React, { useRef } from "react"
import { Link } from "react-router-dom"
import { ToggleFollowBtn } from "../../utils"

export default function UserList(props){
    const { list, setUserProfileData, setPreventUpdate, showBtn, isLoading } = props
    const placeholderAreaRef = useRef(null)

    function toggleTransparency(e){
        setPreventUpdate(true)
        const parentDiv = e.currentTarget.parentElement
        parentDiv.classList.toggle("hidden_section")
    }

    return !isLoading ? (
        <section className="list_items_wrapper">
            {list && list.length > 0 ? (
                list.map((user) => (
                    <div 
                    key={user.id}
                    className="user_list_grid">
                        <Link to={`/account/${user.id}`}>
                            {
                            user?.imgUrl ? <img 
                            className="profile_small"
                            src={user.imgUrl}/> :
                            <div className="profile_small"></div>
                            }
                        </Link>
                        <Link to={`/account/${user.id}`}>
                            <h3>
                                {user.name}
                                <br />
                                <span className="user_handle">
                                    @{user.userHandle}
                                </span>
                            </h3>
                        </Link>
                        {showBtn && (
                            <div
                                className="flex"
                                style={{ justifyContent: "end" }}
                                onClick={(e) => toggleTransparency(e)}
                            >
                                <ToggleFollowBtn
                                    currentUserId={user.id}
                                    setUserProfileData={setUserProfileData}
                                />
                            </div>
                        )}
                    </div>  
                ))
            ) : (
                <h3>Nothing to see here...</h3>
            )}
        </section>
    ) :
    (
        <section 
        className="list_items_wrapper"
        ref={placeholderAreaRef}>
            {Array.from({ length: Math.ceil(placeholderAreaRef.current?.clientHeight / 60) }, (_, index) => (
                    <div 
                    className="flex"
                    key={index}>
                        <div className="profile_small loading_shimmer"> </div>
                        <div className="flex flex_column align_start"> 
                            <div className="text_medium_placeholder loading_shimmer"> </div>
                            <div className="text_small_placeholder loading_shimmer"> </div>
                        </div>
                    </div>
                ))}
        </section>
    )
    }      
