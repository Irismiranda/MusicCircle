import React from 'react'
import Cookies from 'js-cookie'
import { Axios } from "../Axios-config"
import { musiccircle_tela1, musiccircle_tela2, musiccircle_tela3, musiccircle_tela4 } from "../assets"

export default function Welcome() {
    const storedAccessToken = Cookies.get('storedAccessToken')
    const storedRefreshToken = Cookies.get('storedRefreshToken')
    
    async function login() {
        const response = await Axios.get("/auth/login");
        const redirectURL = response.data
        window.location.href = redirectURL                
    }

    if(storedAccessToken || storedRefreshToken){
        window.location.href = 'http://localhost:5173/'
        return null
    } else return (      
        <section
        className='welcome_page full_height_vh'>
            <div className='flex'>
                <img 
                src={musiccircle_tela1} 
                style={{ zIndex: "4", left: "40%", top: "57vh", }}/>

                <img 
                src={musiccircle_tela2} 
                style={{ zIndex: "3", left: "-8%", top: "47vh"  }}/>

                <img 
                src={musiccircle_tela3}
                style={{ zIndex: "2", left: "-56%", top: "37vh"  }} />

                <img 
                src={musiccircle_tela4} 
                style={{ zIndex: "1", left: "-104%", top: "27vh"  }}/>

            </div>
            <div>

            </div>
            <button onClick={login}>login with Spotify</button>      
        </section>
        
    )
}
