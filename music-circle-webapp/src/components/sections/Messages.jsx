import React, { useState, useRef, useEffect } from "react";
import { chat_illustration } from "../../assets"
import useStore from "../../store"
import { convertTimestampToDate } from "../../utils";

export default function Messages(props) {
  const storedMessages = useRef(null)
  const messagesRef = useRef(null)
  const prevChatId = useRef(null)
  const [messages, setMessages] = useState({})
  const [ isLoading, setIsLoading ] = useState(true) 
  const { socket, loggedUser } = useStore()
  const { chatId, chatProfileId, type } = props

  useEffect(() => {
    if(prevChatId.current){
      socket?.emit('leaveChat', {chatId: prevChatId.current})
    }
  }, [])
  
  useEffect(() => {
    const handleLoadAllMessages = (messages) => {
      setIsLoading(true)
      setMessages(messages[0])
      storedMessages.current = messages[0]
      setIsLoading(false)
    }

    const handleLoadNewMessage = (messages) => {
      const newMessages = messages[0][0]
      const messageIndex = storedMessages.current.findIndex(
        (message) => message.messageId === newMessages.messageId
      )
      if (messageIndex === -1) {
        const updatedMessages = [...storedMessages.current, newMessages]
        setMessages(updatedMessages)
        storedMessages.current = updatedMessages
      } else {
        const updatedMessages = [...storedMessages.current]
        updatedMessages[messageIndex] = newMessages
        setMessages(updatedMessages)
        storedMessages.current = updatedMessages
      }

    }
  
    socket?.onAny((eventName, ...args) => {
      if(eventName === "loadAllMessages" && args?.length > 0){
        handleLoadAllMessages(args)
      } else if(eventName === "loadNewMessage" && args?.length > 0){
        handleLoadNewMessage(args)
      }

      if(args[0][0]?.userId === loggedUser.id){
        const newCommentElement = document.getElementById(args[0][0].messageId)
        newCommentElement?.scrollIntoView({ behavior: "smooth", block: "end" })
    }
    })
  
    return () => {
      socket?.offAny()
    }
  }, [socket])

  useEffect(() => {
    if(chatProfileId){
      socket?.emit('connectToChat', { id: chatProfileId, type: type })
      prevChatId.current = chatProfileId
    }
  }, [chatProfileId, socket])

  function replyToMessage(userName) {
    messageInput.value = messageInput.value.replace(/^/, `@${userName}`);
  }

  function removeMessage(id) {
    socket?.emit("removeMessage", { id: chatProfileId, chatId, messageId: id });
  }
  return (
    
    <div>
      {isLoading ? (
        <section
        className="loading"
        style={{ margin: "30px 0" }}>
        </section>
      ) : messages.length > 0 ? (
      <div 
      ref={messagesRef}
      className="chat_room flex"
      >
        {messages
          .sort((a, b) => (b?.timeStamp > a?.timeStamp ? 1 : -1))
          .map((message) => {
            const {
              userId,
              userName,
              userProfilePic,
              text,
              messageId,
              timeStamp,
              display,
            } = message
            return (
              <div
                id={messageId}
                key={messageId}
                className="message_wrapper"
                style={{
                  alignSelf: userId === loggedUser.userId ? "start" : "end",
                  textAlign: userId === loggedUser.userId ? "left" : "right",
                  marginBottom: "2px",
                }}
              >
                <div className="flex">
                  {type === "user" && <img src={`${userProfilePic}`} />}
                  <h4 
                  style={{
                  alignSelf: userId === loggedUser.userId ? "start" : "end",
                  textAlign: userId === loggedUser.userId ? "left" : "right",
                }}>
                    <a href={`/account/${userId}`}>{userName}</a>
                  </h4>
                </div>
                <div className="chat-message">
                  {display ? <p>{text}</p> : <p>message deleted</p>}
                </div>
                <div
                  className="flex"
                  style={{
                    justifyContent:
                      userId === loggedUser.userId ? "start" : "end",
                    textAlign: userId === loggedUser.userId ? "left" : "right",
                    margin: "0 30px",
                  }}
                >
                  {display && loggedUser.userId === userId && (
                    <h4
                      style={{ cursor: "pointer" }}
                      onClick={() => replyToMessage(userName)}
                    >
                      Reply
                    </h4>
                  )}
                  {display && loggedUser.userId !== userId && (
                    <h4
                      style={{ cursor: "pointer" }}
                      onClick={() => removeMessage(messageId)}
                    >
                      Remove
                    </h4>
                  )}
                  <h6>{new Date(timeStamp * 1000).toLocaleString()}</h6>
                </div>
              </div>
            )
          })}
      </div>
    ) : (
      type === "artist" && 
      <div className="no_messages">
        <img src={chat_illustration} />
        <h3>Everyone is comming to chat, be the first to break the ice</h3>
      </div>
    )}
  </div>
  )
}
