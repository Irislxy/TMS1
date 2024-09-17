const pool = require("../config/db_connection")
const ErrorHandler = require("../utils/errorHandler")
const bcrypt = require("bcryptjs")

// Get all users => /api/v1/alluser
exports.getAllUser = async (req, res, next) => {
  try {
    const query = "SELECT * FROM user"
    pool.query(query, (err, results) => {
      // Return all users
      res.status(200).json({
        success: true,
        data: results
      })
    })
  } catch (error) {
    return next(new ErrorHandler("Error while getting all users", 500))
  }
}

exports.getAllUserWithGroup = async (req, res, next) => {
  try {
    const query = `SELECT u.user_name, u.email, u.active, g.group_name, ug.group_id
                    FROM user u
                    JOIN user_group ug ON u.user_name = ug.user_name
                    JOIN group_list g ON ug.group_id = g.group_id`
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

// Get user details => /api/v1/user
exports.getOneUser = async (req, res, next) => {
  const username = req.user.username // get username

  try {
    const query = "SELECT * FROM user WHERE user_name = ?"
    pool.execute(query, [username], (err, results) => {
      if (results.length === 0) {
        return next(new ErrorHandler("User not found", 404))
      } else {
        console.log(results)
        let user = {
          username: results[0].user_name,
          email: results[0].email
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

// Create new user => /api/v1/newuser
exports.newUser = async (req, res, next) => {
  const { user_name, password, email, group_id } = req.body // Extract user data from request body

  // Check if username and password are provided
  if (!user_name || !password) {
    return next(new ErrorHandler("Please provide username and password", 400))
  }

  // Check password: 8-10 characters, Comprise of alphabets , numbers, and special character
  const regex = new RegExp(/((?=.*\d)(?=.*[a-zA-Z])(?=.*[\W\_]).{8,10})/g)
  if (!regex.test(password)) {
    return next(new ErrorHandler("Password does not meet requirements", 400, ""))
  }

  // Define the query to insert a new user, with active defaulting to 1
  const userQuery = "INSERT INTO user (user_name, password, email) VALUES (?, ?, ?)"
  const userGroupQuery = "INSERT INTO user_group (user_name, group_id) VALUES (?, ?)"

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10) // 10 is the salt rounds

    // Insert into user table
    pool.execute(userQuery, [user_name, hashedPassword, email || null], (err, results) => {
      if (err) {
        return next(new ErrorHandler("Error while creating user", 500))
      }

      const newUserName = user_name // Get the newly created username

      // Insert into user_group table
      pool.execute(userGroupQuery, [newUserName, group_id], (err) => {
        if (err) {
          return next(new ErrorHandler("Error while assigning user to group", 500))
        }

        // Successfully created user and assigned to group
        return res.status(201).json({
          success: true,
          message: "User created successfully!"
        })
      })
    })
  } catch (error) {
    return next(new ErrorHandler("Error while hashing password", 500))
  }
}

// Update email => /api/v1/updateEmail
exports.updateEmail = async (req, res, next) => {
  const { user_name, email } = req.body // Extract data from the request body

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

  // Update email
  try {
    const query = "UPDATE user SET email = ? WHERE user_name = ?"
    pool.execute(query, [email || null, user_name], async (err, results) => {
      if (err) {
        return next(new ErrorHandler("Error while updating user", 500))
      }

      res.status(200).json({
        success: true,
        message: "User updated successfully"
      })
    })
  } catch (error) {
    return next(new ErrorHandler("Unable to update user", 500))
  }
}

// Update password => /api/v1/updatePassword
exports.updatePassword = async (req, res, next) => {
  const { user_name, password } = req.body

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
        return next(new ErrorHandler("Error while updating user", 500))
      }

      res.status(200).json({
        success: true,
        message: "User updated successfully"
      })
    })
  } catch (error) {
    return next(new ErrorHandler("Unable to update user", 500))
  }
}

// Update email => /api/v1/updateEmail
exports.disableUser = async (req, res, next) => {
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
