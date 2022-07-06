const express = require("express");
const router = express.Router();
const Customer = require("../../../../models/user_management/customer");
const fs = require("fs");
const upload = require("../../../../middleware/multer");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const SubCategory = require("../../../../models/service_info/sub_category");

// function to calculate distance between two points in km's in javascript
//This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // km
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

// Converts numeric degrees to radians
function toRad(Value) {
  return (Value * Math.PI) / 180;
}

router.get("/", async (req, res) => {
  console.log("Got query:", req.query);
  console.log("below is your columnName and columnValue");

  let { columnName, sort, lat, lng } = req.query;
  // delete lat and lng from query
  delete req.query.lat;
  delete req.query.lng;
  if (columnName === "distance") {
    columnName = "nearestDistance";
  }

  console.log("Got columnName:", columnName);
  if (sort) {
    sort = parseInt(sort);
  }
  if (columnName === "" || columnName === undefined || columnName === null) {
    columnName = "createdAt";
  }
  if (sort === "" || sort === undefined || sort === null) {
    sort = -1;
  }

  // delete after taking value of col and sort from query
  if (req.query.columnName) {
    delete req.query.columnName;
  }
  if (req.query.sort) {
    delete req.query.sort;
  }
  if (req.query.online) {
    var online = req.query.online;
    if (online != "true" && online != "false") {
      return res.status(400).send({ error: "online must be bool true/false" });
    }
    if (online == "true") {
      req.query.online = true;
    } else {
      req.query.online = false;
    }
  }

  console.log("Got query:", req.query);
  const sortMethod = {
    columnName: sort,
  };

  console.log("sorting method ===>", columnName, sort);

  console.log("sortMethod =====>", sortMethod);
  try {
    if (req.query.jobSkillId) {
      req.query.jobSkills = { $in: [ObjectId(req.query.jobSkillId)] };
      delete req.query.jobSkillId;
    }

    if (req.query._id) {
      req.query._id = ObjectId(req.query._id);
    }

    data = await Customer.aggregate([
      {
        $match: { ...req.query, type: "vendor" },
      },
      {
        $lookup: {
          from: "jobs",
          localField: "_id",
          foreignField: "customerId",
          as: "jobDetails",
        },
      },
      {
        $addFields: { noOfJobs: { $size: "$jobDetails" } },
      },
      {
        $addFields: {
          noOfCompletedService: {
            $size: {
              $filter: {
                input: "$jobDetails",
                as: "job",
                cond: { $eq: ["$$job.status", "completed"] },
              },
            },
          },
        },
      },
      {
        $addFields: {
          noOfCancelledService: {
            $size: {
              $filter: {
                input: "$jobDetails",
                as: "job",
                cond: { $eq: ["$$job.status", "cancelled"] },
              },
            },
          },
        },
      },
      {
        $project: { jobDetails: 0, reviewDetails: 0, token: 0 },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "vendorId",
          as: "reviewDetails",
        },
      },
      // run for loop and return reviewDetails rating field
      {
        $addFields: {
          AllRating: {
            $map: {
              input: "$reviewDetails",
              as: "review",
              in: {
                rating: "$$review.rating",
              },
            },
          },
        },
      },
      // loop over allrating.rating and calculate average rating
      {
        $addFields: {
          avgRating: {
            $avg: "$AllRating.rating",
          },
        },
      },
      // show average rating upto 2 decimal place
      {
        $addFields: {
          avgRating: {
            $round: ["$avgRating", 2],
          },
        },
      },
      // if avgRating is null then set it to 0
      {
        $sort: sortMethod,
      },
    ]);
    console.log("sorting method ===>", columnName, sort);

    // console.log('Got data:', data);

    // for (let index = 0; index < data.length; index++) {
    //     // const element = array[index];
    //     let jobSkills = [];
    //     console.log('data.jobSkills', data[index].jobSkills);
    //     if (data[index].jobSkills && data[index].jobSkills.length > 0) {
    //         data[index].jobSkills.forEach(element => {
    //             //  check for Active
    //             if (element.status == 'Active') {
    //                 jobSkills.push(element.categoryName);
    //             }
    //         });
    //     }
    //     // console.log('jobSkills', jobSkills);
    //     data[index].jobSkills = jobSkills;

    // }

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
    // if customer send his lat lng in query then calculate distance from customer to vendor
    if (lat && lng) {
      for (let i = 0; i < data.length; i++) {
        console.log(data[i].address);
        data[i].address.forEach((singleAddrress) => {
          console.log("singleAddress===>", singleAddrress);
          //  return the address which is nearest to customer
          if (singleAddrress.lat && singleAddrress.lng) {
            let distance = getDistanceFromLatLonInKm(
              lat,
              lng,
              singleAddrress.lat,
              singleAddrress.lng
            );
            console.log("distance =====>", distance);
            data[i].distance = distance;

            // add distance field in each address
            // return distance in km as whole number
            singleAddrress.distance = Math.round(distance);
            // return the address which is nearest to customer
          }
        });
      }

      for (let i = 0; i < data.length; i++) {
        let nearestAddress = data[i].address.reduce((acc, curr) => {
          return acc.distance < curr.distance ? acc : curr;
        });
        // add nearest address field in each vendor
        data[i].nearestAddress = nearestAddress;
        data[i].nearestDistance = nearestAddress.distance;
        delete nearestAddress.distance;
        // sort by nearest distance
        data.sort((a, b) => {
          return a.nearestDistance - b.nearestDistance;
        });
      }
    }

    res.send({ data: data });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error });
  }
});

module.exports = router;
