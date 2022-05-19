const express = require('express');
const router = express.Router();
const Offer = require('../../../../models/offer/offer');
const upload = require('../../../../middleware/multer');
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

module.exports = router;
