import React from "react"
import { Routes, Route } from "react-router-dom"
import { Welcome, Home, Inbox, Error, Profile, Artist, Album } from './pages'
import { AuthRequired, PlayerManager, SideMenu, NotificationsManager, AppManager } from "./components"

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/error" element={<Error />} />
        <Route path="/" element={<AuthRequired />}>
          <Route 
          path="/:trackId?" 
          query="post?comment?reply"
          element={<PlayerManager />}>
            <Route element={<AppManager />}>
              <Route element={<SideMenu />}>
                <Route element={<NotificationsManager />}>
                  <Route index element={<Home />}/> 
                  <Route 
                  path="inbox?" 
                  query="chat?"
                  element={<Inbox />}
                  /> 
                  <Route 
                  path="account/:userId?" 
                  query="post?comment?reply"
                  element={<Profile />}
                  /> 
                  <Route path="artist/:artistId" element={<Artist />}/> 
                  <Route path="album/:albumId" element={<Album />}/> 
                </Route>
              </Route>
            </Route>
          </Route>
        </Route>
    </Routes>
  )
}