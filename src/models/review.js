var mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    customerId :{
      type: mongoose.Schema.Types.ObjectId, ref: 'customer',
    },
    vendorId :{
      type: mongoose.Schema.Types.ObjectId, ref: 'customer',
    },
    jobId :{
      type: mongoose.Schema.Types.ObjectId, ref: 'job',
    },
    rating: {
        type: Number,
    },
    comment: {
      type: String,
    },
    reviewFor:{
      type: String,
    }
  },
    {
      timestamps: true
    });
  
  const Review = mongoose.model('review', reviewSchema)
  module.exports = Review;

