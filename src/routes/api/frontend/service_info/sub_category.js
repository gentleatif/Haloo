const express = require('express');
const fs = require('fs');
const router = express.Router();
const SubCategory = require('../../../../models/service_info/sub_category');
const Category = require('../../../../models/service_info/category');
const upload = require('../../../../controller/multer');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;


router.get('/',async (req,res) =>{
    console.log('Got query:', req.query);
    // var findQuery = {};
    // console.log('Got query:', req.query.length);
    // if(req.query.length > 0){
    //     var findQuery = {_id:req.query._id, category:req.query.category, parentCategoryId:req.query.parentCategoryId, sequenceNumber:req.query.sequenceNumber, status:req.query.status};

    //     Object.keys(findQuery).forEach(key => {
    //         if (findQuery[key] === '' || findQuery[key] === NaN || findQuery[key] === undefined) {
    //         delete findQuery[key];
    //         }
    //     });
    // }

    if (req.query._id) {
        req.query._id = ObjectId(req.query._id)
    }

    try {
        // movedb lookup to get reference data
        data = await SubCategory.aggregate([
            {
                $match : req.query
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'parentCategoryId',
                    foreignField: '_id',
                    as: 'parentCategoryDetails'
                }
            }]);

        console.log(data);

        // data = await SubCategory.find(findQuery);
        res.send({data:data});
    }   catch (error) {
        console.log(error);
        res.sendStatus(400);
    }
})


module.exports = router;