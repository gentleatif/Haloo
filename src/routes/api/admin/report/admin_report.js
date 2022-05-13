const express = require('express');
const router = express.Router();
const fs = require('fs');
const AdminReport = require('../../../../models/report/admin_report');


router.get('/', async (req, res) => {
  console.log('Got query:', req.query);

  try {
    limit = req.query.limit ? parseInt(req.query.limit) : 100;
    
    // find using start date and end date
    if (req.query.startDate && req.query.endDate) {
        startDate = new Date(req.query.startDate);
        endDate = new Date(req.query.endDate);
        console.log(startDate, endDate);
        const data = await AdminReport.find({
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        }).limit(limit);
        res.status(200).json(data);
    }
    // find using start date
    else if (req.query.startDate) {
        console.log(req.query.startDate);
        startDate = new Date(req.query.startDate);
        console.log(startDate);
        const data = await AdminReport.find({
            createdAt: {
                $gte: startDate
            }
        }).limit(limit);
        res.status(200).json(data);
    }
    // find using end date
    else if (req.query.endDate) {
        endDate = new Date(req.query.endDate);
        console.log(endDate);
        const data = await AdminReport.find({
            createdAt: {
                $lte: endDate
            }
        }).limit(limit);
        res.status(200).json(data);
    }
    // find all
    else {
        const data = await AdminReport.find().limit(limit);
        res.status(200).json(data);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: 'server error occur' });
  }
});



router.delete('/', async function (req, res) {
  // console.log('Got query:', req.query);
  // console.log('Got body:', req.body);
  var _id = req.query._id;
  if (!_id) {
    res.send({ error: 'Please provide an id' });
  } else {
    //  remove eleemnt id id mongodb
    AdminReport.findOneAndDelete({
      _id: _id,
    })
      .then(function (item) {
        res.sendStatus(200);
      })
      .catch((error) => {
        //error handle
        console.log(error);
        res.status(400).send({ error: 'server error occur' });
      });
  }
});


module.exports = router;
