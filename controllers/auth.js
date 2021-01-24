const { validationResult } = require('express-validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const User = require('../models/user')

exports.signup = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.')
    error.statusCode = 422
    error.data = errors.array()
    throw error
  }

  const { email, password, name } = req.body
  try {
    const hashedPwd = await bcrypt.hash(password, 12)
    const user = new User({
      email,
      name,
      password: hashedPwd
    })
    const createdUser = await user.save()
    res.status(201).json({
      message: 'New user created',
      id: createdUser._id
    })
  } catch (err) {
    next(err)
  }
}

exports.login = async (req, res, next) => {
  const { email, password } = req.body
  let loadedUser

  try {
    const user = await User.findOne({ email })
    if (!user) {
      const error = new Error('A user with this email could not be found')
      error.statusCode = 401
      throw error
    }
    loadedUser = user
    const isEqual = await bcrypt.compare(password, loadedUser.password)
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
  } catch (err) {
    next(err)
  }
}

exports.getUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      const error = new Error('User not found.')
      error.statusCode = 404
      throw error
    }
    res.status(200).json({
      message: 'Status fetched successfully.',
      status: user.status
    })
  } catch (err) { next(err) }
}

exports.updateUserStatus = async (req, res, next) => {
  const { status } = req.body
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      const error = new Error('User not found.')
      error.statusCode = 404
      throw error
    }
    user.status = status
    const updatedUser = await user.save()
    res.status(200).json({
      message: 'Status updated successfully.',
      status: updatedUser.status
    })
  } catch (err) { next(err)}
}
