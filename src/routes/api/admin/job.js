const express = require('express');
const router = express.Router();
const Job = require('../../models/job');

router.get("/" ,async function(req,res){
    console.log('Got query:', req.query);
    
    if (req.query._id) {
        req.query._id = ObjectId(req.query._id) 
    }

    try {
        // data = await Job.find(findQuery);

        data = await Job.aggregate([
            {
                $match : req.query
            },
            {
                $lookup: {
                    from: 'customers',
                    localField: 'customerId',
                    foreignField: '_id',
                    as: 'customerDetails'
                },
            },
            {
                $lookup: {
                    from: 'customers',
                    localField: 'vendorId',
                    foreignField: '_id',
                    as: 'vendorDetails'
                }
            },
            {
                $lookup: {
                    from: 'categories ',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            {
                $lookup: {
                    from: 'subcategories  ',
                    localField: 'subCategoryId',
                    foreignField: '_id',
                    as: 'subcategoryDetails'
                }
            }
        ]);

        res.send({data:data});
    }   catch (error) {
        console.log(error);
        res.sendStatus(400);
    }
});


router.post("/" ,async function(req,res){
    console.log('Got query:', req.query);
    console.log('Got body:', req.body);

    var { quote, jobTitle, city, customerId, propertyName, categoryId, subCategoryId, status, vendorId, jobTotal } = req.body;

    var item = new Job({ quote, jobTitle, city, customerId, propertyName, categoryId, subCategoryId, status, vendorId, jobTotal });
    
    item.save( item )
        .then(function(item){
            console.log(item);
            res.sendStatus(200);
        }).catch((error) => {
            //error handle
            console.log(error);
            res.sendStatus(400);       
        });   

});

router.delete("/" ,async function(req,res){
    // console.log('Got query:', req.query);
    // console.log('Got body:', req.body);
    var _id = req.query._id;
    if (!_id){
        res.send({error: "Please provide an id"});
    }else{
        //  remove eleemnt id id mongodb
        Job.remove({_id:_id})
        .then(function(item){
                res.sendStatus(200);
        }).catch((error) => {
            //error handle
            console.log(error);
            res.sendStatus(400);       
        });
    }
});

router.put("/" ,async function(req,res){
    console.log('Got query:', req.query);
    console.log('Got body:', req.body);
    var _id = req.query._id;
    if (!_id){
        res.send({error: "Please provide an id"});
    }else{
        //  update element in mongodb put
        Job.updateOne({_id:_id}, {$set: req.body})
        .then(function(item){
                res.sendStatus(200);
        }).catch((error) => {
            //error handle
            console.log(error);
            res.sendStatus(400);       
        });
    }
});

module.exports = router;