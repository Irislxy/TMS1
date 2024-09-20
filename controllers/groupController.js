const pool = require("../config/db_connection")
const ErrorHandler = require("../utils/errorHandler")

// Create new group => /api/v1/createGroup
exports.createGroup = async (req, res, next) => {
  let username = req.user.username
  let is_admin = await checkGroup(username, "admin")
  //console.log(is_admin)

  if (!is_admin) {
    return res.status(500).json({
      message: "Do not have permission to access this resource"
    })
  }
  const { group_name } = req.body

  // Check if group name is provided
  if (!group_name) {
    return next(new ErrorHandler("Please provide group name", 400))
  }

  try {
    const query = "INSERT INTO group_list (group_name) VALUES (?)"

    pool.execute(query, [group_name], (err, results) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          // Catch duplicate entry error
          return res.status(409).json({
            success: false,
            message: "Group already exists"
          })
        }
      }
      res.status(201).json({
        success: true,
        message: "Group Created.",
        data: { group_name: group_name }
      })
    })
  } catch (error) {
    return next(new ErrorHandler("Error while creating group", 500))
  }
}

// Get all group => /api/v1/getAllGroup
exports.getAllGroup = async (req, res, next) => {
  let username = req.user.username
  let is_admin = await checkGroup(username, "admin")

  if (!is_admin) {
    return res.status(500).json({
      message: "Do not have permission to access this resource"
    })
  }
  const query = "SELECT group_name FROM group_list"

  try {
    pool.query(query, (err, results) => {
      // Return all group
      res.status(200).json({
        success: true,
        data: results
      })
    })
  } catch (error) {
    return next(new ErrorHandler("Error while getting group", 500))
  }
}

// Update assigned group => /api/v1/updateGroup
exports.updateGroup = async (req, res, next) => {
  let username = req.user.username
  let is_admin = await checkGroup(username, "admin")

  if (!is_admin) {
    return res.status(500).json({
      message: "Do not have permission to access this resource"
    })
  }
  const { user_name, group_name } = req.body

  try {
    // Step 1: Find group_id from group_list based on group_name
    const getGroupIdQuery = "SELECT group_id FROM group_list WHERE group_name = ?"
    const [groupResults] = await pool.execute(getGroupIdQuery, [group_name])

    const group_id = groupResults[0].group_id

    // Step 2: Update user_group table with the new group_id for the user
    const updateGroupQuery = "UPDATE user_group SET group_id = ? WHERE user_name = ?"
    const [updateResults] = await pool.execute(updateGroupQuery, [group_id, user_name])

    if (updateResults.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    res.status(200).json({
      success: true,
      message: "Updated assigned group",
      data: { user_name: user_name, group_name: group_name, group_id: group_id }
    })
  } catch (error) {
    return next(new ErrorHandler("Error while creating group", 500))
  }
}

const checkGroup = async (username, groupname) => {
  try {
    const [result] = await pool.promise().query(
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
