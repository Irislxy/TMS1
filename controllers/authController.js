const pool = require("../config/db_connection")
const ErrorHandler = require("../utils/errorHandler")
const catchAsyncErrors = require("../middlewares/catchAsyncErrors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

// Login user => /api/v1/login
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { user_name, password } = req.body // Extract user_name and password from request body

  // Checks if user_name and password are entered by user
  if (!user_name || !password) {
    return next(new ErrorHandler("Please enter both user_name and password", 400))
  }

  // Finding user in the database
  const query = "SELECT * FROM user WHERE user_name = ?"
  pool.execute(query, [user_name], async (err, results) => {
    if (err) {
      return next(new ErrorHandler("Invalid user_name or password", 401))
    }

    // Check if user exists
    if (results.length === 0) {
      return next(new ErrorHandler("Invalid user_name or password", 401)) // User not found
    }

    const user = results[0] // Assuming user_name is unique, take the first result

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password) // Compare hashed password with user input
    if (!isMatch) {
      return next(new ErrorHandler("Invalid user_name or password", 401)) // Password doesn't match
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        username: user.user_name,
        browser: req.headers["user-agent"],
        ipaddress: req.ip
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_TIME // Token expires in 7 days
      }
    )

    // Set cookie options
    const options = {
      expires: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
      httpOnly: true // browser will not be able to access the cookie
    }

    // Check if the user is an admin
    const isAdmin = await checkGroup(user.user_name, "admin")

    // Set cookie and send response
    res
      .status(200)
      .cookie("token", token, options)
      .json({
        success: true,
        message: "Login successful.",
        token: token, // Send the token to the client
        data: { username: user.user_name, isAdmin: isAdmin } // Return user info
      })
  })
})

async function checkGroup(username, group_name) {
  const query = `
  SELECT 1
  FROM user u
  JOIN user_group ug ON u.user_name = ug.user_name
  JOIN group_list g ON ug.group_id = g.group_id
  WHERE u.user_name = ? AND g.group_name = ?`

  return new Promise((resolve, reject) => {
    pool.query(query, [username, group_name], (err, results) => {
      if (err) {
        console.error("Database query error:", err) // Log the error for debugging
        return reject(new ErrorHandler("Database error", 500)) // Handle database error
      }
      resolve(results.length > 0) // Return true if the user belongs to the group
    })
  })
}

exports.logout = async (req, res, next) => {
  res.clearCookie("token").status(200).send()
}
