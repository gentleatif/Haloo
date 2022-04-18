var mongoose = require('mongoose');

const masterSchema = new mongoose.Schema(
  {
    copyrightText: {
      type: String,
    },
    siteControlPanelTitle: {
      type: String,
    },
    validImageExtensions: [{
      type: String,
    }],
    noOfRecordsPerPage: {
      type: Number,
    },
    rewardsAmount: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

const Master = mongoose.model('master', masterSchema);
module.exports = Master;
