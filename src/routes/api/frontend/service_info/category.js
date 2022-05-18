const express = require('express');
const router = express.Router();
const Category = require('../../../../models/service_info/category');
const fs = require('fs');
const Counter = require('../../../../models/utils/counter');

const upload = require('../../../../controller/multer');
const getNextSequence = require('../../../../utils/counter');

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

module.exports = router;
