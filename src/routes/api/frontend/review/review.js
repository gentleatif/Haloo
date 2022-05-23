const express = require("express");
const router = express.Router();
const Review = require("../../../../models/review");
const Job = require("../../../../models/job");
const customer = require("../../admin/customer");
const mongoose = require("mongoose");
// get review
router.get("/", async function (req, res) {
  console.log("Got body:", req.body);
  console.log("Got query:", req.query);


  let { customerId, vendorId, jobId, _id, rating, reviewFor, comment } = req.query;

  //convert id into mogoose object id
  if (customerId) {
    customerId = mongoose.Types.ObjectId(customerId);
  }
  if (vendorId) {
    vendorId = mongoose.Types.ObjectId(vendorId);
  }
  if (jobId) {
    jobId = mongoose.Types.ObjectId(jobId);
  }
  if (_id) {
    _id = mongoose.Types.ObjectId(_id);
  }






  try {
    // data = await Review.find(findQuery);
    data = await Review.aggregate([
      {
        $match: {...req.query, $or: [{ customerId: req.customer._id }, { vendorId: req.customer._id }] },
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


  //check customer type vendor
  if (req.customer.type !== "vendor") {
    return res.status(400).send({error: "You are not a vendor"});
  }

  let vendorId = req.customer._id;
  let reviewFor = "customer";
  let { jobId, rating, comment } = req.body;

  let job = await Job.findOne({ _id: jobId });

  if (!job) {
    return res.status(400).send({ error: "Job not found", field: "jobId" });
  }

  let customerId = job.customerId;


  if (rating == NaN || rating > 5 || rating < 0) {
    return res.send({ error: "Invalid rating value" });
  }

  if (!jobId) {
    return res.send({ error: "Add JobId value" });
  }

  // if (reviewFor != "customer" && reviewFor != "vendor") {
  //   return res.send({ error: "Invalid reviewFor value, customer or vendor" });
  // }

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



router.post("/vendor", async function (req, res) {
  // var vendorId = req.customer._id;
  // var jobId = req.body.jobId;
  // // find customer of
  // let job = await Job.findOne({ _id: jobId });
  // let customerId = job.customerId;
  // var rating = parseFloat(req.body.rating);
  // var comment = req.body.comment;
  // var reviewFor = "customer";

  //check customer type customer
  if (req.customer.type !== "customer") {
    return res.status(400).send({error: "You are not a customer"});
  }

  let vendorId = req.customer._id;
  let reviewFor = "vendor";
  let { jobId, rating, comment } = req.body;

  let job = await Job.findOne({ _id: jobId });

  if (!job) {
    return res.status(400).send({ error: "Job not found", field: "jobId" });
  }

  let customerId = job.customerId;


  if (rating == NaN || rating > 5 || rating < 0) {
    return res.send({ error: "Invalid rating value" });
  }

  if (!jobId) {
    return res.send({ error: "Add JobId value" });
  }

  // if (reviewFor != "customer" && reviewFor != "vendor") {
  //   return res.send({ error: "Invalid reviewFor value, customer or vendor" });
  // }

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
    Review.deleteOne({ _id: _id })
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

// router.delete("/", async function (req, res) {
//   // console.log('Got query:', req.query);
//   // console.log('Got body:', req.body);
//   var _id = req.query.reviewId;
//   if (!_id) {
//     res.send({ error: "Please provide an id" });
//   } else {
//     //  remove eleemnt id id mongodb
//     Review.remove({ _id: _id })
//       .then(function (item) {
//         res.sendStatus(200);
//       })
//       .catch((error) => {
//         //error handle
//         console.log(error);
//         res.sendStatus(400);
//       });
//   }
// });

// router.put("/vendor", async function (req, res) {
//   // console.log('Got query:', req.query);
//   console.log("Got body:", req.body);
//   var _id = req.query._id;
//   if (!_id) {
//     res.send({ error: "Please provide an id" });
//   } else {
//     //  update eleemnt id id mongodb
//     Review.update({ _id: _id }, { $set: req.body })
//       .then(function (item) {
//         res.sendStatus(200);
//       })
//       .catch((error) => {
//         //error handle
//         console.log(error);
//         res.sendStatus(400);
//       });
//   }
// });

module.exports = router;
