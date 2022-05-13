const express = require('express');
const router = express.Router();
const City = require('../../../../models/service_info/city');
const State = require('../../../../models/service_info/state');
const ObjectId = require('mongoose').Types.ObjectId;

router.get('/', async (req, res) => {
  console.log('Got query:', req.query);

  if (req.query._id) {
    req.query._id = ObjectId(req.query._id);
  }
  if (req.query.stateId) {
    req.query.stateId = ObjectId(req.query.stateId);
  }

  try {
    // data = await City.find(findQuery);
    data = await City.aggregate([
      {
        $match: req.query,
      },
      {
        $lookup: {
          from: 'states',
          localField: 'stateId',
          foreignField: '_id',
          as: 'stateDetails',
        },
      },
    ]);
    res.send({ data: data });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
});

router.post('/', async (req, res) => {
  console.log('Got query sad:', req.query);
  console.log('Got body dsa:', req.body);
  const { cityName, stateId, status } = req.body;

  // check null
  if (!cityName) {
    return res
      .status(400)
      .send({ error: 'Invalid cityName', field: 'cityName' });
  }
  // check stateId is mongodb
  if (!stateId || !ObjectId.isValid(stateId)) {
    return res.status(400).send({ error: 'Invalid stateId', field: 'stateId' });
  }

  // check state with id exist
  let checkState = await State.findById(stateId);
  console.log('checkState', checkState);
  if (!checkState) {
    return res
      .status(400)
      .send({ error: 'State with id not exist', field: 'stateId' });
  }

  // check if city name already exist
  let checkCity = await City.findOne({ cityName: cityName });
  if (checkCity) {
    return res
      .status(400)
      .send({ error: 'City already exist', field: 'cityName' });
  }

  var item = new City({ cityName, stateId, status });

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
    City.remove({ _id: _id })
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
    if (req.body.cityName) {
      let cityName = req.body.cityName;

      let checkCity = await City.findOne({
        cityName: cityName,
        _id: { $ne: _id },
      });
      if (checkCity) {
        return res
          .status(400)
          .send({ error: 'City already exist', field: 'cityName' });
      }
    }

    if (req.body.stateId) {
      let stateId = req.body.stateId;
      // check state with id exist
      if (!ObjectId.isValid(stateId)) {
        return res
          .status(400)
          .send({ error: 'Invalid stateId', field: 'stateId' });
      }

      let checkState = await State.findOne({ stateId: stateId });
      if (!checkState) {
        return res
          .status(400)
          .send({ error: 'State with id not exist', field: 'stateId' });
      }
      // convert state id to mongodb object
      console.log('stateId', stateId);
    }
    const { cityName, stateId, status } = req.body;

    // console.log('req.body', req.body);

    //  update element in mongodb put
    City.updateOne({ _id: _id }, { $set: { cityName, stateId, status } })
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
