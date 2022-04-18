var mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
    stateName: {
        type: String, required: true,
    },
    // countryName: {
    //     type: String, required: true,
    // },
    status: {
      type: String,
      default: 'Active',
    },
  },
    {
      timestamps: true
    });
  
  const State = mongoose.model('state', stateSchema)
  module.exports = State;

