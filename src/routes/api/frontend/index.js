const express = require("express");
const router = express.Router();
const customer_auth = require("../../../middleware/customer_auth");

module.exports = function () {
  router.use("/auth", require("./auth")());
  router.use("/user", customer_auth, require("./user")());
  router.use("/serviceinfo", customer_auth, require("./service_info")());
  router.use("/offer", customer_auth, require("./offer")());
  router.use("/job", customer_auth, require("./job")());
  router.use("/support", customer_auth, require("./support")());
  router.use("/review", customer_auth, require("./review")());
  router.use("/order", customer_auth, require("./order")());
  router.use("/contactus", customer_auth, require("./contactus")());
  router.use("/payment", customer_auth, require("./payment")());
  router.use("/notification", customer_auth, require("./notification")());
  router.use("/staticfile", require("./staticfile")());

  return router;
};
