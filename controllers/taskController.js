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

// Check if user has permission
exports.checkTaskPermission = async (req, res, next) => {
  let username = req.user.username
  const { app_acronym } = req.body

  try {
    // 1. Fetch the permitted group for creating tasks from the `application` table
    const [appRow] = await pool.execute("SELECT app_permit_create, app_permit_open, app_permit_todo, app_permit_doing, app_permit_done FROM application WHERE app_acronym = ?", [app_acronym])

    if (appRow.length === 0) {
      return res.status(404).json({ message: "Application not found" })
    }

    const allowedCreateGroup = appRow[0].app_permit_create //store allowed group
    const allowedOpenGroup = appRow[0].app_permit_open
    const allowedTodoGroup = appRow[0].app_permit_todo
    const allowedDoingGroup = appRow[0].app_permit_doing
    const allowedDoneGroup = appRow[0].app_permit_done

    // 2. Check if the user belongs to the permitted group from the `user_group` table
    const [userGroupRow] = await pool.execute(
      `SELECT gl.group_name 
       FROM user_group ug
       JOIN group_list gl ON ug.group_id = gl.group_id
       WHERE ug.user_name = ? AND (gl.group_name = ? OR gl.group_name = ? OR gl.group_name = ? OR gl.group_name = ? OR gl.group_name = ?)`,
      [username, allowedCreateGroup, allowedOpenGroup, allowedTodoGroup, allowedDoingGroup, allowedDoneGroup]
    )

    // Initialize permission flags
    let canCreate = false
    let canOpen = false
    let canTodo = false
    let canDoing = false
    let canDone = false

    // Check if user belongs to the allowed groups
    userGroupRow.forEach((row) => {
      const userGroupName = row.group_name

      // Set permission flags based on the user group name
      if (userGroupName === allowedCreateGroup) canCreate = true
      if (userGroupName === allowedOpenGroup) canOpen = true
      if (userGroupName === allowedTodoGroup) canTodo = true
      if (userGroupName === allowedDoingGroup) canDoing = true
      if (userGroupName === allowedDoneGroup) canDone = true
    })

    // Return the permission flags in the response
    return res.status(200).json({
      canCreate,
      canOpen,
      canTodo,
      canDoing,
      canDone
    })
  } catch (error) {
    console.error("Error checking task creation permissions:", error)
    return next(new ErrorHandler("Error checking task creation permissions", 500))
  }
}

//only (group: pl_1) can create task
exports.createTask = async (req, res, next) => {
  let username = req.user.username

  const { task_name, task_description, task_notes, task_plan, task_app_acronym } = req.body

  //check task permission
  try {
    // 1. Fetch the permitted group for creating tasks from the `application` table
    const [appRow] = await pool.execute("SELECT app_permit_create FROM application WHERE app_acronym = ?", [task_app_acronym])

    if (appRow.length === 0) {
      return res.status(404).json({ message: "Application not found" })
    }

    const allowedCreateGroup = appRow[0].app_permit_create // Get allowed group (e.g., 'pl_1')

    // 2. Check if the user belongs to the permitted group from the `user_group` table
    const [userGroupRow] = await pool.execute(
      `
      SELECT ug.group_id 
      FROM user_group ug
      JOIN group_list gl ON ug.group_id = gl.group_id
      WHERE ug.user_name = ? AND gl.group_name = ?
    `,
      [username, allowedCreateGroup]
    )

    // If user is not in the allowed group, return a permission error
    if (userGroupRow.length === 0) {
      return res.status(403).json({ message: "Do not have permission to create tasks." })
    }
  } catch (permissionError) {
    console.error("Permission check error:", permissionError)
    return next(new ErrorHandler("Error checking task creation permissions", 500))
  }

  // Check if task_name is provided
  if (!task_name || !task_app_acronym) {
    return next(new ErrorHandler("Task name or app acronym is not provided", 400))
  }

  // Default values
  let task_state = "open"
  let task_creator = username
  let task_owner = username
  let task_createdate = new Date().toISOString().split("T")[0] // Only the date part

  // Add the audit trail entry for task notes
  let formattedNotes = ""
  if (task_notes) {
    formattedNotes = `\n[${new Date().toLocaleString("en-US")}] (${username} - ${task_state}): ${task_notes}`
  }

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

    await pool.execute(insertQuery, [task_id, task_name, task_description || null, formattedNotes || null, task_plan || null, task_app_acronym, task_state, task_creator, task_owner, task_createdate])

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
        task_notes: formattedNotes,
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

async function enforcePermissions(task_id, username) {
  // Fetch task details and allowed group for current state
  const [taskRow] = await pool.execute(
    `
    SELECT task_state, app_permit_open, app_permit_todo, app_permit_doing, app_permit_done 
    FROM task 
    JOIN application ON task.task_app_acronym = application.app_acronym 
    WHERE task_id = ?`,
    [task_id]
  )

  const taskState = taskRow[0].task_state
  const permittedGroup = taskRow[0][`app_permit_${taskState}`] // dynamically get group for current state

  // Check if user belongs to the allowed group (group_name)
  const [userGroupRow] = await pool.execute(
    `
    SELECT group_list.group_name 
    FROM user_group 
    JOIN group_list ON user_group.group_id = group_list.group_id 
    WHERE user_group.user_name = ?`,
    [username]
  )

  const userGroup = userGroupRow[0]?.group_name

  return userGroup === permittedGroup // Return true if user is in the permitted group
}

//update notes within the task
exports.updateNotes = async (req, res, next) => {
  const { task_id, task_notes } = req.body
  const username = req.user.username
  let task_state // to store current task state

  try {
    // Call enforcePermissions to check if the user has permission
    let hasPermission = await enforcePermissions(task_id, username)

    if (!hasPermission) {
      return res.status(403).json({
        message: "Do not have permission to update task notes."
      })
    }
  } catch (permissionError) {
    console.error("Permission check error:", permissionError)
    return next(new ErrorHandler("Error checking task permissions", 500))
  }

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

    // notes with audit trail (username, task_state, date&timestamp)
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

// update plan within the task (pm_1)
exports.updateTaskPlan = async (req, res, next) => {
  let username = req.user.username
  const { task_id, task_plan } = req.body

  try {
    // Call enforcePermissions to check if the user has permission
    let hasPermission = await enforcePermissions(task_id, username)

    if (!hasPermission) {
      return res.status(403).json({
        message: "Do not have permission to update task plan."
      })
    }
  } catch (permissionError) {
    console.error("Permission check error:", permissionError)
    return next(new ErrorHandler("Error checking task permissions", 500))
  }

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
    // Call enforcePermissions to check if the user has permission
    let hasPermission = await enforcePermissions(task_id, username)

    if (!hasPermission) {
      return res.status(403).json({
        message: "Do not have permission to perform this action."
      })
    }
  } catch (permissionError) {
    console.error("Permission check error:", permissionError)
    return next(new ErrorHandler("Error checking task permissions", 500))
  }

  try {
    // Start a transaction
    await pool.query("START TRANSACTION")

    const [rows] = await pool.execute("SELECT task_state, task_owner, task_app_acronym FROM task WHERE task_id = ?", [task_id])
    const currentState = rows[0]?.task_state
    const taskOwner = rows[0]?.task_owner
    const taskAppAcronym = rows[0]?.task_app_acronym

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
      const [appRow] = await pool.execute(
        `
        SELECT app_permit_done 
        FROM application 
        WHERE app_acronym = ?`,
        [taskAppAcronym]
      )

      const permittedGroup = appRow[0]?.app_permit_done

      // Fetch all pl email
      const [userRows] = await pool.execute(
        `
        SELECT u.email 
        FROM user u
        JOIN user_group ug ON u.user_name = ug.user_name
        JOIN group_list gl ON ug.group_id = gl.group_id
        WHERE gl.group_name = ?`,
        [permittedGroup]
      )

      // Extract all emails into a single array
      const emailList = userRows.map((user) => user.email)

      // Avoid sending emails if the list is empty
      if (emailList.length > 0) {
        const subject = `Task ${task_id} Promoted to Done`
        const message = `The task with ID ${task_id} has been promoted to Done by ${taskOwner}.`

        // Send one email to all recipients
        try {
          await sendEmail(emailList.join(","), subject, message)
        } catch (emailError) {
          console.error(`Error sending email to ${emailList.join(",")}:`, emailError)
        }
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
  let username = req.user.username
  const { task_id } = req.body

  try {
    // Call enforcePermissions to check if the user has permission
    let hasPermission = await enforcePermissions(task_id, username)

    if (!hasPermission) {
      return res.status(403).json({
        message: "Do not have permission to perform this action."
      })
    }
  } catch (permissionError) {
    console.error("Permission check error:", permissionError)
    return next(new ErrorHandler("Error checking task permissions", 500))
  }

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
