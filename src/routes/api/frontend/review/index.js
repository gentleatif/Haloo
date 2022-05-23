const express = require("express");
const router = express.Router();

module.exports = function () {
  router.use("/", require("./review"));
  return router;
};
