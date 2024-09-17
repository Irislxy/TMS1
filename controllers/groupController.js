const pool = require("../config/db_connection")
const ErrorHandler = require("../utils/errorHandler")

// Create new group => /api/v1/creategroup
exports.createGroup = async (req, res, next) => {
  const { group_name } = req.body

  // Check if group name is provided
  if (!group_name) {
    return next(new ErrorHandler("Please provide group name", 400))
  }

  try {
    const query = "INSERT INTO group_list (group_name) VALUES (?)"

    pool.execute(query, [group_name], (err, results) => {
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

// Get all group => /api/v1/allgroup
exports.getAllGroup = async (req, res, next) => {
  const query = "SELECT * FROM group_list"

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

// // Insert group into user_group => /api/v1/insertgroup
// exports.assignGroup = async (req, res, next) => {
//   const { group_name } = req.body

//   // Check if group name is provided
//   if (!group_name) {
//     return next(new ErrorHandler("Group not found", 400))
//   }

//   try {
//     const query = "INSERT INTO user_group (user_name, group_id) VALUES (?, ?)"

//     pool.execute(query, [user_name, group_id], (err, results) => {
//       if (err) {
//         return next(new ErrorHandler("Error while assigning group", 500))
//       }

//       res.status(201).json({
//         success: true,
//         message: "Group Assigned.",
//         data: { user_name: user_name, group_id: group_id }
//       })
//     })
//   } catch (error) {
//     return next(new ErrorHandler("Error while creating group", 500))
//   }
// }

// Update assigned group => /api/v1/group
exports.updateGroup = async (req, res, next) => {
  const { group_id, user_name } = req.body

  try {
    const query = "UPDATE user_group SET group_id = ? WHERE user_name = ?"

    pool.execute(query, [group_id, user_name], (err, results) => {
      if (err) {
        return next(new ErrorHandler("Error while assigning group", 500))
      }

      res.status(200).json({
        success: true,
        message: "Updated assigned group",
        data: { user_name: user_name, group_id: group_id }
      })
    })
  } catch (error) {
    return next(new ErrorHandler("Error while creating group", 500))
  }
}
