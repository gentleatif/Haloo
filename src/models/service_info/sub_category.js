var mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    subCategoryName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    parentCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },
    subCategoryImage: {
      type: String,
    },
    sequenceNumber: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    price: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const SubCategory = mongoose.model("subCategory", subCategorySchema);
module.exports = SubCategory;
