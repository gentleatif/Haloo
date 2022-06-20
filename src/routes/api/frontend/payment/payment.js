const express = require("express");
const router = express.Router();
const Order = require("../../../../models/order/order");
const Razorpay = require("razorpay");

// This razorpayInstance will be used to
// access any resource from razorpay
const razorpayInstance = new Razorpay({
  // Replace with your key_id
  key_id: "rzp_test_oQ86zORxVDIFgZ",

  // Replace with your key_secret
  key_secret: "HAzY2bmHOjhAbVqtjgVTGoH3",
});
router.post("/createOrder", async (req, res) => {
  // STEP 1:
  let { order_id } = req.body;
  //   find order by order_id
  let order = await Order.findOne({ order_id });
  if (!order) {
    return res.status(400).send({ error: "Invalid order_id" });
  }

  // compare two new objects id

  if (order.user.toString() !== req.customer._id.toString()) {
    return res
      .status(400)
      .send({ error: "You are not authorize to make payment of this order" });
  }
  const amount = order.finalAmount;
  const currency = "INR";
  razorpayInstance.orders.create({ amount, currency }, (err, order) => {
    if (!err) res.json(order);
    else res.send(err);
  });
});

router.post("/verifyOrder", (req, res) => {
  // STEP 7: Receive Payment Data
  const { order_id, payment_id } = req.body;
  const razorpay_signature = req.headers["x-razorpay-signature"];

  // Pass yours key_secret here
  const key_secret = "rzp_test_oQ86zORxVDIFgZ";

  // STEP 8: Verification & Send Response to User

  // Creating hmac object
  let hmac = crypto.createHmac("sha256", key_secret);

  // Passing the data to be hashed
  hmac.update(order_id + "|" + payment_id);

  // Creating the hmac in the required format
  const generated_signature = hmac.digest("hex");

  if (razorpay_signature === generated_signature) {
    Order.findOneAndUpdate({ order_id }, { $set: { status: "completed" } });
    res.json({ success: true, message: "Payment has been verified" });
  } else {
    res.json({ success: false, message: "Payment verification failed" });
  }
});

module.exports = router;
