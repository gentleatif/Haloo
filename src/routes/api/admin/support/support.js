const express = require('express');
const router = express.Router();
const Support = require('../../../../models/support/support');
const fs = require('fs');
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Customer = require('../../../../models/user_management/customer');

router.get('/',async (req,res) =>{
    console.log('Got query:', req.query);
    if (req.query._id) {
        req.query._id = ObjectId(req.query._id) 
    }
    try {
        // data = await Support.find(req.query);
        data = await Support.aggregate([
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
        ]);
        res.send({data:data});

    }   catch (error) {
        console.log(error);
        res.sendStatus(400);
    }
})

router.post('/', async (req,res) =>{
    console.log('Got query:', req.query);
    console.log('Got body:', req.body);

    try{
        var { customerId, query, status } = req.body;

        
        // customerId CHECK OBJECTID
        if (!customerId || !ObjectId.isValid(customerId)){
            return res.status(400).send({error: "Please provide valid customerId"});
        }

        //  CHECK CUSTORMER ID EXIST OR NOT
        var customer = await Customer.findById(customerId);
        if (!customer){
            return res.status(400).send({error: "Please provide valid customerId"});
        }



        var support = new Support({ customerId, query, status });
        
        await support.save();
        return res.status(200).send('ok');
    } catch (error) {
        console.log(error);
        return res.status(400).send(error); 
    }
})

router.delete("/" ,async function(req,res){
    // console.log('Got query:', req.query);
    // console.log('Got body:', req.body);
    var _id = req.query._id;
    if (!_id){
        res.send({error: "Please provide an id"});
    }else{
        //  remove element by id
        Support.remove({_id:_id})
        .then((item) => {
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
        Support.updateOne({_id:_id}, {$set: req.body})
        .then((_) => {
                res.sendStatus(200);
        }).catch((error) => {
            //error handle
            console.log(error);
            res.sendStatus(400);       
        });
    }
});

module.exports = router;