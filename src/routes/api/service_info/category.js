const express = require('express');
const router = express.Router();
const Category = require('../../../models/service_info/category');
const fs = require('fs');
const Counter = require('../../../models/utils/counter');

const upload = require('../../../controller/multer');
const getNextSequence = require('../../../utils/counter');

router.get('/', async (req, res) => {
  console.log('Got query:', req.query);

  try {
    // console.log('findQuery:', findQuery);
    data = await Category.find(req.query);
    res.send({ data: data });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: 'server error occur' });
  }
});

router.post('/', async (req, res) => {
  console.log('Got query:', req.query);
  console.log('Got body:', req.body);

  var categoryName = req.body.categoryName;
  // var sequenceNumber = req.body.sequenceNumber;

  var status = req.body.status;

  if (!categoryName) {
    return res
      .status(400)
      .send({ error: 'categoryName is required', field: 'categoryName' });
  }
  // check state already exist
  let checkCategory = await Category.findOne({ categoryName: categoryName });
  if (checkCategory) {
    return res
      .status(400)
      .send({ error: 'Category already exist', field: 'categoryName' });
  }

  var seq = await getNextSequence('category');
  console.log('seq:', seq);
  var item = new Category({ categoryName, sequenceNumber: seq, status });

  item
    .save(item)
    .then(function (item) {
      console.log(item);
      res.sendStatus(200);
    })
    .catch((error) => {
      //error handle
      console.log(error);
      res.status(400).send({ error: 'Error occur while saving data to db' });
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
    Category.findOneAndDelete({
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

router.put('/', async function (req, res) {
  console.log('Got query:', req.query);
  console.log('Got body:', req.body);
  var _id = req.query._id;
  data = await Category.findOne({
    _id: _id,
  });
  console.log(data);
  if (!_id) {
    res.send({ error: 'Please provide an id' });
  } else if (!data) {
    res.send({ error: 'No collection with this id' });
  } else {
    //  update element in mongodb put
    // if (req.files.image) {
    //     req.body.image = 'uploads/images/' + req.files.image[0].filename;
    //     if (data.image) {
    //         fs.unlink(data.image, (err) => {
    //             if (err) throw err;
    //             console.log('successfully deleted image');
    //         });
    //     }

    // }
    // if (req.files.hoverImage) {
    //     req.body.hoverImage = 'uploads/images/' + req.files.hoverImage[0].filename;
    //     if (data.hoverImage) {
    //         fs.unlink(data.hoverImage, (err) => {
    //             if (err) throw err;
    //             console.log('successfully deleted image');
    //         });
    //     }
    // }
    const { categoryName, status } = req.body;

    if (categoryName) {
      let checkCategory = await Category.findOne({
        categoryName: categoryName,
        _id: { $ne: _id },
      });
      if (checkCategory) {
        return res
          .status(400)
          .send({ error: 'Category already exist', field: 'categoryName' });
      }
    }

    Category.updateOne({ _id: _id }, { $set: { categoryName, status } })
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
