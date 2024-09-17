const express = require("express")
const router = express.Router()
const { isAuthenticated } = require("../middlewares/verifyJWT")

// Importing group controller methods
const groupController = require("../controllers/groupController")

router.post("/creategroup", isAuthenticated, groupController.createGroup)
router.get("/allgroup", isAuthenticated, groupController.getAllGroup)
router.put("/updategroup", isAuthenticated, groupController.updateGroup)

module.exports = router
