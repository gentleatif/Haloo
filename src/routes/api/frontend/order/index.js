const express = require("express");
const router = express.Router();

module.exports = function () {
  router.use("/", require("./order"));
  return router;
};
