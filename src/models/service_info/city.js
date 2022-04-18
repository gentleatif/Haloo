var mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
    cityName: {
        type: String, required: true,
    },
    stateId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'state',
    },
    status: {
      type: String,
      default: 'Active',
    },
  },
    {
      timestamps: true
    });
  
  const City = mongoose.model('city', citySchema)
  module.exports = City;

