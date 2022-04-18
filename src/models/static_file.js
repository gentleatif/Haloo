var mongoose = require('mongoose');

const staticSchema = new mongoose.Schema({
    srNO :{
      type: String
    },
    pageName :{
      type: String,
    },
    action :{
      type: String,
    },
  },
    {
      timestamps: true
    });
  
  const StaticFile = mongoose.model('staticFile', staticSchema)
  module.exports = StaticFile;

