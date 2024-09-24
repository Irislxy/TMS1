const express = require("express")
const router = express.Router()
const { isAuthenticated } = require("../middlewares/verifyJWT")

// Importing appList controller methods
const planController = require("../controllers/planController")

router.get("/getAllPlan", isAuthenticated, planController.getAllPlan)
router.post("/getPlanDetails", isAuthenticated, planController.getPlanDetails)
router.post("/createPlan", isAuthenticated, planController.createPlan)
router.patch("/updatePlan", isAuthenticated, planController.updatePlan)

module.exports = router
