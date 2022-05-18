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


module.exports = router;
