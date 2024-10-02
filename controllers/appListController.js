const pool = require("../config/db_connection")
const ErrorHandler = require("../utils/errorHandler")

exports.getAllApp = async (req, res, next) => {
  try {
    const query = "SELECT * FROM application"

    const [results] = await pool.query(query)

    return res.status(200).json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error("Error while getting all app:", error)
    return next(new ErrorHandler("Error while getting all app", 500))
  }
}

//get app details to edit (only pl)
exports.getAppDetails = async (req, res, next) => {
  let username = req.user.username
  let is_PL = await checkGroup(username, "pl")

  if (!is_PL) {
    return res.status(500).json({
      message: "Do not have permission to access this resource"
    })
  }

  const { app_acronym } = req.body

  // Check if app_acronym is defined
  if (!app_acronym) {
    return next(new ErrorHandler("App acronym not defined", 400))
  }

  try {
    const query = "SELECT * FROM application WHERE app_acronym = ?"

    const [results] = await pool.execute(query, [app_acronym])

    return res.status(200).json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error("Error while getting app details:", error)
    return next(new ErrorHandler("Error while getting app details", 500))
  }
}

// Only PL can create app
exports.createApp = async (req, res, next) => {
  let username = req.user.username
  let is_PL = await checkGroup(username, "pl")

  if (!is_PL) {
    return res.status(500).json({
      message: "Do not have permission to access this resource"
    })
  }

  const { app_acronym, app_description, app_rnumber, app_startdate, app_enddate, app_permit_create, app_permit_open, app_permit_todo, app_permit_doing, app_permit_done } = req.body

  // Checking if all required fields are provided
  if (!app_acronym || !app_rnumber || !app_startdate || !app_enddate) {
    return next(new ErrorHandler("app_acronym, app_rnumber, app_startdate, app_enddate are required", 500))
  }

  try {
    const query = "INSERT INTO application (app_acronym, app_description, app_rnumber, app_startdate, app_enddate, app_permit_create, app_permit_open, app_permit_todo, app_permit_doing, app_permit_done) VALUES (?,?,?,?,?,?,?,?,?,?)"

    await pool.execute(query, [app_acronym, app_description || null, app_rnumber, app_startdate, app_enddate, app_permit_create || null, app_permit_open || null, app_permit_todo || null, app_permit_doing || null, app_permit_done || null])

    return res.status(201).json({
      success: true,
      message: "App created",
      data: {
        app_acronym: app_acronym,
        app_description: app_description,
        app_rnumber: app_rnumber,
        app_startdate: app_startdate,
        app_enddate: app_enddate,
        app_permit_create: app_permit_create,
        app_permit_open: app_permit_open,
        app_permit_todo: app_permit_todo,
        app_permit_doing: app_permit_doing,
        app_permit_done: app_permit_done
      }
    })
  } catch (error) {
    // Handle duplicate entry error
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "App already exists"
      })
    }
    console.error("Error while creating the app:", error)
    return next(new ErrorHandler("Error while creating the app", 500))
  }
}

// Only PL can update app
exports.updateApp = async (req, res, next) => {
  let username = req.user.username
  let is_PL = await checkGroup(username, "pl")

  if (!is_PL) {
    return res.status(500).json({
      message: "Do not have permission to access this resource"
    })
  }

  const { app_description, app_permit_create, app_permit_open, app_permit_todo, app_permit_doing, app_permit_done, app_acronym } = req.body

  try {
    // Fetch the current app data
    const [rows] = await pool.execute("SELECT * FROM application WHERE app_acronym = ?", [app_acronym])
    const currentAppData = rows[0]

    if (!currentAppData) {
      return res.status(404).json({
        message: "App not found"
      })
    }

    // Compare each field with the current data to check if any changes were made
    let noChanges = (app_description === "" || currentAppData.app_description === app_description) && (app_permit_create === "" || currentAppData.app_permit_create === app_permit_create) && (app_permit_open === "" || currentAppData.app_permit_open === app_permit_open) && (app_permit_todo === "" || currentAppData.app_permit_todo === app_permit_todo) && (app_permit_doing === "" || currentAppData.app_permit_doing === app_permit_doing) && (app_permit_done === "" || currentAppData.app_permit_done === app_permit_done)

    if (noChanges) {
      return res.status(200).json({
        success: true,
        message: "No changes were made"
      })
    }

    const query = "UPDATE application SET app_description = ?, app_permit_create = ?, app_permit_open = ?, app_permit_todo = ?, app_permit_doing = ?,app_permit_done = ? WHERE app_acronym = ?"

    await pool.execute(query, [app_description || null, app_permit_create || null, app_permit_open || null, app_permit_todo || null, app_permit_doing || null, app_permit_done || null, app_acronym])

    return res.status(201).json({
      success: true,
      message: "App updated",
      data: {
        app_acronym: app_acronym,
        app_description: app_description,
        app_permit_create: app_permit_create,
        app_permit_open: app_permit_open,
        app_permit_todo: app_permit_todo,
        app_permit_doing: app_permit_doing,
        app_permit_done: app_permit_done
      }
    })
  } catch (error) {
    console.error("Error while updating the app:", error)
    return next(new ErrorHandler("Error while updating the app", 500))
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
