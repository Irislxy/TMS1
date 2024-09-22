const express = require("express")
const app = express()
const logger = require("morgan") //rmb to delete

const dotenv = require("dotenv")

const pool = require("./config/db_connection")
const errorMiddleware = require("./middlewares/errors")
const cors = require("cors")
const cookieParser = require("cookie-parser")

// Setting up config.env file variables
dotenv.config({ path: "./config/config.env" })

// Enable CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
)

app.use(cookieParser())
app.use(logger("dev")) //rmb to delete
// Middleware to parse JSON request body
app.use(express.json())
app.use(express.urlencoded({ extended: true })) // to parse form data

// Importing all routes
const appListRoutes = require("./routes/appList")
const loginRoutes = require("./routes/auth")
const userRoutes = require("./routes/user")
const groupRoutes = require("./routes/group")

app.use("/api/v1", appListRoutes)
app.use("/api/v1", loginRoutes)
app.use("/api/v1", userRoutes)
app.use("/api/v1", groupRoutes)

// Middleware to handle errors
app.use(errorMiddleware)

async function initializeApp() {
  try {
    // Get a connection from the pool
    const connection = await pool.getConnection()

    console.log("Successfully connected to the MySQL database")

    const PORT = process.env.PORT || 3000 // Fallback to port 3000 if undefined
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`)
    })

    // Release the connection back to the pool
    connection.release()
  } catch (err) {
    console.error("Failed to connect to the database:", err.message)
    process.exit(1) // Exit if DB connection fails
  }
}

initializeApp()

// Handling unhandled promise rejections
process.on("unhandledRejection", async (err) => {
  console.error(`Error: ${err.message}`)

  try {
    // Use await to ensure the pool closes before exiting the process
    if (pool) {
      await pool.end() // Close all connections in the pool
      console.log("Database connection pool closed.")
    }
  } catch (poolErr) {
    console.error("Error closing the database connection pool:", poolErr.message)
  } finally {
    process.exit(1) // Exit the process after handling the unhandled rejection
  }
})
