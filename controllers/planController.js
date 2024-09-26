const pool = require("../config/db_connection")
const ErrorHandler = require("../utils/errorHandler")

exports.getAllPlan = async (req, res, next) => {
  //not tested
  try {
    const query = "SELECT * FROM plan"

    const [results] = await pool.query(query)

    // Return all plan
    return res.status(200).json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error("Error while getting all plan:", error)
    return next(new ErrorHandler("Error while getting all plan", 500))
  }
}

exports.getPlanDetails = async (req, res, next) => {
  //not tested
  const { plan_app_acronym } = req.body

  // Check if plan_app_acronym is defined
  if (!plan_app_acronym) {
    return next(new ErrorHandler("Plan App acronym not defined", 400))
  }

  try {
    const query = "SELECT * FROM plan WHERE plan_app_acronym = ?"

    const [results] = await pool.query(query, [plan_app_acronym])

    return res.status(200).json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error("Error while getting plan details:", error)
    return next(new ErrorHandler("Error while getting plan details", 500))
  }
}

//only PM can create plan
exports.createPlan = async (req, res, next) => {
  // let is_PM = await checkGroup(username, "PM")
  const { plan_mvp_name, plan_startdate, plan_enddate, plan_app_acronym, plan_colour } = req.body
  // plan_app_acronym is passed into this function
  // Check if all fields are provided
  if (!plan_mvp_name || !plan_startdate || !plan_enddate || !plan_colour) {
    return next(new ErrorHandler("All fields are required", 400))
  }

  try {
    const query = "INSERT INTO plan (plan_mvp_name, plan_startdate, plan_enddate, plan_app_acronym, plan_colour) VALUES (?,?,?,?,?)"

    await pool.execute(query, [plan_mvp_name, plan_startdate, plan_enddate, plan_app_acronym, plan_colour])

    // Send success response
    return res.status(201).json({
      success: true,
      message: "Plan created",
      data: {
        plan_mvp_name: plan_mvp_name,
        plan_startdate: plan_startdate,
        plan_enddate: plan_enddate,
        plan_app_acronym: plan_app_acronym,
        plan_colour: plan_colour
      }
    })
  } catch (err) {
    console.error("Error while creating plan:", err)
    return next(new ErrorHandler("Error while creating plan", 500))
  }
}

// PL and PM can update plan
exports.updatePlan = async (req, res, next) => {
  // let is_PL = await checkGroup(username, "PL")
  // let is_PM = await checkGroup(username, "PM")
  const { plan_mvp_name, plan_startdate, plan_enddate, plan_app_acronym, plan_colour } = req.body
  // plan_app_acronym is passed into this function
  // Check if all fields are provided
  if (!plan_mvp_name || !plan_startdate || !plan_enddate || !plan_colour) {
    return next(new ErrorHandler("All fields are required", 400))
  }

  try {
    const query = "UPDATE plan SET plan_mvp_name = ?, plan_startdate = ?, plan_enddate = ?, plan_colour = ? WHERE plan_app_acronym = ?"

    await pool.execute(query, [plan_mvp_name, plan_startdate, plan_enddate, plan_colour, plan_app_acronym])

    // Send success response
    return res.status(200).json({
      success: true,
      message: "Plan updated.",
      data: {
        plan_mvp_name: plan_mvp_name,
        plan_startdate: plan_startdate,
        plan_enddate: plan_enddate,
        plan_app_acronym: plan_app_acronym,
        plan_colour: plan_colour
      }
    })
  } catch (err) {
    console.error("Error while updating plan:", err)
    return next(new ErrorHandler("Error while updating plan", 500))
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
