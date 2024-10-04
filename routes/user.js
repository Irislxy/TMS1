const express = require("express")
const router = express.Router()
const { isAuthenticated } = require("../middlewares/verifyJWT")

// Importing user controller methods
const userController = require("../controllers/userController")

router.get("/getUserDetails", isAuthenticated, userController.getUserDetails)
router.get("/getAllGroups", isAuthenticated, userController.getAllGroups)
router.get("/getAllUserWithGroup", isAuthenticated, userController.getAllUserWithGroup)
router.post("/newUser", isAuthenticated, userController.newUser)
router.put("/updateEmail", isAuthenticated, userController.updateEmail)
router.put("/updatePassword", isAuthenticated, userController.updatePassword)
router.patch("/disableUser", isAuthenticated, userController.disableUser)

module.exports = router
