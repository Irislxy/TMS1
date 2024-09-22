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

    await pool.execute(query, [group_name])

    // Send success response
    return res.status(201).json({
      success: true,
      message: "Group created.",
      data: { group_name: group_name }
    })
  } catch (err) {
    // Handle duplicate entry error
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Group already exists"
      })
    }

    console.error("Error while creating group:", err)
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

  try {
    const query = "SELECT group_name FROM group_list"

    const [results] = await pool.query(query)

    // Return all groups
    return res.status(200).json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error("Error while getting group:", error)
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
    const [currentGroups] = await pool.query("SELECT group_id FROM user_group WHERE user_name = ?", [user_name])
    const currentGroupIds = new Set(currentGroups.map((group) => group.group_id)) //map each group_name to group_id in user_group

    const [allGroups] = await pool.query("SELECT group_id, group_name FROM group_list")
    const groupMap = new Map(allGroups.map((group) => [group.group_name, group.group_id])) //map each group_name to group_id in group_list

    const newGroupIds = new Set(group_name.map((name) => groupMap.get(name))) //convert group_name to group_id

    const groupsToDelete = [...currentGroupIds].filter((id) => !newGroupIds.has(id))
    const groupsToAdd = [...newGroupIds].filter((id) => !currentGroupIds.has(id))

    if (groupsToDelete.length > 0) {
      const idsToDelete = groupsToDelete.join(", ")
      await pool.execute(`DELETE FROM user_group WHERE user_name = ? AND group_id IN (${idsToDelete})`, [user_name])
    }

    if (groupsToAdd.length > 0) {
      const values = groupsToAdd.map((id) => `(${id}, '${user_name}')`).join(", ")
      await pool.execute(`INSERT INTO user_group (group_id, user_name) VALUES ${values}`)
    }

    res.status(201).json({ message: `User '${user_name}' has been assigned group(s) successfully.`, success: true })
  } catch (error) {
    return next(new ErrorHandler("Error while creating group", 500))
  }
}

const checkGroup = async (username, groupname) => {
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
