var mongoose = require("mongoose");

const contactusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    phone: {
      type: String,
    },
    message: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Contactus = mongoose.model("Contactus", contactusSchema);
module.exports = Contactus;
