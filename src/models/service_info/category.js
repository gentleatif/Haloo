var mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryName: {
        type: String, required: true,
    },
    sequenceNumber: {
        type: Number,
    },
    categoryImage: {
      type: String,
    },
    // hoverImage: {
    //   type: String,
    // },
    status: {
      type: String,
      default: 'active',
    },
  },
  {
    timestamps: true
  });
  
  const Category = mongoose.model('category', categorySchema)
  module.exports = Category;

