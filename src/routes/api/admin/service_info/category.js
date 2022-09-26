const express = require("express");
const router = express.Router();
const Category = require("../../../../models/service_info/category");
const fs = require("fs");
const Counter = require("../../../../models/utils/counter");

const upload = require("../../../../middleware/multer");
const Cloudinary = require("../../../../utils/upload");
const getNextSequence = require("../../../../utils/counter");

router.get("/", async (req, res) => {
  console.log("Got query:", req.query);

  try {
    // console.log('findQuery:', findQuery);
    let resType = req.query.type;
    console.log("resType:", resType);

    data = await Category.find(req.query);
    res.send({ data: data });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "server error occur" });
  }
});

router.post(
  "/",
  upload.fields([{ name: "categoryImage", maxCount: 1 }]),
  async (req, res) => {
    console.log("Got query:", req.query);
    console.log("Got body:", req.body);
    console.log("Got files:", req.files);

    console.log("add to cart route hit successfully");
    var categoryName = req.body.categoryName;
    console.log("category body===>", req.body);

    // var sequenceNumber = req.body.sequenceNumber;

    var status = req.body.status;

    if (!categoryName) {
      return res
        .status(400)
        .send({ error: "categoryName is required", field: "categoryName" });
    }
    // check state already exist
    let checkCategory = await Category.findOne({ categoryName: categoryName });
    if (checkCategory) {
      return res
        .status(400)
        .send({ error: "Category already exist", field: "categoryName" });
    }

    var seq = await getNextSequence("category");
    console.log("seq:", seq);
    var image;
    if (req.files && req.files.categoryImage) {
      console.log("Got image:", req.files.categoryImage);
      image =
        "uploads/images./categoryImage/" + req.files.categoryImage[0].filename;

      image = await Cloudinary(req.files.categoryImage[0].path);
    }

    var item = new Category({
      categoryName,
      sequenceNumber: seq,
      status,
      categoryImage: image,
    });

    item
      .save(item)
      .then(function (item) {
        console.log(item);
        res.sendStatus(200);
      })
      .catch((error) => {
        //error handle
        console.log(error);
        res.status(400).send({ error: "Error occur while saving data to db" });
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
    Category.findOneAndDelete({
      _id: _id,
    })
      .then(function (item) {
        res.sendStatus(200);
      })
      .catch((error) => {
        //error handle
        console.log(error);
        res.status(400).send({ error: "server error occur" });
      });
  }
});

router.put(
  "/",
  upload.fields([{ name: "categoryImage", maxCount: 1 }]),
  async function (req, res) {
    console.log("Got query:", req.query);
    console.log("Got body:", req.body);
    var _id = req.query._id;
    data = await Category.findOne({
      _id: _id,
    });
    console.log(data);
    if (!_id) {
      res.send({ error: "Please provide an id" });
    } else if (!_id) {
      res.send({ error: "No collection with this id" });
    } else {
      if (req.files && req.files.categoryImage) {
        req.body.categoryImage =
          "uploads/images/categoryImage/" + req.files.categoryImage[0].filename;
        req.body.categoryImage = await Cloudinary(
          req.files.categoryImage[0].path
        );

        if (data.categoryImage) {
          fs.unlink(data.categoryImage, (err) => {
            if (err) throw err;
            console.log("successfully deleted image");
          });
        }
      }

      console.log("req.body===>", req.body);
      //  update element in mongodb put
      Category.updateOne({ _id: _id }, { $set: req.body })
        .then(function (item) {
          res.sendStatus(200);
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
