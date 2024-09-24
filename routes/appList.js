const express = require("express")
const router = express.Router()
const { isAuthenticated } = require("../middlewares/verifyJWT")

// Importing appList controller methods
const appListController = require("../controllers/appListController")

router.get("/getAllApp", isAuthenticated, appListController.getAllApp)
router.post("/getAppDetails", isAuthenticated, appListController.getAppDetails)
router.post("/createApp", isAuthenticated, appListController.createApp)
router.patch("/updateApp", isAuthenticated, appListController.updateApp)

module.exports = router
