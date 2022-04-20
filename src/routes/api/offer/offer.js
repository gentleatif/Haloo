const express = require('express');
const router = express.Router();
const Offer = require('../../../models/offer/offer');
const upload = require('../../../controller/multer');
const fs = require('fs');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

router.get('/', async (req, res) => {
  console.log('Got query:', req.query);
  if (req.query._id) {
    req.query._id = ObjectId(req.query._id);
  }
  try {
    data = await Offer.find(req.query);
    res.send({ data: data });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
});

router.post('/', upload.fields([{name: 'image', maxCount: 1}]), async (req,res) =>{
    console.log('Got query:', req.query);
    console.log('Got body:', req.body);

    try{

      var image;
      if (req.files && req.files.image) {
          image = 'uploads/images/' + req.files.image[0].filename;
      }

      var { title, code, description, discount, startDate, endDate } = req.body;

      var offer = new Offer({ title, image, code, description, discount, startDate, endDate });
      
      if (!code || !discount) {
          return res.status(400).send({ error: "code and discount can't be empty"});
      }
      await offer.save();
      return res.status(200).send('ok');
    } catch (error) {
        console.log(error);
        return res.status(400).send(error);
    }
})

router.delete('/', async function (req, res) {
  // console.log('Got query:', req.query);
  // console.log('Got body:', req.body);
  var _id = req.query._id;
  if (!_id) {
    res.send({ error: 'Please provide an id' });
  } else {
    //  remove element by id
    Offer.remove({ _id: _id })
      .then((item) => {
        res.sendStatus(200);
      })
      .catch((error) => {
        //error handle
        console.log(error);
        res.sendStatus(400);
      });
  }
});

router.put('/', upload.fields([{name: 'image', maxCount: 1}]), async function (req, res) {
  console.log('Got query:', req.query);
  console.log('Got body:', req.body);
  var _id = req.query._id;

  if (!_id) {
    res.send({ error: 'Please provide an id' });
  } else {

    data = await Offer.findOne({
      _id: _id
    });

    if (req.files && req.files.image) {
      req.body.image = 'uploads/images/' + req.files.image[0].filename;
      if (data.image) {
          fs.unlink(data.image, (err) => {
              if (err) console.log(err);
              console.log('successfully deleted image');
          });
      }
      
    }

    //  update element in mongodb put
    Offer.updateOne({ _id: _id }, { $set: req.body })
      .then((_) => {
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
