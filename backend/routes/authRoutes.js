const express = require('express')
const router  = express.Router()
const { login, register, me, changePassword } = require('../controllers/authController')
const { verifyToken } = require('../middleware/auth')

router.post('/login',    login)
router.post('/register', register)
router.get('/me',        verifyToken, me)
router.put('/me',        verifyToken, changePassword)

module.exports = router
