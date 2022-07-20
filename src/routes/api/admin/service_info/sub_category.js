const express = require("express");
const fs = require("fs");
const router = express.Router();
const SubCategory = require("../../../../models/service_info/sub_category");
const Category = require("../../../../models/service_info/category");
const upload = require("../../../../middleware/multer");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const getNextSequence = require("../../../../utils/counter");

router.get("/", async (req, res) => {
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
  upload.fields([{ name: "image", maxCount: 1 }]),
  async (req, res) => {
    console.log("Got query:", req.query);
    console.log("Got body:", req.body);
    var category = req.body.category;
    var parentCategoryId = req.body.parentCategoryId;
    // var sequenceNumber = req.body.sequenceNumber;
    var status = req.body.status;
    var name = req.body.name;
    var price = req.body.price;
    if (!name) {
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
    // var seq = await getNextSequence("subCategory");
    // console.log("seq:", seq);
    var image;
    if (req.files && req.files.image) {
      console.log("Got image:", req.files.image);
      image = "uploads/images/" + req.files.image[0].filename;
      console.log("img===>", req.files.image[0].filename);
    }

    const categoryExists = await Category.exists({ _id: parentCategoryId });
    console.log(categoryExists);
    if (!categoryExists) {
      res.send({ error: "Parent category does not exist" });
    } else {
      var item = new SubCategory({
        name,
        category,
        parentCategoryId,
        subCategoryImage: image,
        // sequenceNumber,
        status,
        price,
      });

      console.log("item before save ==>", image);

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
  upload.fields([{ name: "image", maxCount: 1 }]),
  async function (req, res) {
    console.log("Got query:", req.query);
    console.log("Got body:", req.body);
    var _id = req.query._id;
    data = await SubCategory.findOne({
      _id: _id,
    });
    console.log(data);
    if (!_id) {
      res.send({ error: "Please provide an id" });
    } else if (!_id) {
      res.send({ error: "No collection with this id" });
    } else {
      if (req.files && req.files.image) {
        req.body.image = "uploads/images/" + req.files.image[0].filename;
        if (data.image) {
          fs.unlink(data.image, (err) => {
            if (err) throw err;
            console.log("successfully deleted image");
          });
        }
      }

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
