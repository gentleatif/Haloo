var mongoose = require('mongoose');


const jobSchema = new mongoose.Schema({
    quote: {
      type: Number, 
    },
    city: {
        type: String,
    },
    state: {
      type: String,
    },
    jobTitle: {
      type: String,
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'customer',
    },
    // propertyName: {
    //     type: String,
    // },
    categoryId:{
      type: mongoose.Schema.Types.ObjectId, ref: 'categories ',
    },
    subCategoryId:{
      type: mongoose.Schema.Types.ObjectId, ref: 'subcategories ',
    },
    status:{
        type: String,
        default: 'pending',
    },
    vendorId:{
      type: mongoose.Schema.Types.ObjectId, ref: 'customer',
    },
    jobTotal:{
      type: Number,
    },
    otp:{
      type: String,
    },
  },
    {
      timestamps: true
    });
  
  const Job = mongoose.model('job', jobSchema)
  module.exports = Job;

