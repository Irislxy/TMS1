const pool = require("../config/db_connection")
const ErrorHandler = require("../utils/errorHandler")
const { sendEmail } = require("../config/mailer")

// get all task by app
exports.getAllTaskByApp = async (req, res, next) => {
  const { task_app_acronym } = req.body

  // Check if task_app_acronym is defined
  if (!task_app_acronym) {
    return next(new ErrorHandler("Task App Acronym is not defined", 400))
  }
  try {
    // Query to select tasks and plan colour by joining the plan table
    const query = `
      SELECT task.*, plan.plan_colour 
      FROM task
      LEFT JOIN plan 
      ON task.task_plan = plan.plan_mvp_name 
      WHERE task.task_app_acronym = ?
    `

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

  const { task_name, task_description, task_notes, task_plan, task_app_acronym } = req.body

  // Check if task_name is provided
  if (!task_name || !task_app_acronym) {
    return next(new ErrorHandler("Task name or app acronym is not provided", 400))
  }

  // Default values
  let task_state = "open"
  let task_creator = username
  let task_owner = username
  let task_createdate = new Date().toISOString().split("T")[0] // Only the date part

  try {
    // Start a transaction
    await pool.query("START TRANSACTION")

    // 1. Fetch the current running number from the application table
    const [rows] = await pool.execute("SELECT app_rnumber FROM application WHERE app_acronym = ?", [task_app_acronym])

    if (rows.length === 0) {
      return next(new ErrorHandler("Application acronym not found", 404))
    }

    let current_running_number = rows[0].app_rnumber

    // 2. Increment the running number
    current_running_number += 1

    // 3. Update the application table with the new running number
    await pool.execute("UPDATE application SET app_rnumber = ? WHERE app_acronym = ?", [current_running_number, task_app_acronym])

    // 4. Generate the task_id in the format '[app_acronym]_[running number]'
    const task_id = `${task_app_acronym}_${current_running_number}`

    // 5. Insert the new task into the task table
    const insertQuery = `
      INSERT INTO task (
        task_id, task_name, task_description, task_notes, task_plan, 
        task_app_acronym, task_state, task_creator, task_owner, task_createdate
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    await pool.execute(insertQuery, [task_id, task_name, task_description || null, task_notes || null, task_plan || null, task_app_acronym, task_state, task_creator, task_owner, task_createdate])

    // 6. Commit the transaction
    await pool.query("COMMIT")

    // Return success response
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
  } catch (error) {
    // Rollback transaction in case of error
    await pool.query("ROLLBACK")
    console.error("Error while creating task:", error)
    return next(new ErrorHandler("Error while creating task", 500))
  }
}

//update notes within the task
exports.updateNotes = async (req, res, next) => {
  const { task_id, task_notes } = req.body
  const username = req.user.username
  let task_state

  try {
    // Start a transaction
    await pool.query("START TRANSACTION")

    // Fetch existing task notes, current task state from task
    const [taskRow] = await pool.execute("SELECT task_notes, task_state FROM task WHERE task_id = ?", [task_id])
    if (taskRow.length === 0) {
      return res.status(404).json({ message: "Task not found" })
    }

    const currentNotes = taskRow[0].task_notes || ""
    task_state = taskRow[0].task_state

    // Format new note with metadata (username, task_state, date&timestamp)
    const newNoteEntry = `\n[${new Date().toLocaleString("en-US")}] (${username} - ${task_state}): ${task_notes}`

    // Prepend new note to the existing notes
    const updatedNotes = newNoteEntry + currentNotes

    // Update task_notes field in the task table
    const updateQuery = "UPDATE task SET task_notes = ? WHERE task_id = ?"
    await pool.execute(updateQuery, [updatedNotes, task_id])

    // Commit the transaction
    await pool.query("COMMIT")

    // Return a success response
    return res.status(200).json({
      success: true,
      message: "Task notes updated successfully",
      data: {
        task_id: task_id,
        task_notes: updatedNotes // Return the updated notes
      }
    })
  } catch (error) {
    // Rollback transaction in case of error
    await pool.query("ROLLBACK")
    console.error("Error while updating task notes:", error)
    return next(new ErrorHandler("Error while updating task notes", 500))
  }
}

// update plan within the task (only PL and PM)
exports.updateTaskPlan = async (req, res, next) => {
  let username = req.user.username
  let is_PL = await checkGroup(username, "pl")
  let is_PM = await checkGroup(username, "pm")

  if (!is_PM && !is_PL) {
    return res.status(500).json({
      message: "Do not have permission to access this resource"
    })
  }

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

exports.promoteTask = async (req, res, next) => {
  let username = req.user.username
  const { task_id } = req.body

  try {
    // Start a transaction
    await pool.query("START TRANSACTION")

    const [rows] = await pool.execute("SELECT task_state, task_owner, task_creator FROM task WHERE task_id = ?", [task_id])
    const currentState = rows[0]?.task_state
    const taskOwner = rows[0]?.task_owner
    const taskCreator = rows[0]?.task_creator

    let newState
    switch (currentState) {
      case "open":
        newState = "todo"
        break
      case "todo":
        newState = "doing"
        break
      case "doing":
        newState = "done"
        break
      case "done":
        newState = "close"
        break
      default:
        return res.status(400).json({ success: false, message: "Cannot promote from this state" })
    }

    await pool.execute("UPDATE task SET task_state = ?, task_owner = ? WHERE task_id = ?", [newState, username, task_id])

    // If the new state is 'done', send email to pl
    if (newState === "done") {
      // Fetch the email of the task creator
      const [userRows] = await pool.execute("SELECT email FROM user WHERE user_name = ?", [taskCreator])
      const plEmail = userRows[0]?.email // pl email address
      const subject = `Task ${task_id} Promoted to Done`
      const message = `The task with ID ${task_id} has been promoted to Done by ${taskOwner}.`

      try {
        await sendEmail(plEmail, subject, message)
      } catch (emailError) {
        console.error("Error sending email:", emailError)
      }
    }

    // Commit the transaction
    await pool.query("COMMIT")

    return res.status(200).json({
      success: true,
      message: "Task promoted successfully",
      newState
    })
  } catch (error) {
    // Rollback transaction in case of error
    await pool.query("ROLLBACK")
    console.error("Error while promoting task:", error)
    return next(new ErrorHandler("Error while promoting task", 500))
  }
}

exports.demoteTask = async (req, res, next) => {
  const { task_id } = req.body

  try {
    // Start a transaction
    await pool.query("START TRANSACTION")

    const [rows] = await pool.execute("SELECT task_state FROM task WHERE task_id = ?", [task_id])
    const currentState = rows[0]?.task_state

    let newState
    switch (currentState) {
      case "todo":
        newState = "open"
        break
      case "doing":
        newState = "todo"
        break
      case "done":
        newState = "doing"
        break
      case "close":
        newState = "done"
        break
      default:
        return res.status(400).json({ success: false, message: "Cannot demote from this state" })
    }

    await pool.execute("UPDATE task SET task_state = ? WHERE task_id = ?", [newState, task_id])

    // Commit the transaction
    await pool.query("COMMIT")

    return res.status(200).json({
      success: true,
      message: "Task demoted successfully",
      newState
    })
  } catch (error) {
    // Rollback transaction in case of error
    await pool.query("ROLLBACK")
    console.error("Error while demoting task:", error)
    return next(new ErrorHandler("Error while demoting task", 500))
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
