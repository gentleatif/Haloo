const express = require("express");
const router = express.Router();

module.exports = function () {
  // router.use("/", require("./notification"));
  router.use("/", require("./notification"));

  return router;
};
