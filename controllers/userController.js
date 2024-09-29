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

    const [results] = await pool.execute(query, [username])

    // Check if user exists
    if (results.length === 0) {
      return next(new ErrorHandler("User not found", 404))
    }

    // Construct user object
    let user = {
      username: results[0].user_name,
      email: results[0].email,
      active: results[0].active,
      isAdmin: req.isAdmin,
      isPL: req.isPL,
      isPM: req.isPM
    }

    // Send response
    return res.status(200).json({
      user: user
    })
  } catch (error) {
    return next(new ErrorHandler("Error while getting user", 500))
  }
}

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

    const [results] = await pool.query(query)

    // Send response with results
    return res.status(200).json({
      success: true,
      data: results
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

    // Insert into the user table
    await pool.execute(userQuery, [user_name, hashedPassword, email || null])

    const groupNames = group_name

    // Iterate through each group name to assign the user to the respective groups
    for (const group of groupNames) {
      // Fetch group_id for the current group_name
      const [groupResults] = await pool.execute(groupIdQuery, [group])

      if (groupResults.length === 0) {
        return next(new ErrorHandler(`Group '${group}' not found`, 404))
      }

      const groupId = groupResults[0].group_id // Get the group_id from the result

      // Insert into user_group table with the fetched group_id
      await pool.execute(userGroupQuery, [user_name, groupId])
    }

    // Successfully created user and assigned to groups
    return res.status(201).json({
      success: true,
      message: "User created successfully and assigned to groups!"
    })
  } catch (error) {
    console.error("Error while creating user or assigning to groups:", error)
    return next(new ErrorHandler("Error while creating user or assigning to groups", 500))
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
    const querySelect = "SELECT * FROM user WHERE user_name = ?"
    const [results] = await pool.execute(querySelect, [user_name])

    // User does not exist
    if (results.length === 0) {
      return next(new ErrorHandler("User not found", 404))
    }

    // Disable user
    const queryUpdate = "UPDATE user SET active = ? WHERE user_name = ?"
    await pool.execute(queryUpdate, [active, user_name])

    // Send success response
    return res.status(200).json({
      success: true,
      message: "User disabled"
    })
  } catch (error) {
    console.error("Error:", error)
    return next(new ErrorHandler("Database operation failed", 500))
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

    await pool.execute(query, [email || null, user_name])

    // Send success response
    return res.status(200).json({
      success: true,
      message: "Email updated successfully"
    })
  } catch (error) {
    console.error("Error while updating email:", error)
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

    // Update the user's password in the database
    const query = "UPDATE user SET password = ? WHERE user_name = ?"
    await pool.execute(query, [hashedPassword, user_name])

    // Send success response
    return res.status(200).json({
      success: true,
      message: "Password updated successfully"
    })
  } catch (error) {
    console.error("Error while updating password:", error)
    return next(new ErrorHandler("Unable to update user", 500))
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
