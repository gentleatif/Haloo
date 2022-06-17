const express = require("express");
const router = express.Router();
const Order = require("../../../../models/order/order");
const Job = require("../../../../models/job");
const Customer = require("../../../../models/user_management/customer");
const Offer = require("../../../../models/offer/offer");
const { off } = require("../../../../models/order/order");
// sorting by date and filter by live ,completed, cancelled, date

router.post("/", async function (req, res) {
  let { subCategoryId, coupon, user } = req.body;
  let finalAmount;
  let discountAmount;
  let job = await Job.findOne({ subCategoryId });
  console.log(job);
  if (!subCategoryId) {
    return res
      .status(400)
      .send({ error: "Please provide an id", field: "subCategoryId" });
  }
  if (coupon) {
    // verfiy discount available by this discount coupon
    let offer = await Offer.findOne({ code: coupon });
    if (!offer) {
      return res.status(400).send({ error: "Invalid coupon", field: "coupon" });
    }
    // check if coupon is expired
    if (new Date() > offer.endDate || new Date() < offer.startDate) {
      return res.status(400).send({ error: "Coupon expired", field: "coupon" });
    }
    // find Job by subCategroyId and check their coupon value is used or not
    if (job.coupon === "used") {
      return res
        .status(400)
        .send({ error: "Coupon already used", field: "coupon" });
    }
    //  calculate percentage of discount
    let totalAmount = job.totalAmount;
    const discount = offer.discount;
    discountAmount = (totalAmount * discount) / 100;
    finalAmount = job.totalAmount - discountAmount;
  } else {
    finalAmount = job.totalAmount;
  }
  console.log("finalAmount=======>", finalAmount);
  try {
    let order = new Order({
      total: job.totalAmount,
      discount: discountAmount,
      finalAmount,
      user: req.customer._id,
    });
    await order.save();
    // update job coupon to used
    await Job.findByIdAndUpdate(job._id, { coupon: "used" });
    return res.send({ order });
    // console.log("finalAmount", finalAmount);
  } catch (error) {
    console.log(error);
    return res.status(400).send({ error: error });
  }
});
router.get("/", async function (req, res) {
  let orders = await Order.find({ user: req.customer_id });
  console.log("orders====>", orders);
  console.log(req.customer_id);

  res.send({ orders });
});

// router.put("/", async function (req, res) {
//   let { id } = req.query;
//   if (!id) {
//     return res.status(400).send({ error: "Please provide an id" });
//   }
//   if (id != req.customer_id) {
//     return res
//       .status(400)
//       .send({ error: "You are not authorized to update this order" });
//   }
//   if (!order) {
//     return res.status(400).send({ error: "Order not found" });
//   }
//   let order = await Order.findByIdAndUpdate(id, req.body);
// });

router.delete("/", async function (req, res) {
  let { id } = req.query;

  if (!id) {
    return res.status(400).send({ error: "Please provide an id" });
  }
  if (req.customer_id != id) {
    return res
      .status(400)
      .send({ error: "You are not authorized to delete this order" });
  }
  try {
    let order = await Order.findByIdAndDelete(id);
    return res.send({ order });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ error: error });
  }
});

module.exports = router;
