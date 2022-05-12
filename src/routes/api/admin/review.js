const express = require('express');
const router = express.Router();
const Review = require('../../models/review');

router.get("/" ,async function(req,res){
    console.log('Got query:', req.query);
    var customerId = req.query.customerId;
    var vendorId = req.query.vendorId;
    var jobId = req.query.jobId;
    var _id = req.query._id
    var rating = req.query.rating;

    var findQuery = {_id,customerId, vendorId, jobId, rating};

    Object.keys(findQuery).forEach(key => {
        if (findQuery[key] === '' || findQuery[key] === NaN || findQuery[key] === undefined) { 
          delete findQuery[key];
        }
    });
    try {
        // data = await Review.find(findQuery);
        data = await Review.aggregate([
            {
                $match : findQuery
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
                    from: 'jobs',
                    localField: 'jobId',
                    foreignField: '_id',
                    as: 'jobDetails'
                }
            },
        ]);

        res.send({data:data});
    } catch (error) {
        res.sendStatus(400);
    }
});

router.post("/" ,async function(req,res){
        console.log('Got query:', req.query);
        console.log('Got body:', req.body);
        var customerId = req.body.customerId;
        var vendorId = req.body.vendorId;
        var jobId = req.body.jobId;
        var rating = parseFloat(req.body.rating);
        var comment = req.body.comment;
        var reviewFor = req.body.reviewFor;

        if (rating == NaN  || rating > 5 || rating < 0) {
            return res.send({error: "Invalid rating value"});
        }else if(!jobId){
            return res.send({error: "Add JobId value"});
        }else if(reviewFor != "customer" && reviewFor != "vendor"){
           return res.send({error: "Invalid reviewFor value, customer or vendor"});
        }
        var item = new Review({ customerId, vendorId, jobId, rating, comment, reviewFor});
        
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
        Review.remove({_id:_id})
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
    // console.log('Got query:', req.query);
    console.log('Got body:', req.body);
    var _id = req.query._id;
    if (!_id){
        res.send({error: "Please provide an id"});
    }else{
        //  update eleemnt id id mongodb
        Review.update({_id:_id}, {$set: req.body})
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