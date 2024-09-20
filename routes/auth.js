const express = require("express")
const router = express.Router()
const { isAuthenticated } = require("../middlewares/verifyJWT")

// Importing auth controller methods
const authController = require("../controllers/authController")

router.route("/login").post(authController.loginUser)
router.route("/logout").post(authController.logout)

module.exports = router
