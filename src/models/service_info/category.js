var mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    categoryName: {
        type: String, required: true,
    },
    sequenceNumber: {
        type: Number,
    },
    // image: {
    //   type: String,
    // },
    // hoverImage: {
    //   type: String,
    // },
    status: {
      type: String,
      default: 'Active',
    },
  },
  {
    timestamps: true
  });
  
  const Category = mongoose.model('category', categorySchema)
  module.exports = Category;

