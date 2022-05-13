const express = require('express');
const router = express.Router();
const Job = require('../../../../models/job');
const generate_otp = require('../../../../utils/generate_otp');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Customer = require('../../../../models/user_management/customer');
const socket = require('socket.io');
const server = require('../../../../../server')



module.exports = function(getIOInstance) {



    router.get("/" ,async function(req,res){
        console.log('Got query:', req.query);

        
        if (req.user.loginType != 'user'){
        return res.status(400).send({error:'Invalid login type'});
        }
        if(!req.user._id){
            return res.status(400).send({error:'Unable to get id from token please relogin'});   
        }

        if (req.query._id) {
            req.query._id = ObjectId(req.query._id) 
        }
        req.user._id = ObjectId(req.user._id)

        try {
            // data = await Job.find(findQuery);

            data = await Job.aggregate([
                {
                    $match : { ...req.query, $or: [ { customerId: req.user._id }, { vendorId: req.user._id } ]}
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
            res.status(400).send({error: error}); 
        }
    });


    router.post("/" ,async function(req,res){
        console.log('Got query:', req.query);
        console.log('Got body:', req.body);

        var _id = req.user._id;

        if (req.user.loginType != 'user'){
            return res.status(400).send('Invalid login type');
        }

        if(!_id){
            return res.status(400).send('Unable to get id from token please relogin');
        }
        if(!req.body.vendorId){
            return res.status(400).send('Please provide vendor id');
        }
        vendor_details = await Customer.findOne({_id:req.body.vendorId});
        console.log("vendor", vendor_details);
        if(!vendor_details){
            return res.status(400).send('Vendor not found');
        }


        var customerId = _id

        var otp = generate_otp(4);

        var { quote, jobTitle, city, categoryId, subCategoryId, status, vendorId, jobTotal } = req.body;

        var item = new Job({ quote, jobTitle, city, customerId, categoryId, subCategoryId, status, vendorId, jobTotal, otp });


        //  if vendor socket id then send socket request to it
        if(vendor_details.socketId){

            var socket_id = vendor_details.socketId;
            var socket_data = {
                type:'request',
                data:{
                    customerId:_id,
                    vendorId:req.body.vendorId,
                    _id: item.id
                }
            }
            console.log('socket_data',socket_data);

            getIOInstance().to(socket_id).emit('request',socket_data);

        }


        
        
        item.save( item )
            .then(function(item){
                console.log(item);
                res.sendStatus(200);
            }).catch((error) => {
                //error handle
                console.log(error);
                res.status(400).send({error: error});       
            });   

    });

    router.delete("/" ,async function(req,res){
        // console.log('Got query:', req.query);
        // console.log('Got body:', req.body);

        if (req.user.loginType != 'user'){
            return res.status(400).send('Invalid login type');
        }
        if(!req.user._id){
            return res.status(400).send('Unable to get id from token please relogin');
        
        }
        var _id = req.query._id;
        if (!_id){
            res.send({error: "Please provide an id"});
        }else{
            //  remove eleemnt id id mongodb
            Job.remove({_id:_id, $or: [ { customerId: req.user._id }, { vendorId: req.user._id } ]})
            .then(function(item){
                    res.sendStatus(200);
            }).catch((error) => {
                //error handle
                console.log(error);
                res.status(400).send({error: error});      
            });
        }
    });

    router.put("/" ,async function(req,res){
        console.log('Got query:', req.query);
        console.log('Got body:', req.body);
        var _id = req.query._id;

        if (req.user.loginType != 'user'){
            return res.status(400).send('Invalid login type');
        }
        if(!req.user._id){
            return res.status(400).send('Unable to get id from token please relogin');
        
        }

        if (!_id){
            res.send({error: "Please provide an id"});
        }else{
            //  update element in mongodb put
            req.user._id = ObjectId(req.user._id)

            Job.updateOne({_id:_id, $or: [ { customerId: req.user._id }, { vendorId: req.user._id } ]}, {$set: req.body})
            .then(function(item){
                    res.sendStatus(200);
            }).catch((error) => {
                //error handle
                console.log(error);
                res.status(400).send({error: error});       
            });
        }
    });

    router.post('/verify_otp', (req, res) => {
        console.log('Got query:', req.query);
        console.log('Got body:', req.body);

        if (req.user.loginType != 'user'){ 
            return res.status(400).send('Invalid login type');
        }
        if(!req.user._id){
            return res.status(400).send('Unable to get id from token please relogin');
        
        }

        var _id = req.query._id;
        var otp = req.body.otp;

        if (!_id){
            return res.send({error: "Please provide an id of the job in params"});
        }
        if (!otp){
            return res.send({error: "Please provide an otp in body"});
        }

        req.user._id = ObjectId(req.user._id)

        Job.findOne({_id:_id, $or: [ { customerId: req.user._id }, { vendorId: req.user._id } ]})
        .then(function(item){
            if(item.otp == otp){
                Job.updateOne({_id:_id, $or: [ { customerId: req.user._id }, { vendorId: req.user._id } ]}, {$set: {status: 'complete'}})
                .then(function(item){
                    res.sendStatus(200);
                }).catch((error) => {
                    //error handle
                    console.log(error);
                    res.sendStatus(400);       
                });
            }else{
                res.status(400).send({error: "Invalid otp"});
            }
        }).catch((error) => {
            //error handle
            console.log(error);
            res.status(400).send({error: error});  
        });
            
        
    });

    return router;
}