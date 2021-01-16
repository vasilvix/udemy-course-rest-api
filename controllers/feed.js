const fs = require('fs')
const path = require('path')

const { validationResult } = require('express-validator')

const Post = require('../models/post')

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1
  const perPage = 2
  let totalItems
  Post.countDocuments()
    .then(count => {
      totalItems = count
      return Post.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage)
    })
    .then(posts => {
      if (!posts) {
        const error = new Error('No posts found')
        error.statusCode = 404
        throw error
      }
      res.status(200).json({
        message: 'Posts fetched successfully',
        posts,
        totalItems
      })
    })
    .catch(err => next(err))

}

exports.createPost = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.')
    error.statusCode = 422
    throw error
  }
  if (!req.file) {
    const error = new Error('No image provided.')
    error.statusCode = 422
    throw error
  }
  const { title, content } = req.body
  const imageUrl = req.file.path.replace('\\', '/')
  const post = new Post({
    title,
    content,
    imageUrl,
    creator: { name: 'Vasilii' }
  })
  post
    .save()
    .then(result => {
      res.status(201).json({
        message: 'Post created successfully!',
        post: result
      })
    })
    .catch(err => next(err))
}

exports.getPost = (req, res, next) => {
  const { postId } = req.params
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Post not found.')
        error.statusCode = 404
        throw error
      }
      res.status(200).json({
        message: 'Post updated successfully',
        post
      })
    })
    .catch(err => next(err))
}

exports.updatePost = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.')
    error.statusCode = 422
    throw error
  }
  const { postId } = req.params
  const { title, content } = req.body
  let { image: imageUrl } = req.body
  if (req.file) {
    imageUrl = req.file.path.replace('\\', '/')
  }
  if (!imageUrl) {
    const error = new Error('No image provided.')
    error.statusCode = 422
    throw error
  }
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Post not found.')
        error.statusCode = 404
        throw error
      }
      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl)
      }
      post.title = title
      post.content = content
      post.imageUrl = imageUrl
      return post.save()
    })
    .then(updatedPost => {
      res.status(200).json({
        message: 'Post fetched successfully',
        post: updatedPost
      })
    })
    .catch(err => next(err))
}

exports.deletePost = (req, res, next) => {
  const { postId } = req.params
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Post not found.')
        error.statusCode = 404
        throw error
      }
      // Check logged in user
      clearImage(post.imageUrl)
      return Post.findByIdAndRemove(postId)
    })
    .then(result => {
      res.status(200).json({ message: 'Post was deleted' })
    })
    .catch(err => next(err))
}

const clearImage = imagePath => {
  const filePath = path.join(__dirname, '..', imagePath)
  fs.unlink(filePath, err => { console.error(err) })
}
