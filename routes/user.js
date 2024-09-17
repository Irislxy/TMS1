const express = require("express")
const router = express.Router()
const { isAuthenticated } = require("../middlewares/verifyJWT")

// Importing user controller methods
const userController = require("../controllers/userController")

router.get("/alluser", isAuthenticated, userController.getAllUser)
router.get("/alluserwithgrp", userController.getAllUserWithGroup)
router.get("/user", isAuthenticated, userController.getOneUser)
router.post("/newuser", isAuthenticated, userController.newUser)
router.put("/updateEmail", isAuthenticated, userController.updateEmail)
router.put("/updatePassword", isAuthenticated, userController.updatePassword)
router.patch("/disableuser", isAuthenticated, userController.disableUser)

module.exports = router
