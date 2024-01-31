import React, { useEffect, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { SvgRightIcon, SvgLeftIcon } from "../assets"
import useStore from "../store"

export default function AppManager(){
    const { standardWrapperWidth, currentTrack } = useStore()
    const [showTransparentMenu, setShowTransparentMenu] = useState(false)

    const location = useLocation()
    const navigate = useNavigate()

    function nextPage(){
        navigate(1)
    }

    function prevPage(){
        navigate(-1)
    }

    useEffect(() => {
        window.scrollTo({top: 0, behavior: 'smooth'})
    }, [location])

    useEffect(() => {
        const path = location.pathname

         if(path.includes('inbox') || path.includes('account') || (path === "/" && !currentTrack)){
            setShowTransparentMenu(false)
        } else {
            setShowTransparentMenu(true)
        }
    }, [location, currentTrack])

    return(
        <>
            <section
            className={`${showTransparentMenu ? "prev_next_transparent_menu relative" : "prev_next_btn_wrapper wrapper"} flex flex_column align_start`}
            style={{ width: standardWrapperWidth }}>
                <div 
                className="flex">
                    <div>
                        <SvgLeftIcon 
                        className="svg_large pointer"
                        onClick={() => prevPage()}/>
                    </div>
                    <div>
                        <SvgRightIcon 
                        className="svg_large pointer"
                        onClick={() => nextPage()}/>
                    </div>
                </div>
                {showTransparentMenu && <hr />}
            </section>
            <Outlet />
        </>
    )
}