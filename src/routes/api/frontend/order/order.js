const express = require("express");
const router = express.Router();
const Order = require("../../../../models/order/order");
const Job = require("../../../../models/job");
const Customer = require("../../../../models/user_management/customer");
const Offer = require("../../../../models/offer/offer");
const { off } = require("../../../../models/order/order");
const mongoose = require("mongoose");
// sorting by date and filter by live ,completed, cancelled, date

router.post("/", async function (req, res) {
  // if customer used this coupon in any of his orders then he can't use it again
  let { jobId, couponId } = req.body;
  let discountAmount;
  // check if jobId is is provided or not
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

  let job = await Job.findOne({ _id: jobId });

  // check job is exist or not

  if (!job) {
    return res.status(400).json({
      message: "Job is not exist",
    });
  }

  if (job.status === "cancelled") {
    return res.status(400).json({
      message: "Job is cancelled",
    });
  }
  // check job is completed or not
  if (job.status === "completed") {
    return res.status(400).json({
      message: "Job is completed",
    });
  }
  // check if order is already exist for this jobId
  let orderExist = await Order.findOne({ jobId: jobId });
  if (orderExist) {
    return res.status(400).json({
      message: "order already exist",
    });
  }
  let finalAmount = Math.round(job.totalAmount);

  if (couponId) {
    // verfiy discount available by this discount coupon
    let offer = await Offer.findOne({ code: couponId });
    if (!offer) {
      return res.status(400).send({ error: "Invalid coupon", field: "coupon" });
    }
    // check if coupon is expired
    // if (new Date() > offer.endDate || new Date() < offer.startDate) {
    //   return res.status(400).send({ error: "Coupon expired", field: "coupon" });
    // }
    // check if coupon is used by this customer in any of his orders
    let order = await Order.findOne({
      user: req.customer._id,
      couponId: couponId,
    });
    if (order) {
      return res
        .status(400)
        .send({ error: "You can't use this coupon again", field: "coupon" });
    }
    //  calculate percentage of discount
    let totalAmount = job.totalAmount;
    const discount = offer.discount;
    discountAmount = (totalAmount * discount) / 100;
    // round off discount amount
    finalAmount = job.totalAmount - discountAmount;
    // round off finalAmount
    discountAmount = Math.round(discountAmount);
    finalAmount = Math.round(finalAmount);
  }
  try {
    let order = new Order({
      total: job.totalAmount,
      discount: discountAmount,
      finalAmount,
      user: req.customer._id,
      couponId,
      jobId,
    });
    await order.save();
    return res.send({ order });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ error: error });
  }
});
router.get("/", async function (req, res) {
  const { orderId } = req.body;
  if (!orderId) {
    return res.status(400).json({
      message: "orderId is required",
      field: "orderId",
    });
  }
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({
      message: "orderId is not valid",
      field: "orderId",
    });
  }
  let order = await Order.findOne({ _id: orderId });
  if (!order) {
    return res.status(400).json({
      message: "order is not exist",
    });
  }
  if (order.user.toString() !== req.customer._id.toString()) {
    return res.status(400).json({
      message: "you don't have this order",
    });
  }
  return res.send({ order });
});

router.put("/", async function (req, res) {
  let { orderId, couponId, jobId } = req.body;
  let finalAmount;
  let discountAmount;
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

  let job = await Job.findOne({ _id: jobId });

  // check job is exist or not

  if (!job) {
    return res.status(400).json({
      message: "Job is not exist",
      field: "jobId",
    });
  }

  if (job.status === "cancelled") {
    return res.status(400).json({
      message: "Job is cancelled",
      field: "jobId",
    });
  }
  // check job is completed or not
  if (job.status === "completed") {
    return res.status(400).json({
      message: "Job is completed",
      field: "jobId",
    });
  }

  let order = await Order.findOne({ _id: orderId });
  if (!order) {
    return res.status(400).send({ error: "Order not found" });
  }
  // check if order is completed or not
  if (order.status === "completed") {
    return res.status(400).send({ error: "Order is already completed" });
  }
  // check if order is cancelled or not
  if (order.status === "cancelled") {
    return res.status(400).send({ error: "Order is already cancelled" });
  }
  // check if order is pending or not
  if (order.status === "pending" || order.status === "live") {
    if (couponId) {
      // verfiy discount available by this discount coupon
      let offer = await Offer.findOne({ code: couponId });
      if (!offer) {
        return res
          .status(400)
          .send({ error: "Invalid coupon", field: "coupon" });
      }
      let order = await Order.findOne({
        user: req.customer._id,
        couponId: couponId,
      });
      if (order) {
        return res
          .status(400)
          .send({ error: "You can't use this coupon again", field: "coupon" });
      }

      //  calculate percentage of discount
      let totalAmount = job.totalAmount;
      const discount = offer.discount;
      discountAmount = (totalAmount * discount) / 100;

      finalAmount = job.totalAmount - discountAmount;
      // round off discount amount
      discountAmount = Math.round(discountAmount);
      finalAmount = Math.round(finalAmount);
    } else {
      // round off the final amount
      finalAmount = Math.round(job.totalAmount);
    }
    //  update order
    try {
      await Order.updateOne(
        { _id: orderId },
        {
          total: job.totalAmount,
          discount: discountAmount,
          finalAmount,
          couponId,
        }
      );
      return res.send({ order });
    } catch (error) {
      console.log(error);
      return res.status(400).send({ error: error });
    }
  }
});

router.delete("/", async function (req, res) {
  let { id } = req.query;

  if (!id) {
    return res.status(400).send({ error: "Please provide an id" });
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({ error: "Invalid id" });
  }
  let order = await Order.findOne({ _id: id });
  if (!order) {
    return res.status(400).send({ error: "Order not found" });
  }
  if (order.user.toString() !== req.customer._id.toString()) {
    return res.status(400).send({ error: "You don't have this order" });
  }
  if (order.status === "completed") {
    return res.status(400).send({ error: "Order is already completed" });
  }
  if (order.status === "cancelled") {
    return res.status(400).send({ error: "Order is already cancelled" });
  }
  if (order.status === "pending" || order.status === "live") {
    try {
      let order = await Order.findByIdAndDelete(id);
      return res.send({ order });
    } catch (error) {
      console.log(error);
      return res.status(400).send({ error: error });
    }
  }
});

module.exports = router;
