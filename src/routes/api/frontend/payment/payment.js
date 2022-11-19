const express = require("express");
const router = express.Router();
const Order = require("../../../../models/order/order");
const Customer = require("../../../../models/user_management/customer");
const Razorpay = require("razorpay");
const mongoose = require("mongoose");
const SubCategory = require("../../../../models/service_info/sub_category");
const Offer = require("../../../../models/offer/offer");
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
  // note to come back here
  // save razorpay order id in jobid
  // rrazorPayOrderId
  let { subCategoryId, couponId } = req.body;
  let discountAmount;
  let finalAmount;

  if (!subCategoryId) {
    return res.status(400).json({
      message: "subCategoryId is required",
      field: "subCategoryId",
    });
  }

  // check if order_id is and valid id or not
  if (!mongoose.Types.ObjectId.isValid(subCategoryId)) {
    return res.status(400).json({
      message: "subCategoryId is not valid",
      field: "subCategoryId",
    });
  }
  let subCategory = await SubCategory.findOne({ _id: subCategoryId });
  if (!subCategory) {
    return res.status(400).json({
      message: "subCategory is not exist",
    });
  }

  if (!couponId) {
    finalAmount = subCategoryId.price;
  }

  if (couponId) {
    // verfiy discount available by this discount coupon
    let offer = await Offer.findOne({ code: couponId });
    if (!offer) {
      return res.status(400).send({ error: "Invalid coupon", field: "coupon" });
    }

    // check if coupon is used by this customer in any of his orders

    let totalAmount = subCategory.price;
    const discount = offer.discount;
    discountAmount = (totalAmount * discount) / 100;
    discountAmount = Math.round(discountAmount);
    finalAmount = totalAmount - discountAmount;
    finalAmount = Math.round(finalAmount);
  }
  // dynamically amount
  let amount = finalAmount;
  amount = amount * 100;
  const currency = "INR";
  razorpayInstance.orders.create({ amount, currency }, (err, order) => {
    if (!err) res.json(order);
    else res.send(err);
  });
});

router.post("/verifyOrder", async (req, res) => {
  // STEP 7: Receive Payment Data
  const { order_id, payment_id, jobId } = req.body;
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
  // check if jobId is provided or not
  if (!jobId) {
    return res.status(400).json({
      message: "jobId is required",
      field: "jobId",
    });
  }
  // check if jobId is and valid id or not
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({
      message: "jobId is not valid",
      field: "jobId",
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
    // req.customer.registrationToken.forEach((singleRegToken) => {
    //   sendNotification(singleRegToken, {
    //     notification: {
    //       title: "Payment Successful",
    //       body: "Your payment has been successful",
    //     },
    //   });
    // });
    // // save notification in database
    // const notification = new Notification({
    //   customerId: req.customer._id,
    //   notification: {
    //     title: "Payment Successful",
    //     message: "Your payment has been successful",
    //   },
    // });
    // notification.save();
    // send socket to vendor that payment is successful
    // 1. find job by order_id
    let job = await Order.findOne({ razorPayOrderId: order_id });
    if (!job) {
      return res.status(400).json({
        message: "job is not exist",
      });
    }
    // 2. find vendor by job.vendor
    let vendor = await Customer.findOne({ _id: job?.vendorId });
    if (!vendor) {
      return res.status(400).json({
        message: "vendor is not exist",
      });
    }
    let vendorSocketId = vendor?.socketId;
    if (!vendorSocketId) {
      return res.status(400).json({
        message: "vendorSocketId is not exist",
      });
    }

    // find socket of this customer
    // send socket request to this customer
    if (vendorSocketId) {
      var socket_data = {
        type: "PaymentSuccessful",
        data: {
          razorPayOrderId: order_id,
          _id: _id,
        },
      };
      console.log("socket_data", socket_data);
      io.to(vendorSocketId).emit("payment", socket_data);
    }

    Job.findOneAndUpdate({ jobId }, { $set: { status: "completed" } });
    res.json({ success: true, message: "Payment has been verified" });
  } else {
    res.json({ success: false, message: "Payment verification failed" });
  }
});

module.exports = router;
