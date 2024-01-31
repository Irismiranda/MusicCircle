import { useEffect } from 'react'
import { placeholder_img } from "../assets"
import { Axios } from '../Axios-config'

const useClickOutside = (ref, exceptionRefs, callback) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!ref?.current?.contains(event.target)) {
        if (!exceptionRefs.some((ref) => ref?.current?.contains(event.target))) {
          callback()
        } else if(!exceptionRefs){
          callback()
        } 
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [ref, callback])
}

function formatListData(items, category) {

  return items.map(item => {   
    let listItem = {
      id: item.id,
      type: item.type,
      uri: item.uri,
      name: item.type === "user" ? item.display_name : item.name,
      isVisible: true,
    }

    if (category !== "simplified") {
      if (category === "track") {
        listItem.imgUrl = item.album.images[0].url
      } else {
        listItem.imgUrl = item.images[0]?.url ? item.images[0].url : placeholder_img
      }
      
      if(category === "user"){
        listItem.userHandle = item.user_handle
      } 
      
      if(category === "album" || category === "track") {
        listItem.releaseDate = item.release_date
        listItem.artist_name = item.artists[0].name
        listItem.artist_id = item.artists[0].uri.slice(15)
      }
      
    }
  
    return listItem
  })
}

const convertTimestampToDate = (timestamp) => {
  if (!timestamp) {
      return null // Handle undefined or null timestamps
    }

    const dateString = {
      yy: timestamp.slice(6, 10),
      mm: timestamp.slice(3, 5),
      dd: timestamp.slice(0, 2),
      time: timestamp.slice(12).replaceAll(":", "")
  }
  return Object.values(dateString).join("")
}

function setProperties(callback, property, value) {
  callback((prevState) => ({
    ...prevState,
    [property]: value,
  }))
}

async function getUser(id, setFunction){
  const response = await Axios.get(`/api/user/${id}`)
  const formatedData = formatListData([response.data], "user")
  setFunction(formatedData[0])
}

export { useClickOutside, formatListData, setProperties, convertTimestampToDate, getUser }