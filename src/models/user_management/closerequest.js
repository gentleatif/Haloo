var mongoose = require('mongoose');

const codRequestSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'customer'
    },
    jobID: {
        type: mongoose.Schema.Types.ObjectId, ref: 'job'
    },
    reason: {
        type: String,
    },
    status: {
      type: String,
    },
  },
    {
      timestamps: true
    });
  
  const CodRequest = mongoose.model('codRequest', codRequestSchema)
  module.exports = CodRequest;

