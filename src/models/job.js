var mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    // quote: {
    //     type: Number,
    // },
    // city: {
    //     type: String,
    // },
    // state: {
    //     type: String,
    // },
    // jobTitle: {
    //     type: String,
    // },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "customer",
    },
    // propertyName: {
    //     type: String,
    // },
    // categoryId:{
    //   type: mongoose.Schema.Types.ObjectId, ref: 'categories ',
    // },
    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "subCategory",
    },
    subCategoryName: {
      type: String,
    },
    subCategoryImg: {
      type: String,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "customer",
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
    },
    // date: {
    //     type: Date,
    // },
    ScheduleTime: {
      type: Date,
    },
    // jobTotal: {
    //     type: Number,
    // },
    otp: {
      type: String,
    },
    address: {
      type: String,
    },
    rejectType: {
      type: String,
      enum: ["customer", "vendor"],
    },
    rejectReason: {
      type: String,
    },
    status: {
      type: String,
      default: "pending",
    },
    razorPayOrderId: {
      type: String,
    },
    isAddedbyAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Job = mongoose.model("job", jobSchema);
module.exports = Job;
