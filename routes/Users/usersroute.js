const express = require("express");

const router = express.Router();

const users = require("../../controllers/Users/userController");

const verifyToken = require("../../middleware/verifyToken");

router.get("/list", verifyToken.tokenVerification, users.list);

module.exports = router;
