import React, { useRef, useState } from "react"
import { SvgLogoutIcon, SvgDeleteAccount } from "../../assets"
import { useClickOutside } from "../../utils"
import { Axios } from "../../Axios-config"
import useStore from "../../store"
import Cookies from 'js-cookie'
import { useNavigate } from "react-router-dom"

export default function More(){
    const [showWindow, setShowWindow] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showMessage, setShowMessage] = useState(false)
    const { loggedUser } = useStore()
    const deleteAccWindowRef = useRef(null)
    const deleteAccBtnRef = useRef(null)

    useClickOutside(deleteAccWindowRef, [deleteAccBtnRef], () => setShowWindow(false))
    const navigate = useNavigate()

    function logOut(){
        Cookies.remove('storedAccessToken', { path: '' })
        Cookies.remove('storedRefreshToken', { path: '' })
        Cookies.remove('connect.sid', { path: '' })
        localStorage.removeItem("loggedUser")
        navigate('/welcome')
    }

    async function deleteAcc(){
        setIsLoading(true)
        await Axios.get(`/delete_acc/${loggedUser}`)
        setIsLoading(false)
        setShowMessage(true)
        setTimeout(() => logOut(), 5000)
    }

    return (
        <>
            <div 
            className="flex space_between"
            onClick={logOut}>
                <h3> Log Out </h3>
                <SvgLogoutIcon 
                className="svg_medium"/>
            </div>
            <hr style={{ margin: "0px" }} />
            <div
            ref={deleteAccBtnRef}
            onClick={() => setShowWindow(true)}
            className="flex space_between">
                <h3> Delete My Account </h3>
                <SvgDeleteAccount
                className="svg_medium"/>
            </div>

            {showWindow && 
            <section
            ref={deleteAccWindowRef} 
            className={`text_align_center windowed wrapper justify_center default_padding flex flex_column gap ${isLoading ? "loading" : ""}`}
            style={{ width: "500px", minHeight: "265px" }}>
                {(!showMessage && !isLoading) &&
                <div>
                    <h3> Are you sure that you want to delete your account? </h3>
                    <h5>{`We are sad to see you go :(`}</h5>
                    <p> 
                        We will loose access to all yous Spotify data.
                        <br/> 
                        Your posts and inbox messages will also be permanently deleted. 
                    </p>
                    <div 
                    className="flex justify_center"
                    style={{ marginTop: "30px" }}>
                        <button 
                        style={{ width: "120px" }}
                        onClick={deleteAcc}>
                            Confirm
                        </button> 
                        <button
                        style={{ width: "120px" }}
                        onClick={() => setShowWindow(false)}>
                            Cancel
                        </button> 
                    </div>
                </div>}
                {(showMessage && !isLoading) && 
                <h2>Account Deleted ✓</h2>
                }
            </section>}
        </>
    )
}
