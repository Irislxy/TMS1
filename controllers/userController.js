const pool = require("../config/db_connection")
const ErrorHandler = require("../utils/errorHandler")
const bcrypt = require("bcryptjs")

// Fetch current user details
// return if isAdmin to show/hide user management
exports.getUserDetails = async (req, res, next) => {
  const username = req.user.username // get username

  if (!username) {
    res.status(401).json({ message: "Username is required." })
  }

  try {
    const query = "SELECT * FROM user WHERE user_name = ?"
    pool.execute(query, [username], (err, results) => {
      if (results.length === 0) {
        return next(new ErrorHandler("User not found", 404))
      } else {
        let user = {
          username: results[0].user_name,
          email: results[0].email,
          active: results[0].active,
          isAdmin: req.isAdmin
        }
        res.status(200).json({
          user: user
        })
      }
    })
  } catch (error) {
    return next(new ErrorHandler("Error while getting user", 500))
  }
}

// // Get all users => /api/v1/getAllUser
// exports.getAllUser = async (req, res, next) => {
//   try {
//     const query = "SELECT * FROM user"
//     pool.query(query, (err, results) => {
//       // Return all users
//       res.status(200).json({
//         success: true,
//         data: results
//       })
//     })
//   } catch (error) {
//     return next(new ErrorHandler("Error while getting all users", 500))
//   }
// }

exports.getAllUserWithGroup = async (req, res, next) => {
  let username = req.user.username
  let is_admin = await checkGroup(username, "admin")
  //console.log(is_admin)

  if (!is_admin) {
    return res.status(500).json({
      message: "Do not have permission to access this resource"
    })
  }

  try {
    const query = `SELECT u.user_name, u.email, u.active, GROUP_CONCAT(g.group_name ORDER BY g.group_name  SEPARATOR ', ') AS 'groups' FROM user u LEFT JOIN user_group ug ON u.user_name = ug.user_name LEFT JOIN group_list g ON ug.group_id = g.group_id GROUP BY u.user_name`
    pool.query(query, (err, results) => {
      res.status(200).json({
        success: true,
        data: results
      })
    })
  } catch (error) {
    return next(new ErrorHandler("Error while getting all users", 500))
  }
}

// Create new user => /api/v1/newUser
exports.newUser = async (req, res, next) => {
  let username = req.user.username
  let is_admin = await checkGroup(username, "admin")

  if (!is_admin) {
    return res.status(500).json({
      message: "Do not have permission to access this resource"
    })
  }
  const { user_name, password, email, group_name } = req.body // Extract user data from request body

  // Check if username and password are provided
  if (!user_name || !password) {
    return next(new ErrorHandler("Please provide username and password", 400))
  }

  // Check password: 8-10 characters, Comprise of alphabets , numbers, and special character
  const regex = new RegExp(/((?=.*\d)(?=.*[a-zA-Z])(?=.*[\W\_]).{8,10})/g)
  if (!regex.test(password)) {
    return next(new ErrorHandler("Password does not meet requirements", 400))
  }

  // Define the query to insert a new user, with active defaulting to 1
  const userQuery = "INSERT INTO user (user_name, password, email) VALUES (?, ?, ?)"
  const userGroupQuery = "INSERT INTO user_group (user_name, group_id) VALUES (?, ?)"
  const groupIdQuery = "SELECT group_id FROM group_list WHERE group_name = ?"

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10) // 10 is the salt rounds

    // Insert into user table
    pool.execute(userQuery, [user_name, hashedPassword, email || null], (err, results) => {
      if (err) {
        return next(new ErrorHandler("Error while creating user", 500))
      }

      const newUserName = user_name // Get the newly created username
      const groupNames = group_name

      groupNames.forEach((group) => {
        // Fetch group_id for the current group_name
        pool.execute(groupIdQuery, [group], (err, groupResults) => {
          if (err || groupResults.length === 0) {
            return next(new ErrorHandler(`Group '${group}' not found`, 404))
          }

          const groupId = groupResults[0].group_id // Get the group_id from the result

          // Insert into user_group table with the fetched group_id
          pool.execute(userGroupQuery, [user_name, groupId], (err) => {
            if (err) {
              return next(new ErrorHandler("Error while assigning user to group", 500))
            }
          })
        })
      })

      // Successfully created user and assigned to groups
      return res.status(201).json({
        success: true,
        message: "User created successfully and assigned to groups!"
      })
    })
  } catch (error) {
    console.log(error)
  }
}

// Disable user
exports.disableUser = async (req, res, next) => {
  let username = req.user.username
  let is_admin = await checkGroup(username, "admin")

  if (!is_admin) {
    return res.status(500).json({
      message: "Do not have permission to access this resource"
    })
  }
  const { user_name, active } = req.body // Extract data from the request body

  try {
    // Check if the user exists
    const query = "SELECT * FROM user WHERE user_name = ?"
    pool.execute(query, [user_name], async (err, results) => {
      if (err) {
        return next(new ErrorHandler("Error while retrieving user", 500))
      }

      // User does not exist
      if (results.length === 0) {
        return next(new ErrorHandler("User not found", 404))
      }
    })
  } catch (error) {
    return next(new ErrorHandler("Unable to retrive user from database", 500))
  }

  // Disable user
  try {
    const query = "UPDATE user SET active = ? WHERE user_name = ?"
    pool.execute(query, [active, user_name], async (err, results) => {
      if (err) {
        return next(new ErrorHandler("Error while disabling user", 500))
      }

      res.status(200).json({
        success: true,
        message: "User disabled"
      })
    })
  } catch (error) {
    return next(new ErrorHandler("Unable to change user status in database", 500))
  }
}

// Update email => /api/v1/updateEmail
exports.updateEmail = async (req, res, next) => {
  const { user_name, email } = req.body // Extract data from the request body

  // check email regex
  const emailRegex = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$")
  if (!emailRegex.test(email)) {
    return next(new ErrorHandler("Email does not meet requirements", 400))
  }

  // Update email
  try {
    const query = "UPDATE user SET email = ? WHERE user_name = ?"
    pool.execute(query, [email || null, user_name], async (err, results) => {
      if (err) {
        return next(new ErrorHandler("Error while updating email", 500))
      }

      res.status(200).json({
        success: true,
        message: "Email updated successfully"
      })
    })
  } catch (error) {
    return next(new ErrorHandler("Unable to update user", 500))
  }
}

// Update password => /api/v1/updatePassword
exports.updatePassword = async (req, res, next) => {
  const { user_name, password } = req.body

  // Check if the new password meets the requirements
  const regex = new RegExp(/((?=.*\d)(?=.*[a-zA-Z])(?=.*[\W\_]).{8,10})/g)
  if (!regex.test(password)) {
    return next(new ErrorHandler("Password does not meet requirements", 400))
  }

  // Update password
  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const query = "UPDATE user SET password = ? where user_name = ?"
    pool.execute(query, [hashedPassword, user_name], async (err, results) => {
      if (err) {
        return next(new ErrorHandler("Error while updating password", 500))
      }

      res.status(200).json({
        success: true,
        message: "Password updated successfully"
      })
    })
  } catch (error) {
    return next(new ErrorHandler("Unable to update user", 500))
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
