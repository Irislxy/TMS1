const pool = require("../config/db_connection")
const ErrorHandler = require("../utils/errorHandler")

// get all task within an app
exports.getAllTask = async (req, res, next) => {
  //not tested
  try {
    const query = "SELECT * FROM task"

    const [results] = await pool.query(query)

    // Return all task
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
  //not tested
  const { task_app_acronym } = req.body

  // Check if task_app_acronym is defined
  if (!task_app_acronym) {
    return next(new ErrorHandler("Task App acronym not defined", 400))
  }

  try {
    const query = "SELECT * FROM task WHERE task_app_acronym = ?"

    const [results] = await pool.query(query, [task_app_acronym])

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

exports.updateNotes = async (req, res, next) => {
  const { task_id, task_notes } = req.body

  try {
    const query = "UPDATE task SET task_notes = ? WHERE task_id = ?"

    const [results] = await pool.query(query, [task_id, task_notes])

    // Check if the app was updated (affectedRows > 0)
    if (results.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "No changes made"
      })
    }

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

    const [results] = await pool.query(query, [task_id, task_plan])

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
