var mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
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
      enum: ["customer", "vendor"],
    },
    online: {
      type: Boolean,
      default: true,
    },
    emailAddress: {
      type: String,
    },
    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cities",
    },
    phone: {
      type: String,
      unique: true,
      trim: true,
    },
    // stateId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "states",
    // },
    // ageBracket: {
    //     type: String,
    // },

    // averageRating: {
    //     type: Number,
    //     // default: 20,
    // },
    // completedJob: {
    //     type: Number,
    //     // default: 10,
    // },
    completedProfile: {
      type: Boolean,
      default: false,
    },
    addressProofImage: {
      type: String,
    },
    certificateImage: {
      type: String,
    },

    formStep: {
      type: Number,
      default: 0,
    },
    address: [
      {
        firstName: String,
        lastName: String,
        blockNo: String,
        apartment: String,
        nearbyLandmark: String,
        pincode: Number,
        cityId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "cities",
        },
        stateId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "states",
        },

        addressType: String,
        lat: {
          type: Number,
        },
        lng: {
          type: Number,
        },
      },
    ],
    // pincode: {
    //     type: String,
    // },
    lastAccessOn: {
      type: Date,
    },
    codStatus: {
      type: String,
      default: "active",
    },
    token: {
      type: String,
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
    jobSkills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "subCategory",
      },
    ],

    status: {
      type: String,
      default: "active",
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
    // store registration token for push notification fcm
    registrationToken: {
      type: Array,
    },
  },
  {
    timestamps: true,
  }
);

const Customer = mongoose.model("customer", customerSchema);
module.exports = Customer;
