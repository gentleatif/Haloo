var mongoose = require("mongoose");
// user,total, Discount(discountAmount), finalAmount

const orderSchema = new mongoose.Schema(
  {
    total: {
      type: Number,
    },
    discount: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    couponId: {
      type: String,
      default: null,
    },
    jobId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("order", orderSchema);
module.exports = Order;
