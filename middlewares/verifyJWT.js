const jwt = require("jsonwebtoken")
const ErrorHandler = require("../utils/errorHandler")
const pool = require("../config/db_connection")

exports.isAuthenticated = async (req, res, next) => {
  // let token
  // If token exists
  if (req.cookies.token) {
    token = req.cookies.token // Extract token from the cookies
  } else {
    // token not found
    return next(new ErrorHandler("Unauthorized", 403))
  }

  // Verify the token
  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (
      !decoded || // empty token (wrong secret)
      decoded.browser != req.headers["user-agent"] || // user-agent or ip no match
      decoded.ipaddress != req.ip
    ) {
      return next(new ErrorHandler("No token provided, please login again", 401))
    }
  } catch (error) {
    // Catch if token expired
    return next(new ErrorHandler("Token expired, please login again", 401))
  }

  let username = decoded.username // Extract the username from the decoded token

  try {
    const query = "SELECT user_name, active FROM user WHERE user_name = ?"
    pool.query(query, [username], (err, results) => {
      if (err) {
        console.error("Database query error:", err)
        return next(new ErrorHandler("Database error", 500)) // Handle database error
      }
      // User not found or disabled
      if (results.length == 0 || !results[0].active) {
        return next(new ErrorHandler("User not found", 404))
      }
    })
  } catch (error) {
    return next(new ErrorHandler("Invalid Credentials", 401))
  }

  req.user = decoded
  console.log(req.user)

  next()
}
