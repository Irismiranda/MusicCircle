import React from "react"

export default function Error(){
    return (
        <div 
        className="flex justify_center align_center"
        style={{ width: "100%", height: "100vh"}}>
            <h2> We are sorry, but it seems like you have a free Spotify account 🥺 </h2> 
            <br/>
            <h4> Our application works with Premium accounts only for now </h4>
        </div>
    )
}