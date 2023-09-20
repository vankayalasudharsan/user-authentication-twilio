const express = require('express')

const router = express.Router()

const userRegistrationController = require('../../controllers/register/userregister');

router.post('/send-otp',userRegistrationController.sendOtp)
router.post('/verify-otp',userRegistrationController.VerifyOtp)


module.exports = router