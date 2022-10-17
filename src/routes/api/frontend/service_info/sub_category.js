const express = require("express");
const fs = require("fs");
const router = express.Router();
const SubCategory = require("../../../../models/service_info/sub_category");
const Category = require("../../../../models/service_info/category");
const upload = require("../../../../middleware/multer").single(
  "subCategoryImage"
);
const Cloudinary = require("../../../../utils/upload");

const mongoose = require("mongoose");
const multer = require("multer");
const ObjectId = mongoose.Types.ObjectId;

router.get("/", async (req, res) => {
  console.log("Got query:", req.query);

  //   if (req.query._id) {
  //     req.query._id = ObjectId(req.query._id);
  //   }

  //   if (req.query.parentCategoryId) {
  //     req.query.parentCategoryId = ObjectId(req.query.parentCategoryId);
  //   }

  try {
    let subCategoryName = req.query.subCategoryName;
    // console.log(data);
    if (req.query.parentCategoryId) {
      const subCategory = await SubCategory.find({
        parentCategoryId: req.query.parentCategoryId,
      });
      return res.status(200).send({ data: subCategory });
    }

    if (req.query._id) {
      const subCategory = await SubCategory.findById(req.query._id);
      return res.status(200).send({ data: subCategory });
    }

    var query = {
      category: { $regex: new RegExp("^" + subCategoryName + ".*", "i") },
    };
    var query2 = { categoryName: { $regex: new RegExp(subCategoryName, "i") } };

    let subCategoryData = await SubCategory.find(query);
    let categoryData = await Category.find(query2);
    // send both category data in response as well as sub category data
    const data = { subCategory: subCategoryData, category: categoryData };
    return res.status(200).send({ data: data });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
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
        .send({ error: err.message, field: "subCategoryImage" });
      //   return res.status(400).send({error: 'Only .png, .jpg and .jpeg format allowed with maxsize 1Mb!', field: 'profileImage'});
    } else if (err) {
      // An unknown error occurred when uploading.
      console.log("A Multer error occurred when uploading.");
      console.log(err);
      return res
        .status(400)
        .send({ error: err.message, field: "subCategoryImage" });
      //   return res.status(400).send({error: 'Only .png, .jpg and .jpeg format allowed with maxsize 1Mb!', field: 'profileImage' });
    }

    console.log("Got query:", req.query);
    console.log("Got body:", req.body);
    const subCategoryName = req.body.subCategoryName;
    const parentCategoryId = req.body.parentCategoryId;
    const sequenceNumber = req.body.sequenceNumber;
    const status = req.body.status;
    const price = req.body.price;

    let subCategoryImage;
    if (req.file) {
      subCategoryImage = "uploads/images/subCategoryImage/" + req.file.filename;
      subCategoryImage = await Cloudinary(req.file.path);
    }

    //validate price number
    if (!price) {
      return res
        .status(400)
        .send({ error: "Price is required!", field: "price" });
    }
    // check if sub category name already exists
    const subCategoryExists = await SubCategory.exists({
      subCategoryName: subCategoryName,
    });
    if (subCategoryExists) {
      res.send({
        error: "Sub category already exists",
        field: "subCategoryName",
      });
    }

    const categoryExists = await Category.exists({ _id: parentCategoryId });
    console.log(categoryExists);
    if (!categoryExists) {
      res.send({
        error: "Parent category does not exist",
        field: "parentCategoryId",
      });
    } else {
      var item = new SubCategory({
        subCategoryName: subCategoryName,
        parentCategoryId,
        subCategoryImage,
        price,
        sequenceNumber,
        status,
      });

      item
        .save(item)
        .then(function (item) {
          console.log(item);
          // res.sendStatus(200);
          return res.status(200).json({ data: item });
        })
        .catch((error) => {
          //error handle
          console.log(error);
          res.sendStatus(400);
        });
    }
  });
});

module.exports = router;
