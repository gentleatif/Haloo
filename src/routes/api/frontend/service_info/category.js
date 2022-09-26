const express = require("express");
const router = express.Router();
const Category = require("../../../../models/service_info/category");
const subCategory = require("../../../../models/service_info/sub_category");
const fs = require("fs");
const Counter = require("../../../../models/utils/counter");
const getNextSequence = require("../../../../utils/counter");
const upload = require("../../../../middleware/multer").single("categoryImage");
const multer = require("multer");

const Cloudinary = require("../../../../utils/upload");

router.get("/", async (req, res) => {
  console.log("Got query: =================>", req.query);
  try {
    const categoryName = req.query.categoryName;
    var categories;
    if (categoryName != undefined) {
      var query = { categoryName: { $regex: new RegExp(categoryName, "i") } };
      categories = await Category.find(query);
    } else {
      categories = await Category.find({});
    }
    res.status(200).send({ data: categories });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "server error occur" });
  }
});

router.post("/", async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      console.log("A Multer error occurred when uploading.");
      console.log(err);
      return res
        .status(400)
        .send({ error: err.message, field: "categoryImage" });
      //   return res.status(400).send({error: 'Only .png, .jpg and .jpeg format allowed with maxsize 1Mb!', field: 'profileImage'});
    } else if (err) {
      // An unknown error occurred when uploading.
      console.log("A Multer error occurred when uploading.");
      console.log(err);
      return res
        .status(400)
        .send({ error: err.message, field: "categoryImage" });
      //   return res.status(400).send({error: 'Only .png, .jpg and .jpeg format allowed with maxsize 1Mb!', field: 'profileImage' });
    }
    console.log("Got query:", req.query);
    console.log("Got body:", req.body);

    const categoryName = req.body.categoryName;
    // var sequenceNumber = req.body.sequenceNumber;

    const status = req.body.status;

    let categoryImage;
    console.log("Got file:", req.file);
    if (req.file) {
      categoryImage = "uploads/images/categoryImage/" + req.file.filename;
      categoryImage = Cloudinary(req.file.path);
    }

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
    console.log("categoryImage:", categoryImage);
    var item = new Category({
      categoryName,
      categoryImage,
      sequenceNumber: seq,
      status,
    });

    item
      .save(item)
      .then(function (item) {
        // console.log(item);
        // res.sendStatus(200);
        return res.status(200).json({ data: item });
      })
      .catch((error) => {
        //error handle
        console.log(error);
        res.status(400).send({ error: "Error occur while saving data to db" });
      });
  });
});

module.exports = router;
