import React, { useState, useEffect } from "react"
import { SvgRightBtn, SvgLeftBtn } from "../assets"

export default function SliderScrollBtns(props){
    const [ maxScrollLeft, setMaxScrollLeft ] = useState(0)
    const [ listScroll, setListScroll ] = useState(0)

    const { parentRef, list, visibility } = props

    function slideLeft(){
        parentRef.current.scrollBy({ left: - 500, behavior: 'smooth' })
    }
    
    function slideRight(){
        parentRef.current.scrollBy({ left: 500, behavior: 'smooth' })
    }

    useEffect(() => {
        if(parentRef.current){
            const maxScroll = parentRef.current.scrollWidth - parentRef.current.clientWidth
            setMaxScrollLeft(maxScroll)
        }
    }, [list])

    useEffect(() => {
        const handleScroll = () => {
            if (parentRef.current) {
                setListScroll(parentRef.current.scrollLeft)
            }
        }
    
        const sliderElement = parentRef.current
        if (sliderElement) sliderElement.addEventListener('scroll', handleScroll)
    
        return () => {
            if (sliderElement) sliderElement.removeEventListener('scroll', handleScroll)
        }
    }, [list, visibility])

    return (
        <>
            {(listScroll >= 100) && 
                <div className="btn_wrapper_left" onClick={() => slideLeft()}>
            <SvgLeftBtn className="svg_left_right"/>
            </div>}
            {(listScroll <= (maxScrollLeft - 100)) && 
                <div className="btn_wrapper_right" onClick={() => slideRight()}>
                <SvgRightBtn className="svg_left_right"/>
            </div>}
        </>
    )
  }