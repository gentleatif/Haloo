const express = require('express');
const router = express.Router();
const State = require('../../../../models/service_info/state');

router.get('/', async (req, res) => {
    console.log('Got query:', req.query);
    var findQuery = {};
    if (req.query.length > 0) {
        var findQuery = {
            stateName: req.query.stateName,
            countryName: req.query.countryName,
            status: req.query.status,
        };

        Object.keys(findQuery).forEach((key) => {
            if (
                findQuery[key] === '' ||
                findQuery[key] === NaN ||
                findQuery[key] === undefined
            ) {
                delete findQuery[key];
            }
        });
    }
    try {
        data = await State.find(findQuery);
        res.send({ data: data });
    } catch (error) {
        console.log(error);
        res.sendStatus(400);
    }
});

module.exports = router;
