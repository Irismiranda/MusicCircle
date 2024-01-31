const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const axios = require('axios')
const socketIo = require('socket.io')
const querystring = require('querystring')
const { v4: uuidv4 } = require('uuid')
const { Firestore, Filter } = require('@google-cloud/firestore')
const admin = require('firebase-admin')
const functions = require('firebase-functions')

const port = 4000

dotenv.config()

const app = express()

app.use(express.json())
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}))

const server = app.listen(4000, function(){
  console.log('listening for requests on port 4000,')
})

const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  },
})

//Spotify Authentication

const spotify_client_id = process.env.SPOTIFY_CLIENT_ID
const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET

app.get('/auth/login', (req, res) => {
  const scope = 'streaming user-read-email user-follow-modify user-follow-read user-top-read user-read-recently-played user-read-currently-playing user-read-playback-state user-read-playback-position user-modify-playback-state user-read-private user-library-read user-library-modify user-read-private'

  const state = uuidv4()

  const auth_query_parameters = new URLSearchParams({
    response_type: 'code',
    client_id: spotify_client_id,
    scope: scope,
    redirect_uri: 'http://localhost:4000/auth/callback',
    state: state,
  })

  res.send(
    `https://accounts.spotify.com/authorize/?${auth_query_parameters.toString()}`
  )
})

app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query

  const params = new URLSearchParams()
  params.append('grant_type', 'authorization_code')
  params.append('code', code)
  params.append('redirect_uri', 'http://localhost:4000/auth/callback')
  params.append('client_secret', spotify_client_secret)

  const headers = {
    'content-type': 'application/x-www-form-urlencoded',
    Authorization:
      'Basic ' +
      new Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString('base64'),
  }

  const response = await axios.default.post(
    'https://accounts.spotify.com/api/token',
    params,
    {
      headers: headers,
    }
  )
  const {access_token, refresh_token, expires_in} = response.data
  res.redirect(`http://localhost:5173?access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}`)
})

//Token Refresh

app.post('/auth/refresh_token', async (req, res) => {
  const { refresh_token } = req.body
  try {
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      data: querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      }),
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${spotify_client_id}:${spotify_client_secret}`).toString('base64')}`
      },
    })
    console.log("token refreshed")
    res.json(response.data)
    
  } catch (err) {
    console.log("failed to refreshed token", err)
    console.log('err refreshing access token:', err)
    res.status(500).json({ err: 'Internal Server err' })
  }
})

// Emoji API

const emoji_api_key = process.env.EMOJI_API_KEY

app.post('/api/emoji_category', async (req, res) => {
  const { category } = req.body
  try {
    const response = await axios({
      method: 'get',
      url: `http://emoji-api.com/categories/${category}?access_key=${emoji_api_key}`,
    })
    res.json(response.data)
  } catch (err) {
    console.log(err)
  }
})

app.post('/api/search_emojis', async (req, res) => {
  const { search_term } = req.body
  try {
    const response = await axios({
      method: 'get',
      url: `http://emoji-api.com/emojis?search=${search_term}&access_key=${emoji_api_key}`,
    })
    res.json(response.data)
  } catch(err) {

  }
})

// Firestore 

// User data

app.post('/api/user/:user_id', async (req, res) => {
  const { user_id } = req.params
  const { userData } = req.body

  try {
    const userDocRef = admin.firestore().doc(`user/${user_id}`)
    const userDoc = await userDocRef.get()

    if (userDoc.exists) {
        const user = userDoc.data()
        res.json(user.userData)
      } else {  
        await userDocRef.set({userData: userData}, { merge: true })
        res.json(userData)
      }
    } catch(err){
      console.log(err)
    }
})

app.get('/api/user/:user_id', async (req, res) => {
  const { user_id } = req.params
  const userDocRef = admin.firestore().doc(`user/${user_id}`)
  
  try {
    const userDoc = await userDocRef.get()
    const user = userDoc.data()
    res.json(user.userData)
  } catch(err){
    console.log(err)
  }
})

app.get('/api/:loggedUserId/is_following/:currentUserId', async (req, res) => {
  const { loggedUserId, currentUserId} = req.params

  try {
    const loggedUserDocRef = admin.firestore().doc(`user/${loggedUserId}`)
    const doc = await loggedUserDocRef.get()
    const loggedUserData = doc.data()

    const isFollowing = Array.isArray(loggedUserData.userData.following) && loggedUserData.userData.following.some(user => user === currentUserId)
    res.send(isFollowing)

  } catch (err) {
      console.log(err)
      res.status(500).send('Internal Server err')
  }
})

app.post('/api/:loggedUserId/toggle_follow/:currentUserId', async (req, res) => {
  const { loggedUserId, currentUserId} = req.params

  try {
    const loggedUserDocRef = admin.firestore().doc(`user/${loggedUserId}`)
    const currentUserDocRef = admin.firestore().doc(`user/${currentUserId}`)

    const loggedUserDoc = await loggedUserDocRef.get()
    const currentUserDoc = await currentUserDocRef.get()

    const loggedUserData = loggedUserDoc.data()
    const currentUserData = currentUserDoc.data()

    const loggedUserFollowing = loggedUserData.userData.following || []
    const currentUserFollowers = currentUserData.userData.following_you || []

    const isFollowing = loggedUserFollowing.includes(currentUserId)

    if (isFollowing) {
      await loggedUserDocRef.update({
        'userData.following': admin.firestore.FieldValue.arrayRemove(currentUserId)
      })

      await currentUserDocRef.update({
        'userData.following_you': admin.firestore.FieldValue.arrayRemove(loggedUserId)
      })

      const notificationsCollectionRef = admin.firestore().collection(`user/${currentUserId}/notifications`)
      const notificationDocRef = notificationsCollectionRef
      .where('notification_type', '==', 'follow')
      .where('user', '==', loggedUserId)
      .get()

      if(!notificationDocRef.empty){
        const notificationDoc = notificationDocRef.docs[0]
        notificationDoc.ref.delete()
      }

    } else {
      loggedUserFollowing.push(currentUserId)
      currentUserFollowers.push(loggedUserId)

      await loggedUserDocRef.update({
        'userData.following': admin.firestore.FieldValue.arrayUnion(currentUserId)
      })
      await currentUserDocRef.update({
        'userData.following_you': admin.firestore.FieldValue.arrayUnion(loggedUserId)
      })

      const notificationsCollectionRef = admin.firestore().collection(`user/${currentUserId}/notifications`)
      const notificationData = {
        id: uuidv4(),
        content_id: loggedUserId,
        user: loggedUserId,
        notification_type: 'follow',
        marked_as_read: false,
        time_stamp: Math.floor(Date.now() / 1000),
      }

      await notificationsCollectionRef.doc(notificationData.id).set(notificationData)

    }

    try{
      const updatedLoggedUser = await loggedUserDocRef.get()
      const updatedCurrentUser = await currentUserDocRef.get()

      const udaptedIsFollowing = updatedLoggedUser.data().userData.following.includes(currentUserId)

      res.send({isFollowing: udaptedIsFollowing, updatedLoggedUser: updatedLoggedUser.data().userData, updatedCurrentUser: updatedCurrentUser.data().userData})
    } catch(err){
      console.log(err)
    }

  } catch (err) {
    console.log(err)
    res.status(500).send('Internal Server err')
  }
})

app.post('/api/user/data/:category', async (req, res) => {
  const { id, items } = req.body
  const { category } = req.params
  const userDocRef = admin.firestore().doc(`user/${id}`)

  try {
      const user = await userDocRef.get()
      const prevData = user.data()
      const prevList = prevData[category] || null

      if (prevList?.items) {
          const prevItemIds = prevList.items.map(item => item.id)
          const newItemIds = items.map(item => item.id)

          const updatedItems = [...prevList.items.filter(item => !newItemIds.includes(item.id) || !item.isVisible), ...items.filter(item => !prevItemIds.includes(item.id))]
          
          const updatedList = {...prevList, items: updatedItems}
          
          // Check if 'show_[category]' exists
          if (prevList[`show_${category}`] === undefined) {
            updatedList[`show_${category}`] = true
          }
          
          // Perform the update in a single call
          await userDocRef.update({[category]:updatedList})

          // Send the updated list as the response
          res.send(updatedList)
      } else {
          const newList = {
            [`show_${category}`]: true,
            items: items,
          } 
          // In case there's no previous data for this category
          await userDocRef.update({ [category]: newList })
          res.send(newList)
      }
  } catch(err) {
      console.log(err)
      res.status(500).json({ err: 'Internal Server err' })
  }
})

app.get('/api/user/data/:category/:id', async (req, res)  => {
const { id, category } = req.params
const userDocRef = admin.firestore().doc(`user/${id}`)
try {
  const doc = await userDocRef.get()
  const data = doc.data()
  const list = data[category] || null
  if (list) {
      res.json(list)
  } else {
      res.status(404).json({ err: 'User not found.' })
  }
} catch(err) {
  console.log(err)
  res.status(500).json({ err: 'Internal Server err' })
}
})

app.post('/api/user/data/:category/hide_item', async (req, res)  => {
  const { userId, itemId } = req.body
  const { category } = req.params
  const userDocRef = admin.firestore().doc(`user/${userId}`)

  console.log("params are", req.params, "body is", req.body)

  try {
      const doc = await userDocRef.get()
      if (doc.exists) {
          const userData = doc.data()

          console.log("user data is", userData)

          const topList = userData[category]

          console.log("top list is", topList)

          const updatedItems = topList.items.map(item => item.id === itemId ? {...item, isVisible: !item.isVisible || false } : item)
          const updatedList = {...topList, items: updatedItems}
          const updateObject = { [category]:  updatedList}

          await userDocRef.update(updateObject)
          res.json(updateObject)
      } else {
          res.status(404).json({ err: 'User not found.' })
      }
  } catch(err) {
      console.log(err)
      res.status(500).json({ err: 'Internal Server err' })
  }
})

app.post('/api/user/data/:category/hide_category', async (req, res) => {
  const { userId } = req.body
  const { category } = req.params

  const userDocRef = admin.firestore().doc(`user/${userId}`)

  try {
    const doc = await userDocRef.get()
    if (doc.exists) {
        const userData = doc.data()
        const topList = userData[category]
        const updatedList = {...topList, [`show_${category}`]: !topList[`show_${category}`]}
        const updatedObject = { [category]: updatedList}
        await userDocRef.update(updatedObject)
        res.send(updatedList)
    } else {
        res.status(404).json({ err: 'User not found.' })
    }
} catch(err) {
    console.log(err)
    res.status(500).json({ err: 'Internal Server err' })
}
})

app.get('/api/search/user/:search_term', async (req, res) => {
  const { search_term } = req.params
  const collectionRef = admin.firestore().collection('user')
  
  try{
    const results = await collectionRef
    .where('userData.user_handle', '>=', search_term)
    .where('userData.user_handle', '<=', search_term + '\uf8ff')
    .limit(20)
    .get()
    
    const users = []

    results.forEach((doc) => {
      const userDoc = doc.data()
      users.push(userDoc.userData)
    })

  res.send(users)
  
  } catch(err){
    console.log(err)
  }
})

app.get('/api/track_post/:artist_id/:post_id', async (req, res) => {
  const { artist_id, post_id } = req.params
  const postDocRef = admin.firestore().doc(`posts/${post_id}`)

  try{
    const postDoc = await postDocRef.get()
    
    if(postDoc.exists){
      res.send(postDoc.data())
    } else {
      const postData = {
        artist_id: artist_id,
        track_id: post_id,
        likes: []
      }
      postDocRef.set(postData)
      res.send(postData)
    }
  } catch (err) {
      console.log(err)
      res.status(500).send('Internal Server Error')
  }
})


app.post('/api/posts_feed/:index', async (req, res) => {
  const { index } = req.params
  const { user_ids } = req.body

  console.log("user ids are", user_ids)
  
  const limit = 10

  try {
      const postsQuery = admin.firestore().collection('posts')
        .where('user_id', 'in', user_ids)
        .where('hide_post', '==', false)
        .orderBy('user_id')
        .startAfter(parseInt(index, 10))

      const snapshot = await postsQuery.get()
      const posts = snapshot.docs.map(doc => doc.data())

      console.log("feed posts are", posts)

      if (posts.length < limit) {
          const nonFollowedPostsQuery = admin.firestore().collection('posts')
            .where('user_id', 'not-in', user_ids)
            .where('hide_post', '==', false)
            .orderBy('user_id')
            .limit(parseInt(limit, 10))
            .startAfter(parseInt((index - posts.length), 10))

          const nonFollowedSnapshot = await nonFollowedPostsQuery.get()
          const nonFollowedUsers = nonFollowedSnapshot.docs.map(doc => doc.data())
          const nonFollowedPosts = nonFollowedUsers
          .map(user => user.posts)
          .filter(posts => posts !== undefined && posts !== null)

          if(nonFollowedPosts && (nonFollowedPosts?.length > 0)){
            posts.push(...nonFollowedPosts)
          }
      }

      await Promise.all(
        posts.map(async (post) => {
          const commentsSnapshot = await admin
            .firestore()
            .collection(`posts/${post.post_id}/comments`)
            .get()

          let replies_count = 0

          await Promise.all(
            commentsSnapshot.docs.map(async (commentDoc) => {
              const comment = commentDoc.data()
              const repliesSnapshot = await admin
                .firestore()
                .collection(`posts/${post.post_id}/comments/${comment.comment_id}/replies`)
                .get()
    
              replies_count += repliesSnapshot.size
            })
          )
            
          post.comments_count = (commentsSnapshot.size || 0) + (replies_count || 0)
        })
      )
      
      if(posts){
        res.json({ posts })
      } else {
        res.json({ })
      }

  } catch (error) {
      console.log('Error getting posts:', error)
      res.status(500).json({ error: 'Internal Server Error' })
  }
})

app.get('/api/:user_id/user_posts', async (req, res) => {
  const { user_id } = req.params
  const postsCollectionRef = admin.firestore().collection('posts')
  
  try {
    const postsQuery = postsCollectionRef
        .where('user_id', '==', user_id)
        .orderBy('time_stamp', 'desc')

    const postsSnapshot = await postsQuery.get()

    if (!postsSnapshot.empty) {
        const posts = postsSnapshot.docs.map(postDoc => postDoc.data())

        await Promise.all(
          posts.map(async (post) => {
            const commentsSnapshot = await admin
              .firestore()
              .collection(`posts/${post.post_id}/comments`)
              .get()

            let replies_count = 0

            await Promise.all(
              commentsSnapshot.docs.map(async (commentDoc) => {
                const comment = commentDoc.data()
                const repliesSnapshot = await admin
                  .firestore()
                  .collection(`posts/${post.post_id}/comments/${comment.comment_id}/replies`)
                  .get()
      
                replies_count += repliesSnapshot.size
              })
            )
              
            post.comments_count = (commentsSnapshot.size || 0) + (replies_count || 0)
          })
        )
        res.send(posts)
    } else {
        res.send([])
    }
  } catch (err) {
      console.log(err)
      res.status(500).send('Internal Server Error')
  }
})

app.post('/api/:user_id/share_post/:content_id', async (req, res) => {
  const { user_id, content_id } = req.params
  const { description, type, time_stamp, artist_id } = req.body
  const post_id = uuidv4()
  
  const postsCollectionRef = admin.firestore().collection('posts')

  const postData = {
    description,
    type,
    time_stamp,
    id: content_id,
    post_id,
    user_id,
    artist_id,
  }
  
    try {
      await postsCollectionRef.doc(post_id).set(postData)
      res.send(postData)
  } catch (err) {
      console.log(err)
      res.status(500).send('Internal Server Error')
  }
})

app.post('/api/:user_id/:post_id/toggle_hide_post', async (req, res) => {
  const { post_id } = req.params
  
  const postDocRef =  admin.firestore().doc(`posts/${post_id}`)

  try{
    
    const postDoc = await postDocRef.get()
    const post = postDoc.data()
    
    await postDocRef.update({
      hide_post: !post.hide_post || false,
    })
    
    const updatedPostDoc = {...post, hide_post: !post.hide_post || false}
    res.send(updatedPostDoc)
    
  } catch(err){
    console.log(err)
  }

})

app.post('/api/toggle_like_post/:post_id', async (req, res) => {
  const { post_id } = req.params
  const { logged_user_id } = req.body

  const postDocRef =  admin.firestore().doc(`posts/${post_id}`)

  try{
    const postDoc = await postDocRef.get()
    const post = postDoc.data()

    const updatedLikes = post?.likes?.includes(logged_user_id) ? 
    post.likes?.filter(like => like !== logged_user_id) :
    [...(post?.likes || []), logged_user_id]

    userNotificationsRef = admin.firestore().collection(`user/${post.user_id}/notifications`)
    
    if(post?.likes?.includes(logged_user_id)){
      const currentNotification = await userNotificationsRef
      .where('user', '==', logged_user_id)
      .where('content_id', '==', post.post_id)
      .where('notification_type', '==', 'like')
      .where('data_type', '==', 'post')
      .get()

      const notificationDoc = currentNotification.docs[0]
      await notificationDoc.ref.delete()
       
    } else if(post.user_id !== logged_user_id){
      const notificationData = {
        id: uuidv4(),
        content_id: post.post_id,
        poster_id: post.poster_id,
        user: logged_user_id,
        data_type: 'post',
        notification_type: 'like',
        marked_as_read: false,
        time_stamp: Math.floor(Date.now() / 1000),
      }

      userNotificationsRef.doc(notificationData.id).set(notificationData)
    }

    await postDocRef.update({ likes: updatedLikes })
   
    res.status(200).send('Like toggled successfully')
  } catch(err){
    console.log(err)
    return res.status(500).send('Internal Server Error')
  }
})

app.post('/api/:post_id/delete_post', async (req, res) => {
  const { post_id } = req.params
  
  try{
    const postDocRef = admin.firestore().doc(`posts/${post_id}`)
    await postDocRef.delete()
    res.status(200).send("post deleted successfully")

  } catch(err){
    console.log(err).send("error deleting post")
  }

})

app.post('/api/:post_id/add_comment', async (req, res) => {
  const { post_id } = req.params
  const newCommentData = req.body

  newCommentData.comment_id = uuidv4()

  
  try{
    if(newCommentData.poster_id && newCommentData.poster_id !== newCommentData.user_id){
      const notificationsCollectionRef = admin.firestore().collection(`user/${newCommentData.poster_id}/notifications`)

      const notificationData = {
        id: uuidv4(),
        content_id: post_id,
        poster_id: newCommentData.poster_id,
        comment_id: newCommentData.comment_id,
        user: newCommentData.user_id,
        data_type: 'post',
        notification_type: 'comment',
        marked_as_read: false,
        time_stamp: newCommentData.timestamp,
      }

      await notificationsCollectionRef.doc(notificationData.id).set(notificationData)
    }

    const commentsCollectionRef = admin.firestore().collection(`posts/${post_id}/comments`)
    await commentsCollectionRef.doc(newCommentData.comment_id).set(newCommentData)

    res.status(201).send("Comment added successfully")
  } catch(err){
    console.log(err)
  }

})

app.post('/api/:post_id/reply_to/:comment_id', async (req, res) => {
  const { post_id, comment_id } = req.params
  const newCommentData = req.body

  newCommentData.reply_id = uuidv4()

  try{

    if(newCommentData.reply_to && newCommentData.reply_to !== newCommentData.user_id){
      const notificationsCollectionRef = admin.firestore().collection(`user/${newCommentData.reply_to}/notifications`)

      const notificationData = {
        id: uuidv4(),
        content_id: post_id,
        comment_id: comment_id,
        poster_id: newCommentData.poster_id,
        reply_id: newCommentData.reply_id,
        user: newCommentData.user_id,
        data_type: 'post',
        notification_type: 'reply',
        marked_as_read: false,
        time_stamp: newCommentData.timestamp,
      }

      await notificationsCollectionRef.doc(notificationData.id).set(notificationData)

    }

    if(newCommentData.poster_id !== newCommentData.reply_to){
      const notificationsCollectionRef = admin.firestore().collection(`user/${newCommentData.poster_id}/notifications`)

      const notificationData = {
        id: uuidv4(),
        content_id: post_id,
        comment_id: comment_id,
        poster_id: newCommentData.poster_id,
        reply_id: newCommentData.reply_id,
        user: newCommentData.user_id,
        data_type: 'post',
        notification_type: 'comment',
        marked_as_read: false,
        time_stamp: newCommentData.timestamp,
      }

      await notificationsCollectionRef.doc(notificationData.id).set(notificationData)
    }

    const repliesCollectionRef = admin.firestore().collection(`posts/${post_id}/comments/${comment_id}/replies`)

    await repliesCollectionRef.doc(newCommentData.reply_id).set(newCommentData)

    res.status(201).send("Comment added successfully")
  } catch(err){
    console.log(err)
  }
  
})

app.post('/api/:post_id/delete_comment/:comment_id', async (req, res) => {
  const { post_id, comment_id } = req.params

  const commentDocRef = admin.firestore().doc(`posts/${post_id}/comments/${comment_id}`)

  try{
    await commentDocRef.delete()
    res.status(200).send("comment deleted successfully")
  } catch(err){
    console.log(err)
  }
})

app.post('/api/:post_id/delete_reply/:comment_id/:reply_id', async (req, res) => {
  const { post_id, comment_id, reply_id } = req.params

  const replyDocRef = admin.firestore().doc(`posts/${post_id}/comments/${comment_id}/replies/${reply_id}`)

  try{
    replyDocRef.delete()
    res.status(200).send("Reply deleted successfully")
  } catch(err){
    console.log(err)
  }
})

app.post('/api/:post_id/toggle_like_comment/:comment_id', async (req, res) => {
  const { post_id, comment_id } = req.params
  const { logged_user_id } = req.body

  const commentDocRef = admin.firestore().doc(`posts/${post_id}/comments/${comment_id}`)

  try{
    const commentSnapshot = await commentDocRef.get()
    const commentDoc = commentSnapshot.data()
    
    const updatedLikes = commentDoc?.likes?.includes(logged_user_id) ?
    commentDoc.likes.filter((like) => like !== logged_user_id) :
    [...(commentDoc.likes ? commentDoc.likes : []) , logged_user_id]

    await commentDocRef.update({likes: updatedLikes})

    const userNotificationsRef = admin.firestore().collection(`user/${commentDoc.user_id}/`)

    if(commentDoc?.likes?.includes(logged_user_id)){
      const currentNotification = await userNotificationsRef
      .where('user', '==', logged_user_id)
      .where('content_id', '==', comment_id)
      .where('notification_type', '==', 'like')
      .where('data_type', '==', 'comment')
      .get()

      const notificationDoc = currentNotification.docs[0]
      await notificationDoc.ref.delete()
       
    } else if(commentDoc?.user_id !== logged_user_id){
      const notificationData = {
        id: uuidv4(),
        post_id: post_id,
        poster_id: commentDoc.poster_id,
        content_id: post_id,
        comment_id: comment_id,
        user: logged_user_id,
        data_type: 'comment',
        notification_type: 'like',
        marked_as_read: false,
        time_stamp: Math.floor(Date.now() / 1000),
      }

      await userNotificationsRef.doc(notificationData.id).set(notificationData)
    }

    res.status(200).send("like toggled successfully")
  } catch(err){
    console.log(err)
  }
})

app.post('/api/:post_id/toggle_like_reply/:comment_id/:reply_id', async (req, res) => {
  const { post_id, comment_id, reply_id } = req.params
  const { logged_user_id, poster_id } = req.body

  const replyDocRef = admin.firestore().doc(`posts/${post_id}/comments/${comment_id}/replies/${reply_id}`)
  
  try {
      const replySnapshot = await replyDocRef.get()
      const replyDoc = replySnapshot.data()
      
      const updatedLikes = replyDoc.likes?.includes(logged_user_id) ?
      replyDoc.likes.filter((like) => like !== logged_user_id) :
      [...(replyDoc.likes || []), logged_user_id]

      await replyDocRef.update({ likes: updatedLikes })
      res.status(200).send("Like toggled successfully")

      const userNotificationsRef = admin.firestore().collection(`user/${replyDoc.user_id}/`)

    if(replyDoc?.likes?.includes(logged_user_id)){
      const currentNotification = await userNotificationsRef
      .where('user', '==', logged_user_id)
      .where('content_id', '==', reply_id)
      .where('notification_type', '==', 'like')
      .where('data_type', '==', 'reply')
      .get()

      const notificationDoc = currentNotification.docs[0]
      await notificationDoc.ref.delete()
       
    } else if(replyDoc?.user_id !== logged_user_id){
      const notificationData = {
        id: uuidv4(),
        content_id: post_id,
        poster_id: replyDoc.poster_id,
        comment_id: comment_id,
        reply_id: reply_id,
        user: logged_user_id,
        data_type: 'reply',
        notification_type: 'like',
        marked_as_read: false,
        time_stamp: Math.floor(Date.now() / 1000),
      }

      await userNotificationsRef.doc(notificationData.id).set(notificationData)
    }

  } catch(err) {
      console.log(err)
      res.status(500).send("Internal Server Error")
  }
})

app.post('/api/send_inbox_message', async (req, res) => {
const { messages, logged_user_id } = req.body

const inboxCollectionRef = admin.firestore().collection('inbox')

// Run two separate queries

// Find documents that appear in both result sets

await Promise.all(
  messages.map(async (messageData) => {
    
    const query1 = inboxCollectionRef.where('user_ids', 'array-contains', messageData.user_ids[0]).get()
    const query2 = inboxCollectionRef.where('user_ids', 'array-contains', messageData.user_ids[1]).get()

    const [result1, result2] = await Promise.all([query1, query2])

    const commonDocs = result1.docs.filter(doc => result2.docs.some(d => d.id === doc.id))
    
    let chat_id

    if (commonDocs.length === 0) {
      // If no common documents, create a new chat
      chat_id = uuidv4()
      const chatDocRef = inboxCollectionRef.doc(chat_id)

      await chatDocRef.set({ user_ids: messageData.user_ids, chat_id: chat_id })
    } else {
      console.log("Common documents are", commonDocs)
      chat_id = commonDocs[0].id
    }

    const messagesCollectionRef = admin.firestore().collection(`inbox/${chat_id}/messages`)

    const notificationData = {
      ...messageData,
      user: logged_user_id,
      id: uuidv4(),
      content_id: chat_id,
      data_type: 'message',
      notification_type: 'inbox',
      marked_as_read: false,
      time_stamp: messageData.time_stamp,
    }
    
    messageData.message_id = uuidv4()
    messageData.notification_id = notificationData.id

    const user = messageData.user_ids.filter(id => id !== logged_user_id)[0]
    
    const notificationCollectionRef = admin.firestore().collection(`user/${user}/notifications`)
    
    await messagesCollectionRef.doc(messageData.message_id).set(messageData)
    await notificationCollectionRef.doc(notificationData.id).set(notificationData)
    
    if(messages.length === 1){
      res.status(200).send({chat_id: chat_id})
    }
  })
) 
if(messages.length > 1){
  res.status(200).send('message sent successfully')
}
})

app.get('/api/:logged_user_id/inbox', async (req, res) => {
const { logged_user_id } = req.params

const inboxCollectionRef = admin.firestore().collection('inbox')
try {
  const results = await inboxCollectionRef
  .where('user_ids', 'array-contains', logged_user_id)
  .get()

  const inboxData = results.docs.map(doc => doc.data())
  res.json(inboxData)
  
} catch(err){
  console.log(err)
}
})

app.get('/api/:chat_id/inbox/private_chat/last_message', async (req, res) => {
const { chat_id } = req.params

const privateMessagesCollectionRef = admin.firestore().collection(`inbox/${chat_id}/messages`)

try {
  const snapshot = await privateMessagesCollectionRef
    .orderBy('time_stamp', 'desc')
    .limit(1)
    .get()

  if (snapshot.empty) {
    res.status(404).json({ error: 'No messages found' })
    return
  }

  const lastMessage = snapshot.docs[0].data()
  res.json(lastMessage)
} catch (err) {
  console.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
}
})

app.post('/api/:logged_user_id/toggle_marked_as_read/:notification_id', async (req, res) => {
const { logged_user_id, notification_id } = req.params
const notificationsDocRef = admin.firestore().doc(`user/${logged_user_id}/notifications/${notification_id}`)

try {
  await notificationsDocRef.update({ marked_as_read: true })
  res.status(200).json({ message: "notification marked as read" })
} catch(err){
  console.log(err)
  res.status(500).json({ error: "Internal server error" })
}

})

app.get('/delete_account/:user_id', async (req, res) => {
const { user_id } = req.params
const userDocRef = admin.firestore().doc(`user/${user_id}`)

try{
  await userDocRef.delete()

  const postsCollectionRef = admin.firestore().doc(`posts`)
  const userPosts = await postsCollectionRef
  .where('user_id', '==', user_id)
  .get()

  userPosts.docs.map(post => {
    batch.delete(post.ref)
  })

  const inboxCollectionRef = admin.firestore().collection('inbox')
  const userChats = await inboxCollectionRef
  .where('user_ids', 'array-contains', user_id)
  .get()

  userChats.docs.map(chat => {
    batch.delete(chat.ref)
  })

  res.status(200).send('Account deleted successfully')
} catch (err){
  console.log(err)
}
})

//Socket

const firestore = new Firestore()
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'http://<your-database-name>.firebaseio.com',
})


io.on('connection', (socket) => {
  console.log('Client connected')

  //Notificarions

  socket.on('listenToUserNotifications', async ({ user_id }) => {
    socket.join(`notitications_${user_id}`)
    console.log(`joined room notitications_${user_id}`)


    notificationsCollectionRef = admin.firestore().collection(`user/${user_id}/notifications`)
    let isFirstSnapshot = true

    notificationsCollectionRef.onSnapshot((snapshot) => {
      const notifications = snapshot.docChanges()
          .filter(change => change.type === 'added' || change.type === 'modified')
          .map(change => change.doc.data())
          
          if (isFirstSnapshot) {
            io.to(`notitications_${user_id}`).emit('loadAllNotifications', notifications)
            isFirstSnapshot = false
          } else{
            io.to(`notitications_${user_id}`).emit('loadNewNotification', notifications[0])
          } 
    })
  })

  socket.on('disconnectUserNotifications', async ({ user_id }) => {
    socket.leave(`notitications_${user_id}`)
  })

  //Comments
  
  socket.on('listenToComments', async ({ post_id }) => {
    try {
      socket.join(post_id)

      console.log("joined room", post_id)

      const commentsCollectionRef = admin.firestore().collection(`posts/${post_id}/comments`)

      let isFirstSnapshot = true

      commentsCollectionRef.onSnapshot((snapshot) => {
        const comments = snapshot.docChanges()
          .filter(change => change.type === 'added' || change.type === 'modified')
          .map(change => change.doc.data())
        if (isFirstSnapshot) {
          console.log('loading comments', comments)
          io.to(post_id).emit('loadAllComments', comments)
          isFirstSnapshot = false
        } else{
          console.log('loading new comment', comments)
          comments && io.to(post_id).emit('loadNewComment', comments)
        } 
      })

    socket.on('disconnectFromComments', ({ post_id }) => {
        socket.leave(post_id)
    })
    } catch(err){
      console.log(err)
    }
  })

  //Replies

  socket.on('listenToReplies', async ({ post_id, comment_id }) => {
    try {
      socket.join(comment_id)

      console.log("joined room", comment_id)

      const repliesCollectionRef = admin.firestore().collection(`posts/${post_id}/comments/${comment_id}/replies`)

      let isFirstSnapshot = true
      repliesCollectionRef.onSnapshot((snapshot) => {
        const replies = snapshot.docChanges()
          .filter(change => change.type === 'added' || change.type === 'modified')
          .map(change => change.doc.data())
        if (isFirstSnapshot) {
          console.log('loading replies', replies)
          io.to(post_id).emit(`loadAllReplies_${comment_id}`, replies)
          isFirstSnapshot = false
        } else{
          console.log('loading new reply', replies)
          replies && io.to(post_id).emit(`loadNewReply_${comment_id}`, replies)
        } 
      })

    socket.on('disconnectFromReplies', ({ comment_id }) => {
        socket.leave(comment_id)
    })
    } catch(err){
      console.log(err)
    }
  })

  //Inbox

  socket.on('connectToPrivateChat', async ({ chat_id }) => {
    socket.join(chat_id)
    console.log("joined room", chat_id)

    let isFirstSnapshot = true

    const messagesCollectionRef = admin.firestore().collection(`inbox/${chat_id}/messages`)

    const chatDocRef = admin.firestore().doc(`inbox/${chat_id}`)
    const chatDoc = await chatDocRef.get()
    const user_ids = chatDoc.data().user_ids

    messagesCollectionRef.onSnapshot((snapshot) => {
      const messages = snapshot.docChanges()
      .filter(change => change.type === 'added' || change.type === 'modified')
      .map(change => change.doc.data())

      if(isFirstSnapshot){

        const data = {
          messages: messages,
          user_ids: user_ids,
        }

        io.to(chat_id).emit('loadAllPrivateChatMessages', data)
        isFirstSnapshot = false
      } else {
        io.to(chat_id).emit('loadNewPrivateChatMessage', messages[0])
      }
    })

  })
  
  socket.on('disconnectPrivateChat', async ({ chat_id }) => {
    socket.leave(chat_id)
    console.log('Disconnecting from private chat:', chat_id)
  })
  
  socket.on('connectToPrivateChatNotifications', async ({ user_id }) => {
    socket.join(user_id)
    console.log("joined room", user_id)

    const notificationsRef = admin.firestore().collection(`user/${user_id}/notifications`)
    
    let isFirstSnapshot = true

    notificationsRef.onSnapshot((snapshot) => {
      const notifications = snapshot.docChanges()
      .filter(change => change.type === 'added' || change.type === 'modified')
      .map(change => change.doc.data())

      const filteredNotifications = notifications.filter(notification => notification.type === 'message')

    if (isFirstSnapshot) {
      io.to(user_id).emit('loadAllPrivateChatNotifications', filteredNotifications)
      isFirstSnapshot = false
    } else {
      io.to(user_id).emit('loadAllPrivateChatNotifications', filteredNotifications[0])
    }
    })
  })

  socket.on('disconnectPrivateChatNotifications', async ({ user_id }) => {
    socket.leave(user_id)
    console.log("left room", user_id)
  })
  
  //Chat
  
  socket.on('connectToChat', async ({ id, type }) => {
    try {
      const chatCollectionRef = admin.firestore().collection(`${type}s/${id}/chats`)
      const existingChatQuery = await chatCollectionRef.get()
      let currentChatId = ''
  
      if (existingChatQuery.size > 0) {
        currentChatId = existingChatQuery.docs[0].id
        console.log('Found existing chat:', currentChatId)
      } else {
        const newChatId = `${id}_${uuidv4()}`
        console.log('New chat id is:', newChatId)
        await chatCollectionRef.doc(newChatId).set({})
        currentChatId = newChatId
        console.log('New chat created', currentChatId)
      }
  
      let isFirstSnapshot = true
      const messagesRef = admin.firestore().collection(`${type}s/${id}/chats/${currentChatId}/messages`)

      messagesRef.onSnapshot((snapshot) => {
        const messages = snapshot.docChanges()
          .filter(change => change.type === 'added' || change.type === 'modified')
          .map(change => change.doc.data())
  
        if (isFirstSnapshot) {
          io.to(currentChatId).emit('loadAllMessages', messages)
          isFirstSnapshot = false
        } else {
          io.to(currentChatId).emit('loadNewMessage', messages)
        }
      })
  
      socket.join(currentChatId)
      console.log('User connected to chat', currentChatId)
      socket.emit('gotChat', currentChatId)
    } catch (err) {
      console.log('err creating/updating chat:', err)
    }
  })

  socket.on('sendMessage', async ( newMessage ) => {
    console.log('new message data is:', newMessage)

    const { messageId, id, chatId } = newMessage
    const messagesRef = admin.firestore().collection(`artists/${id}/chats/${chatId}/messages`).doc(messageId)

    try {
      await messagesRef.set(newMessage)
      console.log('Message added to Firestore:', newMessage)

      const messagesSnapshot = await messagesRef.get()
      if (messagesSnapshot.size > 100) {

        const messagesToDelete = messagesSnapshot.size - 100
        const batch = admin.firestore().batch()
        messagesSnapshot.docs.slice(0, messagesToDelete).forEach(doc => {
          batch.delete(doc.ref)
        })
        await batch.commit()
        console.log(`Deleted ${messagesToDelete} old message(s) to maintain limit.`)
      }
    } catch (err) {
      console.log('err adding message to Firestore:', err)
    }
  })

  socket.on('removeMessage', async ({ id, chatId, messageId }) => {
    const messageRef =  admin.firestore().doc(`artists/${id}/chats/${chatId}/messages/${messageId}`)
    try {
        await messageRef.update({
            display: false
        })
        console.log('Message display status updated successfully.')
      } catch (err) {
          console.log('err updating message display status:', err)
      }
  })

  socket.on('leaveChat', ({ chatId }) => {
    socket.leave(chatId)
    console.log('Disconnecting from chat:', chatId)
  })
})


