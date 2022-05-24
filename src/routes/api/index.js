const express = require("express");
const router = express.Router();

module.exports = function () {
  // app.use('/api', require('./api/index.js')(io));
  router.use("/frontend", require("./frontend")());
  router.use("/", require("./admin")());
  return router;
};
