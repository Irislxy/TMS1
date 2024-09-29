const pool = require("../config/db_connection")
const ErrorHandler = require("../utils/errorHandler")

// get all task by app
exports.getAllTaskByApp = async (req, res, next) => {
  const { task_app_acronym } = req.body

  // Check if task_app_acronym is defined
  if (!task_app_acronym) {
    return next(new ErrorHandler("Task App Acronym is not defined", 400))
  }
  try {
    const query = "SELECT * FROM task WHERE task_app_acronym = ?"

    const [results] = await pool.execute(query, [task_app_acronym])

    return res.status(200).json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error("Error while getting all task:", error)
    return next(new ErrorHandler("Error while getting all task", 500))
  }
}

// get all task by plan
exports.getAllTaskByPlan = async (req, res, next) => {
  const { task_plan } = req.body

  // Check if task_plan is defined
  if (!task_plan) {
    return next(new ErrorHandler("Task Plan is not defined", 400))
  }
  try {
    const query = "SELECT * FROM task WHERE task_plan = ?"

    const [results] = await pool.execute(query, [task_plan])

    return res.status(200).json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error("Error while getting all task:", error)
    return next(new ErrorHandler("Error while getting all task", 500))
  }
}

exports.getTaskDetails = async (req, res, next) => {
  const { task_id } = req.body

  // Check if task_id is defined
  if (!task_id) {
    return next(new ErrorHandler("Task ID not defined", 400))
  }

  try {
    const query = "SELECT * FROM task WHERE task_id = ?"

    const [results] = await pool.execute(query, [task_id])

    return res.status(200).json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error("Error while getting task details:", error)
    return next(new ErrorHandler("Error while getting task details", 500))
  }
}

//only PL can create task
exports.createTask = async (req, res, next) => {
  let username = req.user.username
  let is_PL = await checkGroup(username, "pl")

  if (!is_PL) {
    return res.status(500).json({
      message: "Do not have permission to access this resource"
    })
  }

  const { task_id, task_name, task_description, task_notes, task_plan, task_app_acronym, task_state, task_creator, task_owner, task_createdate } = req.body

  // Check if all fields are provided
  if (!task_name) {
    return next(new ErrorHandler("Task name is not provided", 400))
  }

  try {
    const query = "INSERT INTO task (task_id, task_name, task_description, task_notes, task_plan, task_app_acronym, task_state, task_creator, task_owner, task_createdate) VALUES (?,?,?,?,?,?,?,?,?,?)"

    await pool.execute(query, [task_id, task_name, task_description, task_notes, task_plan, task_app_acronym, task_state, task_creator, task_owner, task_createdate])

    // Send success response
    return res.status(201).json({
      success: true,
      message: "Task created",
      data: {
        task_id: task_id,
        task_name: task_name,
        task_description: task_description,
        task_notes: task_notes,
        task_plan: task_plan,
        task_app_acronym: task_app_acronym,
        task_state: task_state,
        task_creator: task_creator,
        task_owner: task_owner,
        task_createdate: task_createdate
      }
    })
  } catch (err) {
    console.error("Error while creating task:", err)
    return next(new ErrorHandler("Error while creating task", 500))
  }
}

//update notes within the task
exports.updateNotes = async (req, res, next) => {
  const { task_id, task_notes } = req.body

  try {
    const query = "UPDATE task SET task_notes = ? WHERE task_id = ?"

    await pool.execute(query, [task_notes, task_id])

    return res.status(200).json({
      success: true,
      message: "Task notes updated successfully",
      data: {
        task_id: task_id,
        task_notes: task_notes
      }
    })
  } catch (error) {
    console.error("Error while updating task notes:", error)
    return next(new ErrorHandler("Error while updating task notes", 500))
  }
}

// update plan within the task
exports.updateTaskPlan = async (req, res, next) => {
  const { task_id, task_plan } = req.body

  try {
    const query = "UPDATE task SET task_plan = ? WHERE task_id = ?"

    await pool.execute(query, [task_plan, task_id])

    return res.status(200).json({
      success: true,
      message: "Task plan updated successfully",
      data: {
        task_id: task_id,
        task_plan: task_plan
      }
    })
  } catch (error) {
    console.error("Error while updating task plan:", error)
    return next(new ErrorHandler("Error while updating task plan", 500))
  }
}

const checkGroup = async (username, groupname) => {
  //console.log(username)
  //console.log(groupname)
  try {
    const [result] = await pool.query(
      `SELECT *
      FROM user u
      JOIN user_group ug ON u.user_name = ug.user_name
      JOIN group_list g ON ug.group_id = g.group_id
      WHERE u.user_name = ? AND g.group_name = ?`,
      [username, groupname]
    )

    //console.log(result.length)

    if (result.length === 0) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}
