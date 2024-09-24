const express = require("express")
const router = express.Router()
const { isAuthenticated } = require("../middlewares/verifyJWT")

// Importing appList controller methods
const taskController = require("../controllers/taskController")

router.get("/getAllTask", isAuthenticated, taskController.getAllTask)
router.post("/getTaskDetails", isAuthenticated, taskController.getTaskDetails)
router.post("/createTask", isAuthenticated, taskController.createTask)
router.put("/updateNotes", isAuthenticated, taskController.updateNotes)
router.put("/updateTaskPlan", isAuthenticated, taskController.updateTaskPlan)

module.exports = router
