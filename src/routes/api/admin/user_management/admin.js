const express = require("express");
const router = express.Router();
const Admin = require("../../../../models/user_management/admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const upload = require("../../../../middleware/multer");

router.get("/", async (req, res) => {
  console.log("Got query admin route hit :");
  console.log("Got query:", req.query);
  var findQuery = {};

  try {
    data = await Admin.find(req.query);

    for (let i = 0; i < data.length; i++) {
      if (data[i].profileImage) {
        // check if file exist
        if (fs.existsSync(data[i].profileImage)) {
          data[i].profileImage = data[i].profileImage;
        } else {
          data[i].profileImage = null;
        }
      }
    }

    res.send({ data: data });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
});

router.post(
  "/",
  upload.fields([{ name: "profileImage", maxCount: 1 }]),
  async (req, res) => {
    console.log("Got query:", req.query);
    console.log("Got body:", req.body);

    let { name, userRole, email, password, status } = req.body;

    var profileImage;
    if (req.files && req.files.profileImage) {
      profileImage = "uploads/images/" + req.files.profileImage[0].filename;
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
    const token = jwt.sign({ admin_id: admin._id, email }, "config.TOKEN_KEY", {
      expiresIn: "265d",
    });
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

router.delete("/", async function (req, res) {
  // console.log('Got query:', req.query);
  // console.log('Got body:', req.body);
  var _id = req.query._id;
  if (!_id) {
    res.send({ error: "Please provide an id" });
  } else {
    //  remove eleemnt id id mongodb
    Admin.findOneAndDelete({ _id: _id })
      .then((item) => {
        if (item.profileImage) {
          fs.unlink(item.profileImage, (err) => {
            if (err) console.log(err);
            console.log("successfully deleted profileImage");
          });
        }
        res.sendStatus(200);
      })
      .catch((error) => {
        //error handle
        console.log(error);
        res.sendStatus(400);
      });
  }
});

router.put(
  "/",
  upload.fields([{ name: "profileImage", maxCount: 1 }]),
  async function (req, res) {
    console.log("Got query:", req.query);
    console.log("Got body:", req.body);
    var _id = req.query._id;

    data = await Admin.findOne({
      _id: _id,
    });
    console.log(data);
    if (!_id) {
      res.send({ error: "Please provide an id" });
    } else if (!_id) {
      res.send({ error: "Please provide an id" });
    } else {
      if (req.files && req.files.profileImage) {
        req.body.profileImage =
          "uploads/images/" + req.files.profileImage[0].filename;
        if (data.profileImage) {
          fs.unlink(data.profileImage, (err) => {
            if (err) console.log(err);
            console.log("successfully deleted profileImage");
          });
        }
      }
      if (req.body.password) {
        req.body.password = await bcrypt.hash(req.body.password, 10);
      }

      //  update element in mongodb put
      Admin.findByIdAndUpdate({ _id: _id }, { $set: req.body }, { new: true })
        .then((item) => {
          res.status(200).json(item);
        })
        .catch((error) => {
          //error handle
          console.log(error);
          res.sendStatus(400);
        });
    }
  }
);

module.exports = router;
