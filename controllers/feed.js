const fs = require('fs')
const path = require('path')

const { validationResult } = require('express-validator')

const Post = require('../models/post')
const User = require('../models/user')

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1
  const perPage = 2
  try {
    const totalItems = await Post.countDocuments()
    const posts = await Post.find()
      .populate('creator')
      .skip((currentPage - 1) * perPage)
      .limit(perPage)
    if (!posts) {
      const error = new Error('No posts found.')
      error.statusCode = 404
      throw error
    }
    res.status(200).json({
      message: 'Posts fetched successfully.',
      posts,
      totalItems
    })
  } catch (err) { next(err) }
}

exports.createPost = async (req, res, next) => {
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
    creator: req.userId
  })
  try {
    await post.save()
    const user = await User.findById(req.userId)
    user.posts.push(post)
    const updatedUser = await user.save()
    res.status(201).json({
      message: 'Post created successfully!',
      post,
      creator: { id: user._id.toString(), name: user.name }
    })
  } catch (err) { next(err) }
}

exports.getPost = async (req, res, next) => {
  const { postId } = req.params
  try {
    const post = await Post.findById(postId)
    if (!post) {
      const error = new Error('Post not found.')
      error.statusCode = 404
      throw error
    }
    res.status(200).json({
      message: 'Post updated successfully.',
      post
    })
  } catch (err) { next(err)}
}

exports.updatePost = async (req, res, next) => {
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
  try {
    const post = await Post.findById(postId)
    if (!post) {
      const error = new Error('Post not found.')
      error.statusCode = 404
      throw error
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not Authorized.')
      error.statusCode = 403
      throw error
    }
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl)
    }
    post.title = title
    post.content = content
    post.imageUrl = imageUrl
    const updatedPost = await post.save()
    res.status(200).json({
      message: 'Post updated successfully',
      post: updatedPost
    })
  } catch (err) { next(err)}
}

exports.deletePost = async (req, res, next) => {
  const { postId } = req.params
  try {
    const post = await Post.findById(postId)
    if (!post) {
      const error = new Error('Post not found.')
      error.statusCode = 404
      throw error
    }
    if (post.creator.toString() !== req.userId) {
      const error = new Error('Not Authorized.')
      error.statusCode = 403
      throw error
    }
    clearImage(post.imageUrl)
    await Post.findByIdAndRemove(postId)
    const user = await User.findById(req.userId)
    user.posts.pull(postId)
    await user.save()
    res.status(200).json({ message: 'Deleted post.' })
  } catch (err) { next(err) }
}

const clearImage = imagePath => {
  const filePath = path.join(__dirname, '..', imagePath)
  fs.unlink(filePath, err => { console.error(err) })
}
