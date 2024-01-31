import React, { useEffect, useRef, useState } from "react"
import { useClickOutside } from "../../utils"
import { UserList } from "../"
import { Axios } from "../../Axios-config"
import { formatListData } from "../../utils"
import { normalizeText } from "normalize-text"

export default function UserSearchSection(props){
    const { idList, setUserProfileData, setUserListVisibility, exceptionRef } = props
    const [userDataList, setUserDataList] = useState(null)
    const [searchResult, setSearchResult] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [preventUpdate, setPreventUpdate] = useState(false)
    const userListRef = useRef(null)
    const userSearchInputRef = useRef(null)

    
    useClickOutside(userListRef, [exceptionRef], () => setUserListVisibility({
        following: false,
        followers: false,
    }))
    
    async function getUsersData(){
        setIsLoading(true)
        const userList = []
        await Promise.all(
            idList.slice(0, 15).map(async (id) => {
                const response = await Axios.get(`/api/user/${id}`)
                userList.push(response.data)
            })
            )
            
            const formatedData = formatListData(userList, "user")

        setUserDataList(formatedData)
        setSearchResult(formatedData)
        setIsLoading(false)
    }

    async function searchUsers() {
        setIsLoading(true)
        const searchTerm = userSearchInputRef.current.value?.toLowerCase() 
        const normalizedSearchTerm = normalizeText(searchTerm)       
        let searchResults
        
        if (searchTerm === "") {
            searchResults = userDataList.slice(15)
        } else {
            searchResults = userDataList.filter((user) =>
            normalizeText(user.userHandle).toLowerCase().includes(normalizedSearchTerm) ||
            normalizeText(user.name).toLowerCase().includes(normalizedSearchTerm)
            )
        }
        
        setSearchResult(searchResults)
        setIsLoading(false)
    }

    useEffect(() => {
        if(!preventUpdate && idList){
            getUsersData()
        }
    }, [idList])

    return (
        <div ref={userListRef} 
        className="user_list_wrapper windowed wrapper default_padding flex flex_column">
            <input 
            ref={userSearchInputRef} 
            className="search_bar" 
            placeholder="Search..." 
            onInput={() => searchUsers()} />   

            <UserList
            isLoading={isLoading}
            list={searchResult}
            setUserProfileData={setUserProfileData}
            setPreventUpdate={setPreventUpdate}
            showBtn={true}/>
        </div>
      )
    }      
