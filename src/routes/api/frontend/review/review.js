const express = require("express");
const router = express.Router();
const Review = require("../../../../models/review");
const Job = require("../../../../models/job");
const customer = require("../../admin/customer");
// get review
router.get("/", async function (req, res) {
  console.log("Got body:", req.body);
  console.log("Got query:", req.query);
  var customerId = req.query.customerId;
  var vendorId = req.query.vendorId;
  var jobId = req.query.jobId;
  var _id = req.query.id;

  var rating = req.query.rating;

  var findQuery = { _id, customerId, vendorId, jobId, rating };

  Object.keys(findQuery).forEach((key) => {
    if (
      findQuery[key] === "" ||
      findQuery[key] === NaN ||
      findQuery[key] === undefined
    ) {
      delete findQuery[key];
    }
  });
  try {
    // data = await Review.find(findQuery);
    data = await Review.aggregate([
      {
        $match: findQuery,
      },
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customerDetails",
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "vendorId",
          foreignField: "_id",
          as: "vendorDetails",
        },
      },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "jobDetails",
        },
      },
    ]);

    res.send({ data: data });
  } catch (error) {
    res.sendStatus(400);
  }
});
// create --> customer
router.post("/customer", async function (req, res) {
  var vendorId = req.customer._id;
  var jobId = req.body.jobId;
  // find customer of
  let job = await Job.findOne({ _id: jobId });
  let customerId = job.customerId;
  var rating = parseFloat(req.body.rating);
  var comment = req.body.comment;
  var reviewFor = "customer";
  if (rating == NaN || rating > 5 || rating < 0) {
    return res.send({ error: "Invalid rating value" });
  } else if (!jobId) {
    return res.send({ error: "Add JobId value" });
  } else if (reviewFor != "customer" && reviewFor != "vendor") {
    return res.send({ error: "Invalid reviewFor value, customer or vendor" });
  }
  var item = new Review({
    customerId,
    vendorId,
    jobId,
    rating,
    comment,
    reviewFor,
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
      res.sendStatus(400);
    });
});
// create --> vendor
router.post("/vendor", async function (req, res) {
  var customerId = req.customer._id;
  var jobId = req.body.jobId;
  // find customer of
  let job = await Job.findOne({ _id: jobId });
  let vendorId = job.vendorId;
  var rating = parseFloat(req.body.rating);
  var comment = req.body.comment;
  var reviewFor = "vendor";
  if (rating == NaN || rating > 5 || rating < 0) {
    return res.send({ error: "Invalid rating value" });
  } else if (!jobId) {
    return res.send({ error: "Add JobId value" });
  } else if (reviewFor != "customer" && reviewFor != "vendor") {
    return res.send({ error: "Invalid reviewFor value, customer or vendor" });
  }
  var item = new Review({
    customerId,
    vendorId,
    jobId,
    rating,
    comment,
    reviewFor,
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
      res.sendStatus(400);
    });
});
// update --> customer, vendor
router.put("/", async function (req, res) {
  const _id = req.query.id;
  if (!_id) {
    res.send({ error: "Please provide an id" });
  } else {
    // check rating before submitting
    const { rating, comment } = req.body;
    if (rating == NaN || rating > 5 || rating < 0) {
      return res.send({ error: "Invalid rating value" });
    }

    let item = {
      rating,
      comment,
    };
    //  update eleemnt id id mongodb
    Review.updateOne({ _id: _id }, { $set: item })
      .then(function (item) {
        res.sendStatus(200);
      })
      .catch((error) => {
        //error handle
        console.log(error);
        res.sendStatus(400);
      });
  }
});
// delete --> customer, vendor
router.delete("/", async function (req, res) {
  // console.log('Got query:', req.query);
  // console.log('Got body:', req.body);
  var _id = req.query.id;
  if (!_id) {
    res.send({ error: "Please provide an id" });
  } else {
    //  remove eleemnt id id mongodb
    Review.remove({ _id: _id })
      .then(function (item) {
        res.sendStatus(200);
      })
      .catch((error) => {
        //error handle
        console.log(error);
        res.sendStatus(400);
      });
  }
});

module.exports = router;
