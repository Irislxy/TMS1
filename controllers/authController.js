const pool = require("../config/db_connection")
const ErrorHandler = require("../utils/errorHandler")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

// Login user
// check if user 1.exist and 2.active
exports.loginUser = async (req, res, next) => {
  const { user_name, password } = req.body

  // Checks if user_name and password are entered by user
  if (!user_name || !password) {
    return next(new ErrorHandler("Please enter both user_name and password", 400))
  }

  try {
    const query = "SELECT * FROM user WHERE user_name = ?"

    const [results] = await pool.execute(query, [user_name])

    // Check if user exists
    if (results.length === 0) {
      return next(new ErrorHandler("Invalid user_name or password", 401))
    }

    const user = results[0] // Take the first result

    // Check if user is active
    if (user.active == 0) {
      return next(new ErrorHandler("Invalid user_name or password", 401))
    }

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

    // Set cookie and send response
    return res
      .status(200)
      .cookie("token", token, options)
      .json({
        success: true,
        message: "Login successful.",
        token: token, // Send the token to the client
        data: { username: user.user_name } // Return user info
      })
  } catch (err) {
    console.error("Database query error:", err)
    return next(new ErrorHandler("Database error", 500))
  }
}

exports.logout = async (req, res, next) => {
  res.clearCookie("token").status(200).send()
}
