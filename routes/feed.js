const express = require('express')
const { body } = require('express-validator')

const isAuth = require('../middleware/is-auth')
const feedController = require('../controllers/feed')

const router = express.Router()

// GET /feed/posts
router.get('/posts', isAuth, feedController.getPosts)

// POST /feed/post
router.post(
  '/post',
  isAuth,
  [
    body(['title', 'content'])
      .trim()
      .isLength({ min: 5 })
  ],
  feedController.createPost)

router.get('/post/:postId', feedController.getPost)

router.put('/post/:postId',
  isAuth,
  [
    body(['title', 'content'])
      .trim()
      .isLength({ min: 5 })
  ],
  feedController.updatePost)

router.delete('/post/:postId', isAuth, feedController.deletePost)

module.exports = router
