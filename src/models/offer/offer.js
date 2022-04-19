var mongoose = require('mongoose');

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    code: {
      type: String,
    },
    description: {
      type: String,
    },
    discount: {
      type: Number,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Offer = mongoose.model('offer', offerSchema);
module.exports = Offer;
