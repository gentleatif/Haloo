var mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    adminUser: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    osAndBrowser: {
      type: String,
    },
    loginDate: {
      type: String,
    },
    adminEmail: {
      type: String,
    },
    adminRole: {
      type: String,
    },
    browser: {
      type: String,
    },
    os: {
      type: String,
    },
    platform: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    adminLoginTime: {
      type: String,
    },
    logoutDate: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const AdminReport = mongoose.model("adminReport", reportSchema);
module.exports = AdminReport;
