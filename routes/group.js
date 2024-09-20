const express = require("express")
const router = express.Router()
const { isAuthenticated } = require("../middlewares/verifyJWT")

// Importing group controller methods
const groupController = require("../controllers/groupController")

router.post("/createGroup", isAuthenticated, groupController.createGroup)
router.get("/getAllGroup", isAuthenticated, groupController.getAllGroup)
router.put("/updateGroup", isAuthenticated, groupController.updateGroup)

module.exports = router
