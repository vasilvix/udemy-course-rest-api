const express = require('express')
const { body } = require('express-validator')

const isAuth = require('../middleware/is-auth')
const authController = require('../controllers/auth')
const User = require('../models/user')

const router = express.Router()

router.put('/signup', [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .normalizeEmail()
      .custom((value, { req }) => {
        return User
          .findOne({ email: value })
          .then(userDoc => {
            if (userDoc) {
              return Promise.reject('E-Mail address is already exists')
            }
          })
      }),
    body('password')
      .trim()
      .isLength({ min: 6 }),
    body('name')
      .trim()
      .not()
      .isEmpty()
  ],
  authController.signup
)

router.post('/login', authController.login)

router.get('/status', isAuth, authController.getUserStatus)

router.put('/status',
  isAuth,
  [
    body('status')
      .trim()
      .not()
      .isEmpty()
  ],
  authController.updateUserStatus)

module.exports = router
