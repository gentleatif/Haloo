const express = require("express");
const router = express.Router();
const Support = require("../../../../models/support/support");
const fs = require("fs");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Customer = require("../../../../models/user_management/customer");
const upload = require("../../../../middleware/multer").single("supportImage");
const multer = require("multer");
const Cloudinary = require("../../../../utils/upload");

router.get("/", async (req, res) => {
  console.log("Got query:", req.query);
  if (req.query._id) {
    req.query._id = ObjectId(req.query._id);
  }

  try {
    // data = await Support.find(req.query);
    data = await Support.aggregate([
      {
        $match: {
          ...req.query,
          $or: [
            { customerId: req.customer._id },
            { vendorId: req.customer._id },
          ],
        },
      },
      // {
      //     $lookup: {
      //         from: 'customers',
      //         localField: 'customerId',
      //         foreignField: '_id',
      //         as: 'customerDetails'
      //     },
      // },
    ]);
    res.status(200).send({ data: data });
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
        .send({ error: err.message, field: "supportImage" });
      //   return res.status(400).send({error: 'Only .png, .jpg and .jpeg format allowed with maxsize 1Mb!', field: 'profileImage'});
    } else if (err) {
      // An unknown error occurred when uploading.
      console.log("A Multer error occurred when uploading.");
      console.log(err);
      return res
        .status(400)
        .send({ error: err.message, field: "supportImage" });
      //   return res.status(400).send({error: 'Only .png, .jpg and .jpeg format allowed with maxsize 1Mb!', field: 'profileImage' });
    }
    console.log("Got query:", req.query);
    console.log("Got body:", req.body);

    try {
      let { jobId, query, type } = req.body;
      //   check type
      const allowedTypes = [
        "Payment support",
        "Other",
        "Service Not completed",
      ];
      if (!allowedTypes.includes(type)) {
        return res.status(400).send({ error: "Invalid type", field: "type" });
      }
      // check jobId
      if (!jobId || !ObjectId.isValid(jobId)) {
        return res
          .status(400)
          .send({ error: "Please provide valid jobId", field: "jobId" });
      }

      // check query
      if (!query) {
        return res
          .status(400)
          .send({ error: "Please provide query", field: "query" });
      }

      // supportImage
      let supportImage;
      console.log("Got file:", req.file);
      if (req.file) {
        supportImage = "uploads/images/supportImage/" + req.file.filename;
        supportImage = await Cloudinary(req.file.path);
      }

      let support = new Support({
        customerId: req.customer._id,
        type,
        jobId,
        query,
        supportImage,
      });

      await support.save();
      // return res.status(200).send("ok");
      return res.status(200).json({ data: support });
    } catch (error) {
      console.log(error);
      return res.status(400).send(error);
    }
  });
});

router.delete("/", async function (req, res) {
  // console.log('Got query:', req.query);
  // console.log('Got body:', req.body);
  let _id = req.query.id;
  if (!_id) {
    res.send({ error: "Please provide an id", field: "id" });
  } else {
    //  remove element by id
    Support.remove({ _id })
      .then((item) => {
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

router.put("/", async function (req, res) {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      console.log("A Multer error occurred when uploading.");
      console.log(err);
      return res
        .status(400)
        .send({ error: err.message, field: "supportImage" });
      //   return res.status(400).send({error: 'Only .png, .jpg and .jpeg format allowed with maxsize 1Mb!', field: 'profileImage'});
    } else if (err) {
      // An unknown error occurred when uploading.
      console.log("A Multer error occurred when uploading.");
      console.log(err);
      return res
        .status(400)
        .send({ error: err.message, field: "supportImage" });
      //   return res.status(400).send({error: 'Only .png, .jpg and .jpeg format allowed with maxsize 1Mb!', field: 'profileImage' });
    }
    console.log("Got query:", req.query);
    console.log("Got body:", req.body);

    try {
      let { jobId, query, type } = req.body;
      //   check type
      const allowedTypes = [
        "Payment support",
        "Other",
        "Service Not completed",
      ];
      if (!allowedTypes.includes(type)) {
        return res.status(400).send({ error: "Invalid type", field: "type" });
      }
      // support id
      let _id = req.query.id;
      if (!_id) {
        return res
          .status(400)
          .send({ error: "Please provide an id", field: "id" });
      }

      // check support exist
      let support = await Support.findOne({ _id });
      if (!support) {
        return res
          .status(400)
          .send({ error: "Support not found", field: "id" });
      }

      let supportImage;
      console.log(req.file);
      if (req.file) {
        supportImage = "uploads/images/supportImage/" + req.file.filename;
        supportImage = await Category(req.file.path);
        if (support.supportImage) {
          fs.unlink(support.supportImage, (err) => {
            if (err) {
              console.log(err);
            }
            console.log({ data: "successfully deleted supportImage" });
          });
        }
      }

      Support.findOneAndUpdate(
        { _id: req.query.id },
        { $set: { query, supportImage, type } },
        { returnOriginal: false, upsert: true }
      )
        .then((item) => {
          // return res.sendStatus(200);
          return res.status(200).json({ data: item });
        })
        .catch((error) => {
          //error handle
          console.log(error);
          return res.status(400).send({ error: error });
        });
    } catch (error) {
      console.log(error);
      return res.status(400).send(error);
    }
  });
});

module.exports = router;
