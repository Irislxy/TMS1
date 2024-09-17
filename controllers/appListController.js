// Get appList => /api/v1/appList
exports.getAppList = (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "This route will display all app"
  })
}
