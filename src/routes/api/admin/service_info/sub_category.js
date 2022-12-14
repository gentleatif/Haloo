const express = require("express");
const fs = require("fs");
const router = express.Router();
const SubCategory = require("../../../../models/service_info/sub_category");
const Category = require("../../../../models/service_info/category");
const upload = require("../../../../middleware/multer");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const getNextSequence = require("../../../../utils/counter");
const cloudinary = require("cloudinary").v2;
const Cloudinary = require("../../../../utils/upload");

router.get("/", async (req, res) => {
  // write a function to add two number
  function add(a, b) {
    return a + b;
  }
  // call the function
  var result = add(10, 20);

  console.log("Got query:", req.query);
  // var findQuery = {};
  // console.log('Got query:', req.query.length);
  // if(req.query.length > 0){
  //     var findQuery = {_id:req.query._id, category:req.query.category, parentCategoryId:req.query.parentCategoryId, sequenceNumber:req.query.sequenceNumber, status:req.query.status};

  //     Object.keys(findQuery).forEach(key => {
  //         if (findQuery[key] === '' || findQuery[key] === NaN || findQuery[key] === undefined) {
  //         delete findQuery[key];
  //         }
  //     });
  // }

  if (req.query._id) {
    req.query._id = ObjectId(req.query._id);
  }

  try {
    // movedb lookup to get reference data
    data = await SubCategory.aggregate([
      {
        $match: req.query,
      },
      {
        $lookup: {
          from: "categories",
          localField: "parentCategoryId",
          foreignField: "_id",
          as: "parentCategoryDetails",
        },
      },
    ]);

    console.log(data);

    // data = await SubCategory.find(findQuery);
    res.send({ data: data });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
});

router.post(
  "/",
  upload.fields([{ name: "subCategoryImage", maxCount: 1 }]),
  async (req, res) => {
    console.log("Got query:", req.query);
    console.log("Got body: post route hit", req.body);
    var category = req.body.category;
    var parentCategoryId = req.body.parentCategoryId;
    // var sequenceNumber = req.body.sequenceNumber;
    var status = req.body.status;
    var subCategoryName = req.body.subCategoryName;
    var price = req.body.price;
    if (!subCategoryName) {
      return res.status(400).send({ error: "name is required", field: "name" });
    }
    if (!price) {
      return res
        .status(400)
        .send({ error: "price is required", field: "price" });
    }
    if (!category) {
      return res
        .status(400)
        .send({ error: "category is required", field: "category" });
    }
    if (!parentCategoryId) {
      return res.status(400).send({
        error: "parentCategoryId is required",
        field: "parentCategoryId",
      });
    }
    let checkCategory = await SubCategory.findOne({
      subCategoryName: subCategoryName,
    });
    if (checkCategory) {
      return res
        .status(400)
        .send({ error: "subCategory already exist", field: "subCategoryName" });
    }

    var image;
    console.log("req.files ===>", req.files);
    if (req.files && req.files.subCategoryImage) {
      image = await Cloudinary(req.files.subCategoryImage[0].path);
    }

    const categoryExists = await Category.exists({ _id: parentCategoryId });
    console.log(categoryExists);
    if (!categoryExists) {
      res.send({ error: "Parent category does not exist" });
    } else {
      var item = new SubCategory({
        subCategoryName: subCategoryName,
        category,
        parentCategoryId,
        subCategoryImage: image,
        status,
        price,
        sequenceNumber: await getNextSequence("subCategory"),
      });

      console.log("item before save ==>", item);

      item
        .save(item)
        .then(function (item) {
          console.log(item);
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

router.delete("/", async function (req, res) {
  // console.log('Got query:', req.query);
  // console.log('Got body:', req.body);
  var _id = req.query._id;
  if (!_id) {
    res.send({ error: "Please provide an id" });
  } else {
    //  remove eleemnt id id mongodb
    SubCategory.findOneAndDelete({ _id: _id })
      .then(function (item) {
        console.log(item);
        if (item.image) {
          fs.unlink(item.image, (err) => {
            if (err) throw err;
            console.log("successfully deleted image");
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
  upload.fields([{ name: "subCategoryImage", maxCount: 1 }]),
  async function (req, res) {
    console.log("Got query:", req.query);
    console.log("Got body update subcate route hit ===>:", req.body);
    var _id = req.query._id;
    data = await SubCategory.findOne({
      _id: _id,
    });
    console.log(data);
    if (!_id) {
      res.send({ error: "Please provide an id" });
    } else if (!data) {
      res.send({ error: "No collection with this id" });
    } else {
      let result;
      if (req.files && req.files.subCategoryImage) {
        result = await cloudinary.uploader.upload(
          req.files.subCategoryImage[0].path
        );
        req.body.subCategoryImage = result.secure_url;
      }
      // update image with cloudinary
      // req.body.subCategoryImage = result.secure_url;
      var seq = await getNextSequence("SubCategory");
      console.log("seq:======>", seq);
      console.log("req.body===>", req.body);
      //  update element in mongodb put
      SubCategory.updateOne({ _id: _id }, { $set: req.body })
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
