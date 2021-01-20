const { validationResult } = require('express-validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const User = require('../models/user')

exports.signup = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.')
    error.statusCode = 422
    error.data = errors.array()
    throw error
  }

  const { email, password, name } = req.body
  bcrypt
    .hash(password, 12)
    .then(hashedPwd => {
      const user = new User({
        email,
        name,
        password: hashedPwd
      })
      return user.save()
    })
    .then(createdUser => {
      res.status(201).json({
        message: 'New user created',
        id: createdUser._id
      })
    })
    .catch(err => {
      next(err)
    })
}

exports.login = (req, res, next) => {
  const { email, password } = req.body
  let loadedUser

  User.findOne({ email })
    .then(user => {
      if (!user) {
        const error = new Error('A user with this email could not be found')
        error.statusCode = 401
        throw error
      }
      loadedUser = user
      return bcrypt.compare(password, loadedUser.password)
    })
    .then(isEqual => {
      if (!isEqual) {
        const error = new Error('Wrong password')
        error.statusCode = 401
        throw error
      }

      const token = jwt.sign({
          email: loadedUser.email,
          userId: loadedUser._id.toString()
        },
        process.env.JWT_PRIVATE_KEY,
        { expiresIn: '1h' }
      )
      res.status(200).json({
        token,
        userId: loadedUser._id.toString()
      })
    })
    .catch(err => {
      next(err)
    })
}
