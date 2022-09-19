const express = require("express");
const crypto = require("crypto");
const router = express.Router();

module.exports = function (razorpayInstance) {
  console.log("razorpayInstance", razorpayInstance);
  router.post("/create", (req, res) => {
    console.log("req.body", req.body);
    const { amount, currency, notes } = req.body;

    // amount to int
    const amountInt = parseInt(amount);
    var options = {
      amount: amount, // amount in the smallest currency unit
      currency: "INR",
      receipt: "order_rcptid_11",
    };

    // STEP 2:
    razorpayInstance().orders.create(options, (err, order) => {
      //STEP 3 & 4:
      if (!err) res.json(order);
      else res.send({ error: err });
    });
  });

  //Inside app.js
  app.post("/verifyOrder", (req, res) => {
    // STEP 7: Receive Payment Data
    const { order_id, payment_id } = req.body;
    const razorpay_signature = req.headers["x-razorpay-signature"];

    // Pass yours key_secret here
    const key_secret = nGZPLrkvqYnNvAairjBwYaR3;

    // STEP 8: Verification & Send Response to User

    // Creating hmac object
    let hmac = crypto.createHmac("sha256", key_secret);

    // Passing the data to be hashed
    hmac.update(order_id + "|" + payment_id);

    // Creating the hmac in the required format
    const generated_signature = hmac.digest("hex");

    if (razorpay_signature === generated_signature) {
      res.json({ success: true, message: "Payment has been verified" });
    } else res.json({ success: false, message: "Payment verification failed" });
  });

  return router;
};

// module.exports = router;
