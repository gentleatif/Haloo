var mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    // customerName: {
    //     type: String,
    // },
    profileImage: {
        type: String,
    },
    companyName: {
        type: String,
    },
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    type: {
        type: String,
        enum : ['customer','vendor'],
    },
    online: {
        type: Boolean,
        default: false,
    },
    // emailAddress: {
    //     type: String,
    // },
    cityId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'cities'
    },
    phone: {
        type: String,
        unique: true,
        trim: true,
    },
    stateId: {
        type: mongoose.Schema.Types.ObjectId, ref: 'states'
    },
    // ageBracket: {
    //     type: String,
    // },


    averageRating: {
        type: Number,
        // default: 20,
    },
    completedJob: {
        type: Number,
        // default: 10,
    },
    completedProfile:{
        type:   Boolean,
        default: false
    },
    address: {
        type: String,
    },
    pincode: {
        type: String,
    },
    lastAccessOn: {
        type: Date,
    },
    codStatus: {
      type: String,
      default: 'active',
    },
    token: { 
        type: String 
    },
    otp: {
        type: String,
    },
    otpExpiry: {
        type: Date,
    },
    countryCode: {
        type: String,
    },
    jobSkills: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'category'
    }],

    status: {
        type: String,
        default: 'active',
    },
    socketId: {
        type: String,
    },
    block: {
        type: Boolean,
        default: false,
    },
    blockReason: {
        type: String,
    },
  },
    {
      timestamps: true
    });
  
  const Customer = mongoose.model('customer', customerSchema)
  module.exports = Customer;