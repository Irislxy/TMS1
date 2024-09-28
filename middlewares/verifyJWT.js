const jwt = require("jsonwebtoken")
const ErrorHandler = require("../utils/errorHandler")
const pool = require("../config/db_connection")

exports.isAuthenticated = async (req, res, next) => {
  const token = req.cookies.token
  // If token exists
  if (!token) {
    return next(new ErrorHandler("Unauthorized", 403))
  }

  // Verify the token
  try {
    var decoded = await jwt.verify(token, process.env.JWT_SECRET)
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
    const [results] = await pool.query(query, [username])

    // Check if the user exists and if the user is active
    if (results.length === 0 || !results[0].active) {
      return next(new ErrorHandler("User is not found or disabled", 401))
    }
  } catch (error) {
    console.error("Database query error:", err)
    return next(new ErrorHandler("Unable to retrieve user from database", 401))
  }

  req.user = decoded
  //console.log(req.user)
  //console.log(username)

  // Check if the user is an admin
  const isAdmin = await checkGroup(username, "admin")
  req.isAdmin = isAdmin

  const isPL = await checkGroup(username, "pl")
  req.isPL = isPL

  next()
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
