const express = require("express");
const router = express.Router();
const Review = require("../../../../models/review");
const Job = require("../../../../models/job");
const Customer = require("../../../../models/user_management/customer");
const Vendor = require("../../../../models/user_management/vendor");
const { sign } = require("jsonwebtoken");

// const { findOne } = require("../../../../models/review");
// get review

router.get("/", async function (req, res) {
  // console.log("Got body:", req.body);
  console.log("Got query:", req.query);

  let { customerId, vendorId, jobId, _id, rating, reviewFor, comment } =
    req.query;

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
    data = await Review.aggregate([
      {
        $match: {
          ...req.query,
          $or: [
            { customerId: req.customer._id },
            { vendorId: req.customer._id },
          ],
        },
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
    ]);
    let rating1 = 0;
    let rating2 = 0;
    let rating3 = 0;
    let rating4 = 0;
    let rating5 = 0;
    const reviews = [];
    data.forEach((single) => {
      console.log("vendorDtls of Each rating===> ");
      // ife here for when reviewFor
      const vendor = single.vendorDetails[0];
      const vendorDtls = {
        name: vendor.firstName + vendor.lastName,
        rating: single.rating,
        comment: single.comment,
        img: vendor.profileImage,
      };
      reviews.push(vendorDtls);
      switch (single.rating) {
        case 1:
          rating1++;
          break;
        case 2:
          rating2++;
          break;
        case 3:
          rating3++;
          break;
        case 4:
          rating4++;
          break;
        case 5:
          rating5++;
          // code block
          break;
        // code block
      }
    });

    let totalRating = rating1 + rating2 + rating3 + rating4 + rating5;
    let averageRating =
      (1 * rating1 + 2 * rating2 + 3 * rating3 + 4 * rating4 + 5 * rating5) /
      totalRating;
    averageRating = averageRating.toFixed(1);
    // taking dtls of logged in user as my dtls
    const customer = req.customer;
    console.log();
    const customerDtls = {
      name: customer.address[0].firstName + customer.address[0].lastName,
      img: customer.profileImage,
      averageRating: averageRating,
      totalRating: totalRating,
      fiveStar: rating5,
      fourStar: rating4,
      threeStar: rating3,
      twoStar: rating2,
      oneStar: rating1,
    };
    console.log("loggedIn Customer Dtls==> ", customerDtls);
    console.log("dtls of Vendor who have given reviews==> ", reviews);
    data = {
      customerDtls: customerDtls,
      reviews: reviews,
    };
    res.send({ data: data });
  } catch (error) {
    res.sendStatus(400);
  }
});
// get
// router.get("/customer", async (req, res) => {
//   const customerId = req.customer._id;
//   // finding 5,4,3,2,1 rating
//   data = await Review.aggregate([
//     {
//       $match: {
//         customerId,
//         reviewFor: "customer",
//       },
//     },
//     {
//       $lookup: {
//         from: "vendor",
//         localField: "vendorId",
//         foreignField: "_id",
//         as: "vendorDetails",
//       },
//     },
//   ]);
//   console.log("data===>", data);
//   let fiveStar = await Review.find({
//     customerId: customerId,
//     rating: "5",
//     reviewFor: "customer",
//   }).exec();
//   let fourStar = await Review.find({
//     customerId: customerId,
//     rating: "4",
//     reviewFor: "customer",
//   }).exec();
//   let threeStar = await Review.find({
//     customerId: customerId,
//     rating: "3",
//     reviewFor: "customer",
//   }).exec();
//   let twoStar = await Review.find({
//     customerId: customerId,
//     rating: "2",
//     reviewFor: "customer",
//   }).exec();
//   let oneStar = await Review.find({
//     customerId: customerId,
//     rating: "1",
//     reviewFor: "customer",
//   }).exec();
//   const customerDetails = [];

//   fiveStar.forEach(async (singleRating) => {
//     console.log(fiveStar);
//     singleCustomerDtls = {
//       pic: customerDtls,
//       rating: singleRating.rating,
//       comment: singleRating.comment,
//     };
//     customerDetails.push[singleCustomerDtls];
//   });
//   console.log(customerDetails);
//   fiveStar = fiveStar.length;
//   fourStar = fourStar.length;
//   threeStar = threeStar.length;
//   twoStar = twoStar.length;
//   oneStar = oneStar.length;

//   const totalRating = oneStar + twoStar + threeStar + fourStar + fiveStar;
//   let averageRating =
//     (1 * oneStar + 2 * twoStar + 3 * threeStar + 4 * fourStar + 5 * fiveStar) /
//     totalRating;
//   averageRating = averageRating.toFixed(1);
//   const address = req.customer.address[0];

//   const reviewDtls = {
//     averageRating: averageRating,
//     fiveStar: fiveStar,
//     fourStar: fourStar,
//     threeStar: threeStar,
//     twoStar: twoStar,
//     oneStar: oneStar,
//     totalRating: totalRating,
//     firstName: address.firstName,
//     lastName: address.lastName,
//     profileImage: req.customer.profileImage,
//   };
//   data.forEach((singleData)=>{
//     const singleImg= data.name,
//     const
//     singleData.comment
//   })
//   console.log(reviewDtls);
// });

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
  console.log(customerId, jobId);
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
