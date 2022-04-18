const express = require('express');
const router = express.Router();
const CodRequest = require('../../../models/user_management/codrequest');
const Customer = require('../../../models/user_management/customer');

router.get('/',async (req,res) =>{
    console.log('Got query:', req.query);
    if (req.query._id) {
        req.query._id = ObjectId(req.query._id) 
    }
    try {
        
        data = await CodRequest.aggregate([
            {
                $match : req.query
            },
            {
                $lookup: {
                    from: 'customers',
                    localField: 'customerId',
                    foreignField: '_id',
                    as: 'customerDetails'
                }
            },
        ]);



        res.send({data:data});
    }   catch (error) {
        console.log(error);
        res.sendStatus(400);
    }
})

router.post('/',(req,res) =>{
    console.log('Got query:', req.query);
    console.log('Got body:', req.body);

    var { customerId } = req.body;

    var newCodRequest = new CodRequest({
        customerId
    });

    
    newCodRequest.save()
        .then((item) => {
            console.log(item);
            res.sendStatus(200);
        }).catch((error) => {
            //error handle
            console.log(error);
            res.sendStatus(400);       
        });   
})

router.delete("/" ,async function(req,res){
    // console.log('Got query:', req.query);
    // console.log('Got body:', req.body);
    var _id = req.query._id;
    if (!_id){
        res.send({error: "Please provide an id"});
    }else{
        //  remove eleemnt id id mongodb
        CodRequest.remove({_id:_id})
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
        CodRequest.updateOne({_id:_id}, {$set: req.body})
        .then((item) => {
                res.sendStatus(200);
        }).catch((error) => {
            //error handle
            console.log(error);
            res.sendStatus(400);       
        });
    }
});

router.put("/enable" ,async function(req,res){
    console.log('Got query:', req.query);
    console.log('Got body:', req.body);
    let _id = req.query._id;
    if (!_id){
        res.send({error: "Please provide an id"});
    }else{
        let requestdata = await CodRequest.findOne({_id:_id});
        if(!requestdata){
            return res.send({error: "No request with this id"});
        }
        // let customerdata = await Customer.findOne({_id:requestdata.customerId});
        // if(!customerdata){
        //     return res.send({error: "Error while getting customer details"});
        // }
        let data = await Customer.updateOne({_id:requestdata.customerId}, {$set: {codStatus:'active'}})
        //  update element in mongodb put
        CodRequest.updateOne({_id:_id}, {$set: {status:'done'}})
        .then((item) => {
                res.sendStatus(200);
        }).catch((error) => {
            //error handle
            console.log(error);
            res.sendStatus(400);       
        });
    }
});


module.exports = router;