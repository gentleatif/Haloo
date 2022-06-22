const express = require("express");
const router = express.Router();
const Order = require("../../../../models/order/order");
const Razorpay = require("razorpay");
const mongoose = require("mongoose");
const crypto = require("crypto");
// require sendNotification function from fcm.js
const sendNotification = require("../../../../routes/api/frontend/fcm/fcm");
const Notification = require("../../../../models/notification/notification");

// This razorpayInstance will be used to
// access any resource from razorpay
const razorpayInstance = new Razorpay({
  // Replace with your key_id
  key_id: "rzp_test_rsZhchl2dCY4yw",

  // Replace with your key_secret
  key_secret: "tZZZb25tLMos5DoWnXaIQEUI",
});
router.post("/createOrder", async (req, res) => {
  // STEP 1:
  let { order_id } = req.body;
  console.log("order_id ====>", order_id);
  // check if order_id is is provided or not
  if (!order_id) {
    return res.status(400).json({
      message: "order_id is required",
      field: "order_id",
    });
  }
  // check if order_id is and valid id or not
  if (!mongoose.Types.ObjectId.isValid(order_id)) {
    return res.status(400).json({
      message: "order_id is not valid",
      field: "order_id",
    });
  }
  //   find order by order_id
  let order = await Order.findOne({ _id: order_id });
  if (!order) {
    return res.status(400).send({ error: "Invalid order_id" });
  }
  if (order.user.toString() !== req.customer._id.toString()) {
    return res
      .status(400)
      .send({ error: "You are not authorize to make payment of this order" });
  }
  // dynamically amount
  let amount = order.finalAmount;
  amount = amount * 100;
  const currency = "INR";
  razorpayInstance.orders.create({ amount, currency }, (err, order) => {
    if (!err) res.json(order);
    else res.send(err);
  });
});

router.post("/verifyOrder", (req, res) => {
  // STEP 7: Receive Payment Data
  const { order_id, payment_id } = req.body;
  console.log("order_id ====>", order_id);
  console.log("payment_id ====>", payment_id);
  // check if order_id is is provided or not
  if (!order_id) {
    return res.status(400).json({
      message: "order_id is required",
      field: "order_id",
    });
  }
  // check if payment_id is provided or not
  if (!payment_id) {
    return res.status(400).json({
      message: "payment_id is required",
      field: "payment_id",
    });
  }

  const razorpay_signature = req.headers["x-razorpay-signature"];
  // check if razorpay_signature is provided or not
  if (!razorpay_signature) {
    return res.status(400).json({
      message: "razorpay_signature is required",
      field: "razorpay_signature",
    });
  }
  // Pass yours key_secret here
  const key_secret = "tZZZb25tLMos5DoWnXaIQEUI";

  // STEP 8: Verification & Send Response to User

  // Creating hmac object
  let hmac = crypto.createHmac("sha256", key_secret);

  // Passing the data to be hashed
  hmac.update(order_id + "|" + payment_id);

  // Creating the hmac in the required format
  const generated_signature = hmac.digest("hex");
  console.log("generated_signature ====>", generated_signature);
  console.log("razorpay_signature ====>", razorpay_signature);
  if (razorpay_signature === generated_signature) {
    // loop through all registraionTokens
    customer.registrationToken.forEach((singleRegToken) => {
      sendNotification(singleRegToken, {
        notification: {
          title: "Payment Successful",
          body: "Your payment has been successful",
        },
      });
    });
    // save notification in database
    const notification = new Notification({
      customerId: req.customer._id,
      notification: {
        title: "Payment Successful",
        message: "Your payment has been successful",
      },
    });
    notification.save();
    Order.findOneAndUpdate({ order_id }, { $set: { status: "completed" } });
    res.json({ success: true, message: "Payment has been verified" });
  } else {
    res.json({ success: false, message: "Payment verification failed" });
  }
});

module.exports = router;
