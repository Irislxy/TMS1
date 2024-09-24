const pool = require("../config/db_connection")
const ErrorHandler = require("../utils/errorHandler")

exports.getAllApp = async (req, res, next) => {
  try {
    const query = "SELECT * FROM application"

    const [results] = await pool.query(query)

    // Return all apps
    return res.status(200).json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error("Error while getting all app:", error)
    return next(new ErrorHandler("Error while getting all app", 500))
  }
}

exports.getAppDetails = async (req, res, next) => {
  // Extract app_acronym from the request body
  const { app_acronym } = req.body

  // Check if app_acronym is defined
  if (!app_acronym) {
    return next(new ErrorHandler("App acronym not defined", 400))
  }

  try {
    const query = "SELECT * FROM application WHERE app_acronym = ?"
    // where should the app_acronym come from?
    const [results] = await pool.query(query, [app_acronym])

    return res.status(200).json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error("Error while getting app details:", error)
    return next(new ErrorHandler("Error while getting app details", 500))
  }
}

// Only PL can create app (not tested)
exports.createApp = async (req, res, next) => {
  // let is_PL = await checkGroup(username, "PL")
  const { app_acronym, app_description, app_rnumber, app_startdate, app_enddate, app_permit_create, app_permit_open, app_permit_todolist, app_permit_doing, app_permit_done } = req.body

  // Checking if all required fields are provided
  if (!app_acronym || !app_rnumber || !app_startdate || !app_enddate) {
    return next(new ErrorHandler("app_acronym, app_rnumber, app_startdate, app_enddate are required", 500))
  }

  try {
    const query = "INSERT INTO application (app_acronym, app_description, app_rnumber, app_startdate, app_enddate, app_permit_create, app_permit_open, app_permit_todolist, app_permit_doing, app_permit_done) VALUES (?,?,?,?,?,?,?,?,?,?)"
    // where should the app_acronym come from? (frontend)
    await pool.execute(query, [app_acronym, app_description || null, app_rnumber, app_startdate, app_enddate, app_permit_create || null, app_permit_open || null, app_permit_todolist || null, app_permit_doing || null, app_permit_done || null])

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
        app_permit_todolist: app_permit_todolist,
        app_permit_doing: app_permit_doing,
        app_permit_done: app_permit_done
      }
    })
  } catch (error) {
    console.error("Error while creating the app:", error)
    return next(new ErrorHandler("Error while creating the app", 500))
  }
}

// Only PL can update app (not tested)
exports.updateApp = async (req, res, next) => {
  // let is_PL = await checkGroup(username, "PL")
  const { app_acronym, app_description, app_rnumber, app_startdate, app_enddate, app_permit_create, app_permit_open, app_permit_todolist, app_permit_doing, app_permit_done } = req.body

  // Checking if all required fields are provided
  if (!app_acronym || !app_rnumber || !app_startdate || !app_enddate) {
    return next(new ErrorHandler("All fields are required", 500))
  }

  try {
    const query = "UPDATE application SET app_description = ?, app_rnumber = ?, app_startdate = ?, app_enddate = ?, app_permit_create = ?, app_permit_open = ?, app_permit_todolist = ?, app_permit_doing = ?,app_permit_done = ? WHERE app_acronym = ?"
    // where should the app_acronym come from? (frontend)
    await pool.execute(query, [app_acronym, app_description || null, app_rnumber, app_startdate, app_enddate, app_permit_create || null, app_permit_open || null, app_permit_todolist || null, app_permit_doing || null, app_permit_done || null])

    return res.status(200).json({
      success: true,
      message: "App updated",
      data: {
        app_acronym: app_acronym,
        app_description: app_description,
        app_rnumber: app_rnumber,
        app_startdate: app_startdate,
        app_enddate: app_enddate,
        app_permit_create: app_permit_create,
        app_permit_open: app_permit_open,
        app_permit_todolist: app_permit_todolist,
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
