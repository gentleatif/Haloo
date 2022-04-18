const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  name: { type: String},
  profileImage: { type: String},
  email: { type: String, unique: true },
  userRole: { type: String },
  password: { type: String },
  token: { type: String },
  status : { type: String, default: "active" },
  otp: {
    type: String,
  },
  otpExpiry: {
      type: Date,
  },
});

const Admin = mongoose.model("admin", adminSchema);
module.exports = Admin;