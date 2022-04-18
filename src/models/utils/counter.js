var mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    seq: {
        type: Number,
    },
});
  
  const Counter = mongoose.model('counter', counterSchema)
  module.exports = Counter;

