const express = require("express")
const router = express.Router()
const { isAuthenticated } = require("../middlewares/verifyJWT")

// Importing appList controller methods
const taskController = require("../controllers/taskController")

router.post("/getAllTaskByApp", isAuthenticated, taskController.getAllTaskByApp)
router.post("/getTaskDetails", isAuthenticated, taskController.getTaskDetails)
router.post("/checkTaskPermission", isAuthenticated, taskController.checkTaskPermission)
router.post("/createTask", isAuthenticated, taskController.createTask)
router.put("/updateNotes", isAuthenticated, taskController.updateNotes)
router.put("/updateTaskPlan", isAuthenticated, taskController.updateTaskPlan)
router.patch("/promoteTask", isAuthenticated, taskController.promoteTask)
router.patch("/demoteTask", isAuthenticated, taskController.demoteTask)

module.exports = router
