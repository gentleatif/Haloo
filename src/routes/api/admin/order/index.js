const express = require("express");
const router = express.Router();

// router.use('/order', require('./order'));

module.exports = function (razorpayInstance) {
  //   router.use("/order", require("./order")(razorpayInstance));
  return router;
};

// module.exports = router;
