const express = require('express');
const router = express.Router();
const StaticFile = require('../../models/static_file');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

router.get('/', async function (req, res) {
  console.log('Got query:', req.query);

  if (req.query._id) {
    req.query._id = ObjectId(req.query._id);
  }

  try {
    // data = await Job.find(findQuery);

    data = await StaticFile.aggregate([
      {
        $match: req.query,
      },
    ]);

    res.send({ data: data });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
});

router.post('/', async function (req, res) {
  console.log('Got query:', req.query);
  console.log('Got body:', req.body);

  var { srNO, pageName, action } = req.body;

  var item = new StaticFile({ srNO, pageName, action });

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

router.delete('/', async function (req, res) {
  // console.log('Got query:', req.query);
  // console.log('Got body:', req.body);
  var _id = req.query._id;
  if (!_id) {
    res.send({ error: 'Please provide an id' });
  } else {
    //  remove eleemnt id id mongodb
    StaticFile.remove({ _id: _id })
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

router.put('/', async function (req, res) {
  console.log('Got query:', req.query);
  console.log('Got body:', req.body);
  var _id = req.query._id;
  if (!_id) {
    res.send({ error: 'Please provide an id' });
  } else {
    //  update element in mongodb put
    StaticFile.updateOne({ _id: _id }, { $set: req.body })
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
