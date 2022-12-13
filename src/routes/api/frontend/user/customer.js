const express = require("express");
const router = express.Router();
const Customer = require("../../../../models/user_management/customer");
const State = require("../../../../models/service_info/state");
const City = require("../../../../models/service_info/city");
const fs = require("fs");
const upload = require("../../../../middleware/multer").single("profileImage");
const uploadMultiple = require("../../../../middleware/multer").fields([
  { name: "certificateImage", maxCount: 1 },
  { name: "addressProofImage", maxCount: 1 },
]);
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const multer = require("multer");
const Cloudinary = require("../../../../utils/upload");

router.get("/", async (req, res) => {
  // console.log(...req.query);
  console.log("user details", req.user);
  console.log("Got query:", req.query);
  if (!req.customer._id) {
    return res
      .status(400)
      .send({ error: "Unable to get id from token please relogin" });
  }

  if (req.customer._id) {
    req.customer._id = ObjectId(req.customer._id);
  }
  try {
    // data = await Customer.find(findQuery);
    data = await Customer.aggregate([
      {
        $match: { ...req.query, _id: req.customer._id },
      },
      {
        $lookup: {
          from: "jobs",
          localField: "customerId",
          foreignField: "_id",
          as: "jobDetails",
        },
      },
      // {
      //     $lookup: {
      //         from: 'states',
      //         localField: 'stateId',
      //         foreignField: '_id',
      //         as: 'stateDetails'
      //     }
      // },
      // {
      //     $lookup: {
      //         from: 'cities',
      //         localField: 'cityId',
      //         foreignField: '_id',
      //         as: 'cityDetails'
      //     }
      // },
      {
        $lookup: {
          from: "subcategories",
          localField: "jobSkills",
          foreignField: "_id",
          as: "jobSkills",
        },
      },
      {
        $lookup: {
          from: "reviews",
          let: { cId: "$_id" },

          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$" + req.query.type + "Id", { $toObjectId: "$$cId" }],
                },
                reviewFor: req.query.type,
              },
            },
            { $group: { _id: null, avg: { $avg: "$rating" } } },
          ],
          as: "reviewDetails",
        },
      },
      {
        $addFields: { noOfJobs: { $size: "$jobDetails" } },
      },
      {
        $project: {
          jobDetails: 0,
          reviewDetails: 0,
          token: 0,
          otp: 0,
          otpExpiry: 0,
          createdAt: 0,
          updatedAt: 0,
        },
      },
    ]);

    // let jobSkills = [];
    // console.log('data.jobSkills', data[0].jobSkills);
    // if(data[0].jobSkills && data[0].jobSkills.length > 0){
    //     data[0].jobSkills.forEach(element => {
    //         //  check for Active
    //         if(element.status == 'active'){
    //             jobSkills.push(element.categoryName);
    //         }
    //     });
    // }
    // console.log('jobSkills', jobSkills);
    // data[0].jobSkills = jobSkills;

    // convert stateDetails array to json
    if (data[0].stateDetails && data[0].stateDetails.length > 0) {
      data[0].stateDetails = data[0].stateDetails[0];
    }

    // convert cityDetails array to json
    if (data[0].cityDetails && data[0].cityDetails.length > 0) {
      data[0].cityDetails = data[0].cityDetails[0];
    }

    // forloop in customer check for profile image exist from path
    for (let i = 0; i < data.length; i++) {
      if (data[i].profileImage) {
        // check if file exist
        if (fs.existsSync(data[i].profileImage)) {
          data[i].profileImage = data[i].profileImage;
        } else {
          data[i].profileImage = null;
        }
      }
    }

    if (data.length) {
      return res.status(200).send({ data: data[0] });
    }
    res.status.apply(200).send({ data: data });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error });
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
        .send({ error: err.message, field: "profileImage" });
      //   return res.status(400).send({error: 'Only .png, .jpg and .jpeg format allowed with maxsize 1Mb!', field: 'profileImage'});
    } else if (err) {
      // An unknown error occurred when uploading.
      console.log("A Multer error occurred when uploading.");
      console.log("err", err);
      return res
        .status(400)
        .send({ error: err.message, field: "profileImage" });
      //   return res.status(400).send({error: 'Only .png, .jpg and .jpeg format allowed with maxsize 1Mb!', field: 'profileImage'});
    }

    console.log("user details", req.user);
    let _id = req.customer._id;
    let customer = req.customer;

    console.log(req.file);
    console.log("Got query:", req.query);
    console.log("Got body:", req.body);

    // check type
    if (req.body.type) {
      let type = req.body.type;
      if (type != "customer" && type != "vendor") {
        return res
          .status(400)
          .send({ error: "Invalid type (customer/vendor)", field: "type" });
      }
    }

    // check online
    if (req.body.online) {
      console.log("online", req.body.online);
      if (req.body.online !== "false" && req.body.online !== "true") {
        return res
          .status(400)
          .send({ error: "Invalid online (true/false)", field: "online" });
      }
    }

    // check jobskills
    console.log("req.body.jobSkills", req.body.jobSkills);
    if (req.body.jobSkills) {
      var jobSkills = req.body.jobSkills;
      if (!Array.isArray(jobSkills)) {
        return res
          .status(400)
          .send({ error: "Invalid jobSkills (array)", field: "jobSkills" });
      }
      // check jobSkills contain type mongodbId
      console.log("jobSkills", jobSkills);
      for (var i = 0; i < jobSkills.length; i++) {
        if (!mongoose.Types.ObjectId.isValid(jobSkills[i])) {
          return res.status(400).send({
            error: "Invalid jobSkills (mongodbId)",
            field: "jobSkills",
          });
        }
      }
    }

    // if(req.body.phone){
    //     let customer = await Customer.findOne({phone: req.body.phone, _id: {$ne: _id}});
    //     if(customer){
    //         return res.status(400).send({error:'Phone already exists', field:'phone'});
    //     }
    // }

    // if (req.body.stateId && !ObjectId.isValid(req.body.stateId)) {
    //     return res.status(400).send({ error: 'Invalid stateId', field: 'stateId' });
    // }

    // cityId validate
    // if (req.body.cityId && !ObjectId.isValid(req.body.cityId)) {
    //     return res.status(400).send({ error: 'Invalid cityId', field: 'cityId' });
    // }

    let profileImages;
    console.log(req.file);
    if (req.file) {
      // req.body.profileImage =
      //   "uploads/images/profileImage/" + req.file.filename;

      if (req.customer.profileImage) {
        // fs.unlink(req.customer.profileImage, (err) => {
        //   if (err) {
        //     console.log(err);
        //   }
        //   console.log({ data: "successfully deleted profileImage" });
        // });
      }
      profileImages = await Cloudinary(req.file.path);
      console.log("profileImages", profileImages);
      req.body.profileImage = profileImages;
    }

    //validate emailAddress
    if (req.body.emailAddress) {
      let emailAddress = req.body.emailAddress;
      let emailAddressRegex =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (!emailAddressRegex.test(emailAddress)) {
        return res
          .status(400)
          .send({ error: "Invalid emailAddress", field: "emailAddress" });
      }
    }

    let update_query = {};
    if (
      req.body.customerName &&
      req.body.customerName !== customer.customerName
    ) {
      update_query.customerName = req.body.customerName;
    }

    // if(req.body.phone && req.body.phone != data.phone){
    //     update_query.phone = req.body.phone;
    // }

    if (req.body.type && req.body.type !== customer.type) {
      update_query.type = req.body.type;
    }

    if (req.body.online && req.body.online !== customer.online) {
      update_query.online = req.body.online;
    }

    if (req.body.jobSkills && req.body.jobSkills !== customer.jobSkills) {
      update_query.jobSkills = req.body.jobSkills;
    }

    // if(req.body.pincode && req.body.pincode != data.pincode){
    //     update_query.pincode = req.body.pincode;
    // }

    if (req.body.profileImage) {
      update_query.profileImage = req.body.profileImage;
      console.log("profileImage", update_query.profileImage);
      // profileImages = await Cloudinary(req.file.path);
    }

    // if(req.body.address && req.body.address != data.address){
    //     update_query.address = req.body.address;
    // }

    // if(req.body.city && req.body.city != data.city){
    //     update_query.city = req.body.city;
    // }
    //
    // if(req.body.state && req.body.state != data.state){
    //     update_query.state = req.body.state;
    // }

    if (req.body.companyName && req.body.companyName !== customer.companyName) {
      update_query.companyName = req.body.companyName;
    }

    if (req.body.firstName && req.body.firstName !== customer.firstName) {
      update_query.firstName = req.body.firstName;
    }

    if (req.body.lastName && req.body.lastName !== customer.lastName) {
      update_query.lastName = req.body.lastName;
    }

    if (
      req.body.emailAddress &&
      req.body.emailAddress !== customer.emailAddress
    ) {
      update_query.emailAddress = req.body.emailAddress;
    }

    if (req.body.formStep && req.body.formStep !== customer.formStep) {
      update_query.formStep = req.body.formStep;
    }

    if (
      req.body.completedProfile &&
      req.body.completedProfile !== customer.completedProfile
    ) {
      update_query.completedProfile = req.body.completedProfile;
    }
    //  update element in mongodb put
    Customer.findOneAndUpdate(
      { _id: _id },
      { $set: update_query },
      { returnOriginal: false, upsert: true }
    )
      .then((item) => {
        return res.status(200).send({ data: item });
      })
      .catch((error) => {
        //error handle
        console.log(error);
        return res.status(400).send({ error: error });
      });
    // }
  });
});

// route to upload address proof and certificate proof image multter
router.put("/upload-image", (req, res) => {
  console.log("upload-image", req.body);
  uploadMultiple(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      console.log("A Multer error occurred when uploading.");
      console.log(err);
      return res
        .status(400)
        .send({ error: err.message, field: "profileImage" });
      //   return res.status(400).send({error: 'Only .png, .jpg and .jpeg format allowed with maxsize 1Mb!', field: 'profileImage'});
    } else if (err) {
      // An unknown error occurred when uploading.
      console.log("A Multer error occurred when uploading.");
      console.log("err", err);
      return res
        .status(400)
        .send({ error: err.message, field: "profileImage" });
      //   return res.status(400).send({error: 'Only .png, .jpg and .jpeg format allowed with maxsize 1Mb!', field: 'profileImage'});
    }

    console.log("user details", req.user);
    let _id = req.customer._id;
    let customer = req.customer;

    console.log(req.file);
    console.log("Got query:", req.query);
    console.log("Got body:", req.body);

    let update_query = {};

    if (req.body.formStep && req.body.formStep !== customer.formStep) {
      update_query.formStep = req.body.formStep;
    }

    if (
      req.body.completedProfile &&
      req.body.completedProfile !== customer.completedProfile
    ) {
      update_query.completedProfile = req.body.completedProfile;
    }

    console.log(req.files);
    // if (req.file && req.file.length > 0) {
    //     req.body.profileImage = 'uploads/images/profileImage/' + req.file.filename;
    // }
    // log file name from field

    if (req.files && req.files.addressProofImage) {
      // update_query.addressProofImage =
      //   "uploads/images/addressProofImage/" +
      //   req.files.addressProofImage[0].filename;

      //    delete old file
      // if (req.customer.addressProofImage) {
      //   fs.unlink(req.customer.addressProofImage, (err) => {
      //     if (err) {
      //       console.log(err);
      //     }
      //     console.log({ data: "successfully deleted addressProofImage" });
      //   });
      // }
      update_query.addressProofImage = await Cloudinary(
        req.files.addressProofImage[0].path
      );
    }

    if (req.files && req.files.certificateImage) {
      console.log("certificateImage", req.files.certificateImage);
      // update_query.certificateImage =
      //   "uploads/images/certificateProofImage/" +
      //   req.files.certificateImage[0].filename;

      //    delete old file
      // if (req.customer.certificateProofImage) {
      //   fs.unlink(req.customer.certificateProofImage, (err) => {
      //     if (err) {
      //       console.log(err);
      //     }
      //     console.log({ data: "successfully deleted certificateProofImage" });
      //   });
      // }
      update_query.certificateImage = await Cloudinary(
        req.files.certificateImage[0].path
      );
    }

    //    save to mongodb
    Customer.findOneAndUpdate(
      { _id: _id },
      { $set: update_query },
      { returnOriginal: false, upsert: true }
    )
      .then((item) => {
        return res.status(200).send({ data: item });
      })
      .catch((error) => {
        //error handle
        console.log(error);
        return res.status(400).send({ error: error });
      });
  });
});

router.put("/addaddress", async function (req, res) {
  console.log("user details add address  ===>", req.customer);
  let _id = req.customer._id;

  console.log("Got query:", req.query);
  console.log("Got body:", req.body);

  //first name
  // if (!req.body.firstName) {
  //   return res
  //     .status(400)
  //     .send({ error: "firstName is required", field: "firstName" });
  // }

  // //last name
  // if (!req.body.lastName) {
  //   return res
  //     .status(400)
  //     .send({ error: "lastName is required", field: "lastName" });
  // }

  // blockNo
  if (!req.body.blockNo) {
    return res
      .status(400)
      .send({ error: "blockNo is required", field: "blockNo" });
  }

  // apartment
  if (!req.body.apartment) {
    return res
      .status(400)
      .send({ error: "apartment is required", field: "apartment" });
  }

  //

  if (req.body.pincode) {
    let pincode = req.body.pincode;
    console.log("pincode", pincode);
    let pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincode)) {
      return res
        .status(400)
        .send({ error: "Invalid pincode", field: "pincode" });
    }
  } else {
    return res
      .status(400)
      .send({ error: "pincode is required", field: "pincode" });
  }

  // city
  if (!req.body.cityId) {
    return res.status(400).send({ error: "cityId is required", field: "city" });
  }
  if (!req.body.stateId) {
    return res
      .status(400)
      .send({ error: "stateId is required", field: "state" });
  }
  // check if cityId is ObjectId or not
  if (!mongoose.Types.ObjectId.isValid(req.body.cityId)) {
    return res.status(400).send({ error: "Invalid cityId", field: "cityId" });
  }
  // check if stateId is ObjectId or not
  if (!mongoose.Types.ObjectId.isValid(req.body.stateId)) {
    return res.status(400).send({ error: "Invalid stateId", field: "stateId" });
  }

  // check if cityId and stateId is valid\
  if (req.body.cityId) {
    let city = await City.findOne({ _id: req.body.cityId });
    if (!city) {
      return res.status(400).send({ error: "City Not Exist ", field: "city" });
    }
  }
  if (req.body.stateId) {
    let state = await State.findOne({ _id: req.body.stateId });
    if (!state) {
      return res
        .status(400)
        .send({ error: "State Not Exist ", field: "state" });
    }
  }

  // let city = await City.findOne({ _id: req.body.cityId });
  // if (!city) {
  //   return res.status(400).send({ error: "Invalid cityId", field: "city" });
  // }
  // let state = await State.findOne({ _id: req.body.stateId });
  // if (!state) {
  //   return res.status(400).send({ error: "Invalid stateId", field: "state" });
  // }

  // state
  // if (!req.body.state) {
  //   return res.status(400).send({ error: "state is required", field: "state" });
  // }
  // if (!req.body.stateId) {
  //   return res
  //     .status(400)
  //     .send({ error: "stateId is required", field: "stateId" });
  // }

  // if (!req.body.cityId) {
  //   return res
  //     .status(400)
  //     .send({ error: "cityId is required", field: "cityId" });
  // }
  if (!req.body.lat) {
    return res.status(400).send({ error: "lat is required", field: "lat" });
  }
  if (!req.body.lng) {
    return res.status(400).send({ error: "lng is required", field: "lng" });
  }
  let {
    firstName,
    lastName,
    blockNo,
    apartment,
    nearbyLandmark,
    pincode,
    cityId,
    stateId,
    addressType,
    completedProfile,
    formStep,
    lat,
    lng,
  } = req.body;

  let newObject = {
    firstName,
    lastName,
    blockNo,
    apartment,
    nearbyLandmark,
    pincode,
    cityId,
    stateId,
    addressType,
    lat,
    lng,
  };

  // update formStep completedProfile in mongodb
  Customer.findOneAndUpdate(
    { _id: _id },
    { $push: { address: newObject }, $set: { formStep, completedProfile } },
    { returnOriginal: false, upsert: true }
  )
    .then((item) => {
      return res.status(200).send({ data: item });
    })
    .catch((error) => {
      //error handle
      console.log(error);
      return res.status(400).send({ error: error });
    });
});

//update address
router.put("/updateaddress", async function (req, res) {
  console.log("user details", req.customer);
  let _id = req.customer._id;
  console.log("Got query:", req.query);
  console.log("Got body updateaddress route hit:", req.body);

  // validate Object id in req.query
  if (
    !req.query.addressId ||
    !mongoose.Types.ObjectId.isValid(req.query.addressId)
  ) {
    return res
      .status(400)
      .send({ error: "Invalid addressId", field: "addressId" });
  }

  let updateObj = { $set: {} };
  for (let param in req.body) {
    if (
      param === "firstName" ||
      param === "lastName" ||
      param === "blockNo" ||
      param === "apartment" ||
      param === "nearbyLandmark" ||
      param === "pincode" ||
      param === "cityId" ||
      param === "stateId" ||
      param === "addressType"
    ) {
      updateObj.$set["address.$." + param] = req.body[param];
    }
  }

  console.log("updateObj", updateObj);

  let { completedProfile, formStep } = req.body;

  // update array element
  Customer.findOneAndUpdate(
    { _id: _id, "address._id": req.query.addressId },
    {
      ...updateObj,
      $set: { formStep, completedProfile },
    },
    { returnOriginal: false, upsert: true }
  )
    .then((item) => {
      console.log("update address===>", item);
      return res.status(200).send({ data: item });
    })
    .catch((error) => {
      //error handle
      console.log(error);
      return res.status(400).send({ error: error });
    });
});

router.delete("/deleteaddress", async function (req, res) {
  console.log("user details", req.customer);
  let _id = req.customer._id;

  //    verify id
  if (!req.body.addressId) {
    return res
      .status(400)
      .send({ error: "addressId is required", field: "addressId" });
  }

  //    delete address
  Customer.findOneAndUpdate(
    { _id: _id },
    { $pull: { address: { _id: req.body.addressId } } },
    { returnOriginal: false, upsert: true }
  )
    .then((item) => {
      return res.status(200).send({ data: item });
    })
    .catch((error) => {
      //error handle
      console.log(error);
      return res.status(400).send({ error: error });
    });
});

router.delete("/deleteuser", async function (req, res) {
  console.log("user details", req.customer);
  console.log("user details", req.customer);
  let _id = req.customer._id;

  Customer.deleteOne({
    _id: _id
  })
    .then(function (item) {
      return res.status(200).json({ data: "user deleted successfully" });
    })
    .catch((error) => {
      //error handle
      console.log(error);
      res.status(400).send({ error: error });
    });
});

module.exports = router;
