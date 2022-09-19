const express = require("express");
const router = express.Router();
const Job = require("../../../../models/job");
const generate_otp = require("../../../../utils/generate_otp");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Customer = require("../../../../models/user_management/customer");
const socket = require("socket.io");
const server = require("../../../../../server");
const SubCategory = require("../../../../models/service_info/sub_category");
const Review = require("../../../../models/review");
const cron = require("node-cron");
module.exports = function (getIOInstance) {
  router.get("/", async function (req, res) {
    // sorting by date and filter by live ,completed, cancelled, date
    if (req.query.columnName) {
      delete req.query.columnName;
    }
    if (req.query.sort) {
      delete req.query.sort;
    }

    if (req.query._id) {
      req.query._id = ObjectId(req.query._id);
    }
    req.customer._id = ObjectId(req.customer._id);

    // convert req discount to number
    if (req.query.discount) {
      req.query.discount = Number(req.query.discount);
    }

    try {
      // data = await Job.find(findQuery);

      data = await Job.aggregate([
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
        // {
        //     $lookup: {
        //         from: 'categories ',
        //         localField: 'categoryId',
        //         foreignField: '_id',
        //         as: 'categoryDetails'
        //     }
        // },
        {
          $lookup: {
            from: "subcategories",
            localField: "subCategoryId",
            foreignField: "_id",
            as: "subcategoryDetails",
          },
        },
        // remove the job if status is rejected
        {
          $match: {
            $or: [{ status: { $ne: "rejected" } }],
          },
        },
        // rating of that job to customer
        {
          $lookup: {
            from: "reviews",
            localField: "_id",
            foreignField: "jobId",
            // start
            pipeline: [
              {
                $match: {
                  reviewFor: req.customer.type,
                },
              },
            ],
            as: "reviews",
          },
        },
        {
          $unwind: {
            path: "$reviews",
            preserveNullAndEmptyArrays: true,
          },
        },
        // add rating field and remove reviews
        {
          $addFields: {
            rating: "$reviews.rating",
          },
        },
        // remove reviews field
        {
          $project: {
            reviews: 0,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ]);
      // if loggedIn customer is vendor then hide otp field
      if (req.customer.type === "vendor") {
        data.otp = "";
      }

      res.send({ data: data });
    } catch (error) {
      console.log(error);
      res.status(400).send({ error: error });
    }
  });

  router.post("/", async function (req, res) {
    console.log("Got query:", req.query);
    console.log("Got body:", req.body);

    let _id = req.customer._id;
    let { subCategoryId, ScheduleTime, address, distance, vendorId } = req.body;

    if (!distance) {
      return res.status(400).send({ error: "distance is required" });
    }
    if (!address) {
      return res.status(400).send({ error: "address is required" });
    }
    if (!vendorId) {
      return res
        .status(400)
        .send({ error: "Please provide vendor id", field: "vendorId" });
    }

    // check vendor exist
    vendor_details = await Customer.findOne({ _id: vendorId });
    console.log("vendor", vendor_details);
    if (!vendor_details) {
      return res
        .status(400)
        .send({ error: "Vendor not found", field: "vendorId" });
    }

    // subCategoryId is id
    if (!mongoose.Types.ObjectId.isValid(req.body.subCategoryId)) {
      return res.status(400).send({
        error: "Please provide subCategory id",
        field: "subCategoryId",
      });
    }

    let otp = generate_otp(4);
    // find subCategory by SubCategoryId and get amount and name
    let subCategory = await SubCategory.findOne({
      _id: subCategoryId,
    });
    let subCategoryImg = "subCategory.subCategoryImage";
    let subCategoryName = "subCategory.name";
    // let toltalAmount = subCategory.price;
    // temporary hardcoded
    let totalAmount = "83";
    let finalAmount = "83";

    let item = new Job({
      subCategoryImg,
      totalAmount,
      finalAmount,
      subCategoryId,
      otp,
      customerId: _id,
      subCategoryName,
    });
    // socket to vendor
    console.log("customer id ====>", _id);
    // find all rating of vendorId calculate avg of this vendor
    let customerAvgRating = await Review.find({
      customerId: req.customer._id,
    }).then((data) => {
      let sum = 0;
      data.forEach((element) => {
        sum += element.rating;
      });
      return sum / data.length;
    });
    console.log("customerAvgRating", customerAvgRating);

    // find socket of this customer
    console.log("vendorId ====>", vendorId);
    let vendor = await Customer.findOne({ _id: vendorId });
    let vendorSocketId = vendor.socketId;
    console.log("vendorSocketId ====>", vendorSocketId);
    // socket data
    var socket_data = {
      type: "job_alert",
      data: {
        customerId: req.customer._id,
        vendorId: vendorId,
        Service: subCategoryName,
        customerName: `${req.customer.firstName} ${req.customer.lastName}`,
        avgRating: customerAvgRating.toFixed(2),
        address: address,
        distance: `${distance} km`,
      },
    };
    console.log("socket_data", socket_data);
    // need to send lat lon
    if (!ScheduleTime) {
      io.to(vendorSocketId).emit("job_alert", socket_data);
    }
    if (ScheduleTime) {
      // send socket to vendor at scheduled time
      let date = new Date(ScheduleTime);
      let time = date.getTime();
      console.log("time  ====>", time);
      // convert time to minutes
      let minutes = time / 1000 / 60;
      // schedule job at this time
      cron.schedule(`*/${minutes} * * * *`, async () => {
        io.to(vendorSocketId).emit("job_alert", socket_data);
      });
    }
    // socket to vendor
    item
      .save(item)
      .then(function (item) {
        console.log(item);
        res.status(200).send({ data: item });
      })
      .catch((error) => {
        //error handle
        console.log(error);
        res.status(400).send({ error: error });
      });
  });

  router.delete("/", async function (req, res) {
    console.log("Got query:", req.query);
    console.log("Got body:", req.body);

    var _id = req.query._id;
    if (!_id) {
      res.status(400).send({ error: "Please provide an id", field: "_id" });
    } else {
      //  remove eleemnt id id mongodb
      Job.deleteOne({
        _id: _id,
        $or: [{ customerId: req.customer._id }, { vendorId: req.customer._id }],
      })
        .then(function (item) {
          return res.status(200).json({ data: item });
        })
        .catch((error) => {
          //error handle
          console.log(error);
          res.status(400).send({ error: error });
        });
    }
  });

  router.put("/", async function (req, res) {
    console.log("Got query:", req.query);
    console.log("Got body:", req.body);
    let _id = req.query.id;

    if (!_id) {
      res.status(400).send({ error: "Please provide an id", field: "id" });
    } else {
      //  update element in mongodb put
      req.customer._id = ObjectId(req.customer._id);

      let { subCategoryId, vendorId, ScheduleTime, address, discount } =
        req.body;

      Job.findOneAndUpdate(
        {
          _id: _id,
          $or: [
            { customerId: req.customer._id },
            { vendorId: req.customer._id },
          ],
        },
        { $set: { subCategoryId, vendorId, ScheduleTime, address, discount } },
        { returnOriginal: false, upsert: true }
      )
        .then(function (item) {
          // res.sendStatus(200);
          return res.status(200).json({ data: item });
        })
        .catch((error) => {
          //error handle
          console.log(error);
          res.status(400).send({ error: error });
        });
    }
  });

  router.put("/acceptjob", async function (req, res) {
    console.log("Got query:", req.query);
    console.log("Got body:", req.body);
    let _id = req.query.id;

    if (!_id) {
      return res
        .status(400)
        .send({ error: "Please provide an job id", field: "id" });
    }

    //check customer type vendor
    if (req.customer.type != "vendor") {
      return res.status(400).send({ error: "You are not a vendor" });
    }

    // check job.schedule exist
    let job = await Job.findOne({
      _id: _id,
    });
    //  if job is not exist
    if (!job) {
      return res.status(400).send({ error: "Job not found" });
    }

    // if job.schedule exist can not accept job before schedule time
    if (job?.ScheduleTime) {
      // check job.schedule is past
      let date = new Date(job.ScheduleTime);
      let time = date.getTime();
      let currentTime = new Date().getTime();
      if (currentTime < time) {
        return res.status(400).send({ error: "Job is not scheduled yet" });
      }
    }
    // can accept job 3min after job.schedule time
    if (job?.ScheduleTime) {
      // check job.schedule is past
      let date = new Date(job.ScheduleTime);
      let time = date.getTime();
      let currentTime = new Date().getTime();
      //  not allow to accept job after 3min of job.schedule time
      if (currentTime > time + 180000) {
        return res.status(400).send({ error: "Job is expired" });
      }
    }
    console.log("job =====>", job);

    if (!job?.scheduleTime) {
      // can't accept job after 3min of job created at
      console.log("job =====>", job);

      let date = new Date(job.createdAt);
      let time = date.getTime();
      let currentTime = new Date().getTime();
      //  not allow to accept job after 3min of job created at
      if (currentTime > time + 180000) {
        return res.status(400).send({ error: "Job is expired" });
      }
    }

    let customerId = Job.findOne({ _id: _id }).customerId;
    // find socket of this customer
    customerSocketId = Customer.findOne({ _id: customerId }).socketId;
    // send socket request to this customer
    if (customerSocketId) {
      var socket_data = {
        type: "accept",
        data: {
          customerId: customerId,
          vendorId: req.customer._id,
          _id: _id,
        },
      };
      console.log("socket_data", socket_data);
      io.to(customerSocketId).emit("accept", socket_data);
    }

    // keep sending current lat , lon to customer after every 2sec
    let customer = await Customer.findOne({ _id: customerId });
    let vendor = await Vendor.findOne({ _id: vendorId });

    io.on("sendLocation", async (data) => {
      console.log("data", data);
      // 1. lat
      // 2. lon
      // 3. jobId
      // find job by jobId
      const job = await Job.findOne({ _id: data.jobId });
      const customer = await Customer.findOne({ _id: job.customerId });
      const customerSocketId = customer.socketId;
      // send lat lon to vendor
      io.broadcast.to(customerSocketId).emit("sendLocation", data);
      // socket.broadcast.to(socketid).emit("message", "for your eyes only");
    });

    Job.findOneAndUpdate(
      { _id: _id, vendorId: req.customer._id },
      { $set: { status: "upcoming" } },
      { returnOriginal: false, upsert: true }
    )
      .then(function (item) {
        // res.sendStatus(200);
        return res.status(200).json({ data: item });
      })
      .catch((error) => {
        //error handle
        console.log(error);
        res.status(400).send({ error: error });
      });
  });

  router.put("/rejectjob", async function (req, res) {
    console.log("Got query:", req.query);
    console.log("Got body:", req.body);
    let _id = req.query.id;

    let rejectType = "customer";
    if ((req.customer.type = "vendor")) {
      rejectType = "vendor";
    }

    if (!_id) {
      return res
        .status(400)
        .send({ error: "Please provide an id", field: "id" });
    }
    //  update element in mongodb put
    req.customer._id = ObjectId(req.customer._id);

    let { rejectReason } = req.body;
    if (rejectType == "vendor") {
      // socket start
      let job = Job.findOne({ _id: _id });
      let customerId = job.customerId;
      // find socket of this customer
      let customer = Customer.findOne({ _id: customerId });
      let customerSocketId = customer.socketId;

      // send socket request to this customer
      if (customerSocketId) {
        var socket_data = {
          type: "reject",
          data: {
            customerId: customerId,
            vendorId: req.customer._id,
            _id: _id,
          },
        };
        console.log("socket_data", socket_data);
        io.to(customerSocketId).emit("reject", socket_data);
      }
      // socket end
    }
    if (rejectType == "customer") {
      // socket start
      let job = await Job.findOne({ _id: _id });
      let vendorId = job.vendorId;

      // find socket of this customer
      let vendor = await Customer.findOne({ _id: vendorId });
      let vendorSocketId = vendor.socketId;
      // send socket request to this customer
      if (vendorSocketId) {
        var socket_data = {
          type: "reject",
          data: {
            customerId: req.customer._id,
            vendorId: vendorId,
            _id: _id,
          },
        };
        console.log("socket_data", socket_data);
        io.to(vendorSocketId).emit("reject", socket_data);
      }
      // socket end
    }

    Job.findOneAndUpdate(
      {
        _id: _id,
        $or: [{ customerId: req.customer._id }, { vendorId: req.customer._id }],
      },
      { $set: { status: "cancelled", rejectType, rejectReason } },
      { returnOriginal: false, upsert: true }
    )
      .then(function (item) {
        // return new data not ack, and upsert true

        return res.status(200).json({ data: item });
        console.log("reject job  ===>", item);
        // res.sendStatus(200);
      })
      .catch((error) => {
        //error handle
        console.log(error);
        res.status(400).send({ error: error });
      });
  });
  router.post("/verify_otp", (req, res) => {
    console.log("Got query:", req.query);
    console.log("Got body:", req.body);

    if (req.user.loginType != "user") {
      return res.status(400).send("Invalid login type");
    }
    if (!req.user._id) {
      return res.status(400).send("Unable to get id from token please relogin");
    }

    var _id = req.query._id;
    var otp = req.body.otp;

    if (!_id) {
      return res.send({ error: "Please provide an id of the job in params" });
    }
    if (!otp) {
      return res.send({ error: "Please provide an otp in body" });
    }

    req.user._id = ObjectId(req.user._id);

    Job.findOne({
      _id: _id,
      $or: [{ customerId: req.user._id }, { vendorId: req.user._id }],
    })
      .then(function (item) {
        if (item.otp == otp) {
          // send socket request to custome to make payment
          let job = Job.findOne({ _id: _id });
          let customerId = job.customerId;
          // find socket of this customer
          let customer = Customer.findOne({ _id: customerId });
          let customerSocketId = customer.socketId;
          // send socket request to this customer
          if (customerSocketId) {
            var socket_data = {
              type: "payment",
              data: {
                customerId: customerId,
                vendorId: req.user._id,
                _id: _id,
              },
            };
            console.log("socket_data", socket_data);
            io.to(customerSocketId).emit("payment", socket_data);
          }
          // socket end

          Job.findOneAndUpdate(
            {
              _id: _id,
              $or: [{ customerId: req.user._id }, { vendorId: req.user._id }],
            },
            { $set: { status: "complete" } },
            { returnOriginal: false, upsert: true }
          )
            .then(function (item) {
              // res.sendStatus(200);
              return res.status(200).json({ data: item });
            })
            .catch((error) => {
              //error handle
              console.log(error);
              res.sendStatus(400);
            });
        } else {
          res.status(400).send({ error: "Invalid otp" });
        }
      })
      .catch((error) => {
        //error handle
        console.log(error);
        res.status(400).send({ error: error });
      });
  });

  return router;
};
