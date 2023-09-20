const express = require('express')

const router = express.Router()

const authController = require('../../controllers/authentication/authController');

router.post('/login-password',authController.login)
router.post('/login-send-otp',authController.sendOtp)
router.post('/login-verify-otp',authController.verifyOtp)



module.exports = router