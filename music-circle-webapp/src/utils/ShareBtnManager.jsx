import React, { useState, useRef } from "react"
import { SvgShareBtn } from "../assets"
import { ShareMenu } from "../components"
import { useClickOutside } from "."

export default function ShareBtnManager(props){
    const [isShareMenuVisibile, setIsShareMenuVisibile] = useState(false)
    const shareMenuRef = useRef(null)
    const shareBtnRef = useRef(null)

    const { content } = props

    useClickOutside(shareMenuRef, [shareBtnRef], () => setIsShareMenuVisibile(false))

    return (
        <section
        className="relative">
            {isShareMenuVisibile && 
            <div 
            ref={shareMenuRef}
            className="share_menu_wrapper wrapper windowed">
                
                <ShareMenu 
                content={content}
                closeMenu={() => setIsShareMenuVisibile(false)}
                isPost={true}/>
            </div>}
            <div 
            ref={shareBtnRef}>
                <SvgShareBtn 
                className="svg" 
                onClick={() => setIsShareMenuVisibile(!isShareMenuVisibile)}/>
            </div>
        </section>
    )
  }