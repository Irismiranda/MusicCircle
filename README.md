# MusicCircle

MusicCircle is a social platform that connects music fans. It provides features like a live chat, private messaging, real-time notifications, commenting on posts, and more.

## Table of Contents

- [Introduction](#introduction)
- [Technologies](#technologies)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Socket Events](#socket-events)
- [Contributing](#contributing)
- [License](#license)

## Introduction

MusicCircle is a social platform designed to foster connections between music fans. The platform offers features such as a live chat that connects users listening to the same artist, sharing music in your feed and profile, private messaging, real-time notifications for new activities, and more. Whether you're an artist looking to engage with your audience or a fan wanting to have fun and get to know people with the same music taste as you, MusicCircle provides a dynamic space for any music enthusiast!

## Technologies

The following technologies and frameworks are utilized in the MusicCircle project:

### Server side
- Node.js
- Express
- Firebase (Firestore, Authentication)
- Socket.io

### Client side
- React
- Zustand (for state management)
- Socket.io (for real-time communication)
- Axios (for HTTP requests)

## Features

### 1. Live Chat

MusicCircle offers a real-time live chat feature where users can connect and engage in conversations with people who are listening to the same artist.

### 2. Inbox/Private Chat

Users can send private messages, creating private chats for more personalized and private communication.

### 3. Resizable and Movable Music Player

The music player is not only resizable but also movable, allowing users to customize its position on the screen for a personalized experience.

### 4. Compact and Normal Music Player Versions

The music player comes in both compact and normal versions, catering to different user preferences and screen sizes.

### 5. Spotify Integration

The application seamlessly integrates with Spotify, allowing users to play songs directly from the Spotify library. It also supports sharing songs as posts on the user's profile.

### 6. Social Interactions

- **Feed**: Users can view posts from friends in a feed format.
- **Like and Comment**: Users can interact with posts by liking and commenting on them.

### 7. Search Functionality

- Users can search for tracks, artists, albums, and other users.
- Search results can be used to play songs directly or to create new posts.

### 8. Follow Friends

Users can follow their friends on MusicCircle, enhancing the social experience and keeping track of their activities.

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/musiccircle-api.git
cd musiccircle-api
```

## 2. Create Spotify Developer Account
   - Visit Spotify Developer Dashboard.
   - Create a new app for SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.
   - On the Spotify Developer Dashboard, navigate to your app.
   - Under "Settings," find the "Edit Settings" button.
   - In the "Redirect URIs" section, set your Redirect URI.
   - Manage the Spotify users you want to allow access to your app in development mode. Note that you can add a maximum of 25 users in development mode. If you plan to onboard more users, consider submitting a quota extension request.
     
## 3. Create Firebase Project
   - Visit Firebase Console.
   - Create a new project, enable Firebase Authentication, and Firestore.
     
## 4. Create Firebase Service Account
   - Generate a new private key in JSON format.
   - Replace {XXXX} in FIREBASE_SERVICE_ACCOUNT with the private key.
     
## 5. Edit .env File
   - Open .env in the root.
   - Replace XXXX with your values for keys (Spotify, Firebase, Emoji API).
   
## 6. Install Dependencies
   ```bash
   npm install
   ```
     
## 7. Run the Application
   
   ```bash
   npm start
   ```
   
The app will be available at [http://localhost:5173](http://localhost:5173) (client)

## Usage
   - Open your web browser and navigate to [http://localhost:your-port-number](http://localhost:5173).
   - Log in using your Spotify Account. (it must be a premium account, and your login e-mail should be registered in the user list on your Spotify developer account)
   - Explore the MusicCircle platform, connect with artists and fans, and enjoy the features it offers.

## API Endpoints

### Authentication Endpoints

#### 1. **`GET /auth/login`**
   - Initiate Spotify OAuth2 authorization process.

#### 2. **`GET /auth/callback`**
   - Handle the callback from Spotify after user authorization.

#### 3. **`POST /auth/refresh_token`**
   - Refresh Spotify access token using the provided refresh token.

### Emoji API Endpoints

#### 4. **`POST /api/emoji_category`**
   - Retrieve emojis from a specific category using the Emoji API.

#### 5. **`POST /api/search_emojis`**
   - Search for emojis based on a specified search term using the Emoji API.

### User Data Endpoints

#### 6. **`POST /api/user/:user_id`**
   - Create or update user data based on the provided `user_id` and `userData`.

#### 7. **`GET /api/user/:user_id`**
   - Retrieve user data using the specified `user_id`.

#### 8. **`GET /api/:loggedUserId/is_following/:currentUserId`**
   - Check if a user (`loggedUserId`) is following another user (`currentUserId`).

#### 9. **`POST /api/:loggedUserId/toggle_follow/:currentUserId`**
   - Toggle the follow status between two users (`loggedUserId` follows/unfollows `currentUserId`).

#### 10. **`POST /api/user/data/:category`**
   - Update or create user data for a specific category (`:category`) with a list of items.

#### 11. **`GET /api/user/data/:category/:id`**
   - Retrieve user data for a specific category (`:category`) and user (`:id`).

#### 12. **`POST /api/user/data/:category/hide_item`**
   - Toggle the visibility status of an item within a specific user category (`:category`).

#### 13. **`POST /api/user/data/:category/hide_category`**
   - Toggle the visibility status of a user category (`:category`).

#### 14. **`GET /api/search/user/:search_term`**
   - Search for users based on the provided `search_term`.

### Inbox Endpoints

#### 15. **`POST /api/send_inbox_message`**
   - Create a private chat or add a message to an existing one.

#### 16. **`GET /api/:logged_user_id/inbox`**
   - Retrieve inbox data for a specific user.

#### 17. **`GET /api/:chat_id/inbox/private_chat/last_message`**
   - Retrieve the last message in a private chat.

#### 18. **`POST /api/:logged_user_id/toggle_marked_as_read/:notification_id`**
   - Toggle the "marked as read" status for a notification.

#### 19. **`GET /delete_account/:user_id`**
   - Delete a user account and associated data.

# Socket Events

The following socket events are implemented in MusicCircle for real-time communication:

## 1. **Connection Setup:**
   - Initialize Firestore and Firebase admin.
   - Connect to the socket on client connection.

## 2. **Notifications:**
   - `listenToUserNotifications`: Join a room for user notifications, emit notifications to the room.
   - `disconnectUserNotifications`: Leave the user notifications room.

## 3. **Comments:**
   - `listenToComments`: Join a room for comments on a post, emit comments to the room.
   - `disconnectFromComments`: Leave the comments room.

## 4. **Replies:**
   - `listenToReplies`: Join a room for replies on a comment, emit replies to the room.
   - `disconnectFromReplies`: Leave the replies room.

## 5. **Inbox:**
   - `connectToPrivateChat`: Join a room for private chat, emit messages to the room.
   - `disconnectPrivateChat`: Leave the private chat room.
   - `connectToPrivateChatNotifications`: Join a room for private chat notifications, emit notifications to the room.
   - `disconnectPrivateChatNotifications`: Leave the private chat notifications room.

## 6. **Chat:**
   - `connectToChat`: Join a room for general chat, emit messages to the room.
   - `sendMessage`: Send a new message to the chat room.
   - `removeMessage`: Remove a message from the chat room.
   - `leaveChat`: Leave the chat room.

## Contributing
Feel free to contribute to the development of MusicCircle. Fork the repository, make your changes, and submit a pull request.

## License
This project is licensed under the MIT License.
