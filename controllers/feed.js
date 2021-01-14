const { validationResult } = require('express-validator')

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [{
      _id: 'l346sgjan',
      title: 'First post',
      content: 'This is the first post!',
      imageUrl: 'images/duck.jpg',
      creator: {
        name: 'Vasilii'
      },
      createdAt: new Date()
    }]
  })
}

exports.createPost = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed, entered data is incorrect.',
      errors: errors.array()
    })
  }
  const { title, content } = req.body
  // create post in db
  res.status(201).json({
    message: 'Post created successfully!',
    post: {
      id: new Date().toISOString(),
      title,
      content,
      imageUrl: 'images/duck.jpg',
      creator: {
        name: 'Vasilii'
      },
      createdAt: new Date()
    }
  })
}
