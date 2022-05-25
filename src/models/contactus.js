var mongoose = require("mongoose");

const contactusSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
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
