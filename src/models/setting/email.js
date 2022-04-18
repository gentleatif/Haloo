var mongoose = require('mongoose');

const emailSchema = new mongoose.Schema(
  {
    administratorEmailAddress: {
      type: String,
      required: true,
    },
    supportEmailAddress: {
      type: String,
    },
    notificationEmailAddress: {
      type: String,
    },
    smtpServerHost: {
      type: String,
    },
    smtpServerUserName: {
      type: String,
    },
    smtpServerPassword: {
      type: String,
    },
    smtpServerPort: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

const Email = mongoose.model('email', emailSchema);
module.exports = Email;
