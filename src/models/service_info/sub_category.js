var mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
    category: {
        type: String, required: true,
    },
    parentCategoryId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'category'
    },
    image: {
      type: String,
    },
    sequenceNumber: {
        type: Number,
    },
    status: {
      type: String,
    },
  },
    {
      timestamps: true
    });
  
  const SubCategory = mongoose.model('subCategory', subCategorySchema)
  module.exports = SubCategory;

