const express = require("express");
const router = express.Router();
const Admin = require("../../../../models/user_management/admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const upload = require("../../../../middleware/multer");
const AdminReport = require("../../../../models/report/admin_report");
const generate_otp = require("../../../../utils/generate_otp");
const nodemailer = require("nodemailer");
const auth = require("../../../../middleware/auth");
const config = process.env;
const Cloudinary = require("../../../../utils/upload");

router.post(
  "/register",
  upload.fields([{ name: "profileImage", maxCount: 1 }]),
  async (req, res) => {
    console.log("Got query:", req.query);
    console.log("Got body:", req.body);

    let { name, userRole, email, password, status } = req.body;

    var profileImage;
    if (req.files && req.files.profileImage) {
      profileImage = "uploads/images/" + req.files.profileImage[0].filename;
      image = await Cloudinary(req.files.categoryImage[0].path);
    }

    encryptedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      name,
      userRole,
      profileImage,
      status,
      email: email.toLowerCase(), // sanitize: convert email to lowercase
      password: encryptedPassword,
    });

    // Create token
    const token = await jwt.sign(
      { admin_id: admin._id, email },
      "config.TOKEN_KEY",
      {
        expiresIn: "1d",
      }
    );
    // save user token
    admin.token = token;

    admin
      .save()
      .then((item) => {
        console.log(item);
        res.status(201).json(admin);
      })
      .catch((error) => {
        //error handle
        console.log(error);
        res.sendStatus(400);
      });
  }
);

router.post("/login", async (req, res) => {
  // Our login logic starts here
  try {
    // Get user input
    const { email, password } = req.body;

    // Validate user input
    if (!email) {
      return res
        .status(400)
        .send({ error: "email is required", field: "email" });
    }
    if (!password) {
      // return res.status(400).send("All input is required");
      return res
        .status(400)
        .send({ error: "password is required", field: "password" });
    }
    // Validate if user exist in our database
    const admin = await Admin.findOne({ email });

    if (admin && (await bcrypt.compare(password, admin.password))) {
      // Create token
      const token = jwt.sign(
        { admin_id: admin._id, logintype: "admin" },
        "config.TOKEN_KEY",
        {
          expiresIn: "365d",
        }
      );

      // save user token
      admin.token = token;

      // user
      await admin.save();

      var ip =
        req.headers["x-forwarded-for"] || req.socket.remoteAddress || null;

      // save admin login report
      const adminReport = await AdminReport.create({
        adminUser: admin.name,
        adminEmail: admin.email,
        adminRole: admin.userRole,
        ipAddress: ip,
        // os: req.useragent.os,
        // platform: req.useragent.platform,
        // browser: req.useragent.browser,
        adminLoginTime: new Date(),
      });

      return res.status(200).json(admin);
    }
    return res.status(400).send("Invalid Credentials");
  } catch (err) {
    console.log(err);
  }
  // Our register logic ends here
});

router.post("/logout", async (req, res) => {
  // Our login logic starts here
  try {
    // Get user input
    console.log(req.user);
    const { email } = req.body;

    // Validate user input
    if (!email) {
      return res
        .status(400)
        .send({ error: "email is required", field: "email" });
    }
    // Validate if user exist in our database
    const admin = await Admin.findOne({ email });

    if (admin) {
      // logout
      admin.token = null;
      await admin.save();
      return res.status(200).send("Successfully logged out");
    }
    // res.status(400).send("No admin with email exist");
    return res
      .status(400)
      .send({ error: "No admin with this email exist", field: "email" });
  } catch (err) {
    console.log(err);
  }
  // Our register logic ends here
});

router.post("/resetpassword", auth, async (req, res) => {
  console.log("Got query:", req.query);
  console.log("Got body:", req.body);

  let { email, password } = req.body;

  encryptedPassword = await bcrypt.hash(password, 10);

  const admin = await Admin.findOne({ email });

  if (admin && password) {
    admin.password = encryptedPassword;
    admin
      .save()
      .then((item) => {
        console.log(item);
        res.status(201).json(admin);
      })
      .catch((error) => {
        //error handle
        console.log(error);
        res.sendStatus(400);
      });
  } else {
    res.status(400).send("No admin with email exist", (field = "email"));
  }
});

router.post("/forgetpassword", async (req, res) => {
  console.log("Got query:", req.query);
  console.log("Got body:", req.body);

  let { email } = req.body;

  //  check if email undefined
  if (!email) {
    return res.status(400).send("Email is required", (field = "email"));
  }

  // check if email exist
  const admin = await Admin.findOne({ email });

  if (admin) {
    try {
      // generate otp
      admin.otp = "0000"; //generate_otp(4);
      admin.otpExpiry = Date.now() + 2 * 60 * 1000;

      // save otp
      await admin.save();

      // let testAccount = await nodemailer.createTestAccount();

      // // create reusable transporter object using the default SMTP transport
      // let transporter = nodemailer.createTransport({
      //   host: "smtp.ethereal.email",
      //   port: 587,
      //   secure: false, // true for 465, false for other ports
      //   auth: {
      //     user: "rajpurohitvijesh@gmail.com", // generated ethereal user
      //     pass: "", // generated ethereal password
      //   },
      // });

      // // send mail with defined transport object
      // let info = await transporter.sendMail({
      //   from: '"Fred Foo 👻" rajpurohitvijesh@gmail.com', // sender address
      //   to: "rajpurohitvijesh7401@gmail.com, rajpurohitvijesh@gmail.com", // list of receivers
      //   subject: "Hello ✔", // Subject line
      //   text: "Hello world?", // plain text body
      //   html: "<b>Hello world?</b>", // html body
      // });

      // send otp to email
      return res.status(200).send({ data: { _id: admin._id } });
    } catch (error) {
      return res.status(400).send({ error: "Server error" });
    }
  } else {
    return res
      .status(400)
      .send({ error: "No admin with email exist", field: "email" });
  }

  // encryptedPassword = await bcrypt.hash(password, 10);

  // // const admin = await Admin.findOne({ email });

  // if (admin && password) {
  //   admin.password = encryptedPassword;
  //   admin
  //     .save()
  //     .then((item) => {
  //       console.log(item);
  //       res.status(201).json(admin);
  //     })
  //     .catch((error) => {
  //       //error handle
  //       console.log(error);
  //       res.sendStatus(400);
  //     });
  // } else {
  //   res.status(400).send('No admin with email exist');
  // }
});

// setpassword by validating otp
router.post("/setpassword", async (req, res) => {
  console.log("Got query:", req.query);
  console.log("Got body:", req.body);

  let { _id, otp, password, confirmPassword } = req.body;

  //  check if id not mongodb
  if (!_id) {
    return res.status(400).send({ error: "Id is required", field: "_id" });
  }

  //  check if otp and password and confirmPassword undefined
  if (!otp || !password || !confirmPassword) {
    return res
      .status(400)
      .send({ error: "Otp, password and confirmPassword is required" });
  }

  // check if password and confirmPassword match
  if (password !== confirmPassword) {
    return res.status(400).send({
      error: "Password and confirmPassword does not match",
      field: "Password",
    });
  }

  // check if otp is valid
  let admin = await Admin.findOne({ _id: _id });

  if (admin) {
    if (!(admin.otp || admin.otpExpiry)) {
      return res.status(400).send({ error: "OTP not generated", field: "otp" });
    }

    if (admin.otpExpiry < Date.now()) {
      return res.status(400).send({ error: "OTP expired", field: "otp" });
    }

    if (admin.otp == otp) {
      admin.otp = null;
      admin.otpExpiry = null;

      // generate new token and save
      encryptedPassword = await bcrypt.hash(password, 10);
      admin.password = encryptedPassword;

      await admin.save();

      return res.status(200).send({ data: admin });
    } else {
      return res
        .status(400)
        .send({ error: "OTP does not match", field: "otp" });
    }
  } else {
    return res
      .status(400)
      .send({ error: "No admin with id exist", field: "_id" });
  }
});

module.exports = router;
