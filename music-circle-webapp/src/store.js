import React from 'react';
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useStore = create(devtools((set, get) => ({
  selectedNotification: null,
  notifications: null,
  accessToken: null,
  loggedUser: null,
  userPosts: [],
  spotifyApi: null,
  artistUri: null,
  recommendationSeed: {
    ids: null,
    type: null, 
  },
  socket: null,
  standardWrapperWidth: `calc(${document.documentElement.clientWidth}px - 269px - 25px)`,
  userTopTracks: null,
  userTopArtists: null,
  playerRef: null,
  currentTrack: null,
  playerState:{ 
      player: undefined,
      deviceId: null,
      isPaused: false,
      listened: (0.1),
      shuffleState: false,
      repeatState: false,
      volumePercentage: 1,
      isMute: false,
      isMinimized: false,
      isScrolled: false,
  },
  setNotifications: (notifications) => set({ notifications: notifications }),
  updateNotifications: (data) => {
    set((state) => {
      if (state.notifications.some((notification) => notification.id === data.id)) {
        return {
          notifications: state.notifications.map((notification) =>
            notification.id === data.id ? data : notification
          ),
        }
      } else {
        return { notifications: [...state.notifications, data] }
      }
    })
  },
  setSelectedNotification: (id) => set({ selectedNotification: id }),
  setAccessToken: (token) => set({ accessToken: token }),
  setLoggedUser: (user) => set({ loggedUser: user }),
  setSpotifyApi: (api) => set({ spotifyApi: api }),
  setArtistUri: (artist) => set({ artistUri: artist }),
  setStandardWrapperWidth: (sideMenuWidth) => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    set({ 
      standardWrapperWidth: `calc(100vw - ${sideMenuWidth}px - ${scrollbarWidth}px - 12.5px)`,
    })
  },
  setSocket: (socket) => set({ socket: socket }),
  setUserTopTracks: (tracks) => set({ userTopTracks: tracks }),
  setUserTopArtists: (artists) => set({ userTopArtists: artists }),
  setPlayerRef: (ref) => set({ playerRef: ref }),
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setRecommendationSeed: (newSeed) => set((prevState) => ({ 
    ...prevState, 
    recommendationSeed: { 
      ...prevState.newSeed,
      ...newSeed, 
    }, 
  })),
  setPlayerState: (newPlayerState) => set((state) => ({
    ...state,
    playerState: {
      ...state.playerState,
      ...newPlayerState,
    },
  })),
  setUserPosts: (posts) => set({ userPosts: posts }),
  deleteUserPost: (post_id) => set((prevState) => ({
    userPosts: prevState.userPosts.filter(prevPost => 
      prevPost.post_id !== post_id
    )
  })),
  addUserPost: (post) => set((prevState) => ({ 
    ...prevState, 
    userPosts: [
      ...prevState.userPosts,
      post, 
    ], 
  })),
})))

export default useStore
