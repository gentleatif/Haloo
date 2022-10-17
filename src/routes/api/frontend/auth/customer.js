const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

//import files
const customer_auth = require("../../../../middleware/customer_auth");
const generate_otp = require("../../../../utils/generate_otp");
const Customer = require("../../../../models/user_management/customer");
const config = require("../../../../../config");

router.post("/generate_otp", async (req, res) => {
  console.log("Got query:", req.query);
  console.log("Got body:", req.body);

  let { phone } = req.body;

  if (!phone) {
    return res
      .status(400)
      .json({ error: "Phone number is required", field: "phone" });
  }

  //phone regex E.164 format
  let phoneRegExp = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegExp.test(phone)) {
    return res
      .status(400)
      .json({ error: "Phone number must be E.164 format", field: "phone" });
  }

  // check if phone number is already registered
  let customer = await Customer.findOne({ phone });

  console.log("customer", customer);

  if (customer) {
    // check block
    if (customer.block) {
      return res.status(400).json({
        error: "Your account is blocked by admin",
        field: "phone",
      });
    }

    //generate otp ans save
    let otp = generate_otp(4);
    customer.otp = otp;
    customer.otpExpiry = Date.now() + 2 * 60 * 1000;
    await customer.save();
    console.log("customer", customer);
    if (!customer.type) {
      return res.status(200).json({ data: { id: customer._id } });
    }
    return res
      .status(200)
      .json({ data: { id: customer._id, type: customer.type } });
  } else {
    let otp = generate_otp(4);
    let otpExpiry = Date.now() + 2 * 60 * 100000;
    let customer = new Customer({
      phone,
      otp,
      otpExpiry,
    });
    await customer.save();
    console.log("customer ------->", customer);
    return res.status(200).json({ data: { id: customer._id } });
  }
});

router.post("/verify_otp", async (req, res) => {
  let { id, otp, type } = req.body;

  if (!id) {
    return res
      .status(400)
      .send({ error: "Customer id is required", field: "id" });
  }

  if (!otp) {
    return res.status(400).send({ error: "OTP is required", field: "otp" });
  }

  let customer = await Customer.findOne({ _id: id });
  console.log(customer);

  if (customer) {
    if (customer.block) {
      // return res
      //   .status(400)
      //   .send({ error: "Your account is blocked by admin", field: "phone" });
      return res
        .status(400)
        .json({ error: "Your account is blocked by admin", field: "phone" });
    }
    //

    if (!customer.type) {
      if (!type || !(type === "vendor" || type === "customer")) {
        return res
          .status(400)
          .send({ error: "Type is required (vendor/customer)", field: "type" });
      }
      customer.type = type;
    }
    // check otp generated
    if (!(customer.otp || customer.otpExpiry)) {
      return res.status(400).json({ error: "OTP not generated", field: "otp" });
    }

    // check if otp is expired
    if (customer.otpExpiry < Date.now()) {
      return res.status(400).json({ error: "OTP expired", field: "otp" });
    }
    if (customer.otp === otp) {
      // is loggedIn on new device save new device token
      if (!customer.registrationToken.includes(req.body.registrationToken)) {
        // add this device token to customer deviceToken array
        customer.registrationToken.push(req.body.registrationToken);
        await customer.save();
      }

      // customer.otp_expiry = Date.now() + (60 * 1000);
      customer.otp = null;
      customer.otpExpiry = null;

      if (customer.token) {
        try {
          const decoded = jwt.verify(
            customer.token,
            config.CUSTOMER_LOGIN_SECRET
          );
        } catch (e) {
          console.log(e);
          customer.token = jwt.sign(
            { id: customer._id, loginType: "customer" },
            config.CUSTOMER_LOGIN_SECRET,
            { expiresIn: "30d" }
          );
        }
      } else {
        customer.token = jwt.sign(
          { id: customer._id, loginType: "customer" },
          config.CUSTOMER_LOGIN_SECRET,
          { expiresIn: "30d" }
        );
      }
      // save jws token
      // customer.token = jwt.sign({ id: customer._id, loginType:'customer'  }, config.CUSTOMER_LOGIN_SECRET, { expiresIn: '30d' });

      await customer.save();

      if (!customer.type) {
        return res.send({ data: { customer, newUser: true } });
      }
      return res.send({ data: { customer, newUser: false } });
    } else {
      return res.status(400).send({ error: "Invalid OTP", field: "otp" });
    }
  } else {
    return res.status(400).send({ error: "Invalid Customer Id", field: "id" });
  }
});

router.post("/logout", customer_auth, async (req, res) => {
  // let customer = await Customer.findOne({_id:_id});
  console.log(req.customer);
  Customer.updateOne({ _id: req.customer._id }, { token: null }, (err, _) => {
    if (err) {
      return res.status(400).send({ error: err });
    }
    return res.status(200).send({ data: "Successfully logged out" });
  });
});

module.exports = router;
