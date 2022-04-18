// var mongoose = require('mongoose');

// const vendorSchema = new mongoose.Schema({
//     companyName: {
//         type: String,
//     },
//     type: {
//         type: String,
//     },
//     logo: {
//         type: String,
//     }, 
//     firstName: {
//         type: String,
//     },
//     lastName: {
//         type: String,
//     },
//     emailAddress: {
//         type: String,
//     },
//     phone: {
//         type: String,
//         unique: true,
//         trim: true,
//     },
//     city: {
//         type: String,
//     },
//     state: {
//         type: String,
//     },
//     address: {
//         type: String,
//     },
//     pincode: {
//         type: Number,
//     },
//     averageRating: {
//         type: Number,
//     },
//     lastAccessOn: {
//         type: Date,
//     },
//     status: {
//         type: String,
//         default: 'active',
//     },
//     token: { 
//         type: String 
//     },
//     otp: {
//         type: Number,
//     },
//   },
//     {
//       timestamps: true
//     });
  
//   const Customer = mongoose.model('vendor', vendorSchema)
//   module.exports = Customer;