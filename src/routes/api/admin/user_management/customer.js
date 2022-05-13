const express = require('express');
const router = express.Router();
const Customer = require('../../../../models/user_management/customer');
const fs = require('fs');
const upload = require('../../../../controller/multer').single('profileImage');
const multer = require('multer');
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

router.get('/',async (req,res) =>{
    console.log('Got query:', req.query);
    if (req.query._id) {
        req.query._id = ObjectId(req.query._id) 
    }
    // if(!req.query.type){
    //     return res.status(400).send('Type is required (customer/vendor)');
    // }
    try {
        // data = await Customer.find(findQuery);
        data = await Customer.aggregate([
            {
                $match : req.query
            },
            {
                $lookup: {
                    from: 'jobs',
                    localField: 'customerId',
                    foreignField: '_id',
                    as: 'jobDetails'
                }
            },
            {
                $lookup: {
                    from: 'states',
                    localField: 'stateId',
                    foreignField: '_id',
                    as: 'stateDetails'
                }
            },
            {
                $lookup: {
                    from: 'cities',
                    localField: 'cityId',
                    foreignField: '_id',
                    as: 'cityDetails'
                }
            },
            {
                "$lookup": {
                    "from": "reviews",
                    "let": { "cId": "$_id" },

                    "pipeline": [
                        {
                            "$match": {
                                $expr: { $eq: ["$"+req.query.type+"Id", {"$toObjectId": "$$cId"}] },
                                "reviewFor": req.query.type
                            }
                        },
                        { $group: { _id: null, avg : { $avg : '$rating' } } }
                    ],
                    "as": "reviewDetails"
                }
            },
            { 
                $addFields: {noOfJobs: {$size: "$jobDetails"}}
            },
            {
                $project : { jobDetails : 0, reviewDetails : 0 }
            }
        ]);

        // forloop in customer check for profile image exist from path
        for(let i=0; i<data.length; i++){
            if(data[i].profileImage){
                // check if file exist
                if(fs.existsSync(data[i].profileImage)){
                    data[i].profileImage = data[i].profileImage;
                }else{
                    data[i].profileImage = null;
                }
            }
        }

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

        upload(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
              // A Multer error occurred when uploading.
              console.log('A Multer error occurred when uploading.');
              console.log(err);       
              return res.status(400).send({error: err.message, field: 'profileImage'});
            //   return res.status(400).send({error: 'Only .png, .jpg and .jpeg format allowed with maxsize 1Mb!', field: 'profileImage'});

            } else if (err) {
              // An unknown error occurred when uploading.
              console.log('A Multer error occurred when uploading.');
              console.log(err);
              return res.status(400).send({error: err.message, field: 'profileImage'});
            //   return res.status(400).send({error: 'Only .png, .jpg and .jpeg format allowed with maxsize 1Mb!', field: 'profileImage' });
            }
            
            console.log(req.file)
            console.log('Got query:', req.query);
            console.log('Got body:', req.body);

            // phone must be unique and require
            if(!req.body.phone){
                return res.status(400).send({error:'Phone is required', field: 'phone'});
            }

            // check phone in mongodb
            let customer = await Customer.findOne({phone: req.body.phone});
            if(customer){
                return res.status(400).send({error:'Phone already exists', field:'phone'});
            }
    
    
            if(req.body.pincode){
                var pincode = req.body.pincode;
                console.log('pincode', pincode);
                var pincodeRegex = /^\d{6}$/;
                if(!pincodeRegex.test(pincode)){
                    return res.status(400).send({error:'Invalid pincode',  field: 'pincode'});
                }
            }
            // validate phone
            if(req.body.phone){
                var phone = req.body.phone;
                var phoneRegex = /^\d{10}$/;
                if(!phoneRegex.test(phone)){
                    return res.status(400).send({error:'Invalid phone',  field:'phone'});
                }
            }
            console.log(req.file);
            if (req.file) {
                req.body.profileImage = 'uploads/images/' + req.file.filename;             
            }
            
            // check type
            if(req.body.type){
                var type = req.body.type;
                console.log(type);
                if(type != 'customer' && type != 'vendor'){
                    return res.status(400).send({error:'Invalid type (customer/vendor)', field: 'type'});
                }
            }
            // check online
            if(req.body.online){
                var online = req.body.online;
                if(online != false && online != true){
                    return res.status(400).send({error:'Invalid online (true/false)', field: 'online'});
                }
            }
            // check jobskills
            if(req.body.jobSkills){
                var jobSkills = req.body.jobSkills;
                if(!Array.isArray(jobSkills)){
                    return res.status(400).send({error:'Invalid jobSkills (array)', field: 'jobSkills'});
                }
            }

            // stateId validate
            if (req.body.stateId && !ObjectId.isValid(req.body.stateId)) {
                return res.status(400).send({ error: 'Invalid stateId' });
            }

            // cityId validate
            if (req.body.cityId && !ObjectId.isValid(req.body.cityId)) {
                return res.status(400).send({ error: 'Invalid cityId' });
            }



            // var update_query = { };

            var {
                companyName,
                customerName, 
                type,
                phone, 
                address, 
                // city, 
                // state, 
                pincode, 
                lastAccessOn, 
                codStatus, 
                status,
                online,
                jobSkills,
                cityId,
                stateId,
                profileImage } = req.body;

            var newCustomer = new Customer({
                companyName,
                customerName, 
                type,
                phone, 
                address, 
                // city, 
                // state,
                cityId,
                stateId,
                pincode, 
                lastAccessOn, 
                codStatus, 
                status,
                profileImage,
                jobSkills,
                online
            });
            
            await newCustomer.save();

            return res.status(200).send('ok');
        });
    } catch (error) {
        console.log(error);
        return res.sendStatus(400); 
    }
});

router.delete("/" ,async function(req,res){
    // console.log('Got query:', req.query);
    // console.log('Got body:', req.body);
    if (!req.query._id){
        return res.send({error: "Please provide an id"});
    }

    var _id = req.query._id;


    data = await Customer.findOne({
        _id: _id
    });

    console.log(data);

    if (!_id){
        return res.send({error: "No customer exist with this id"});
    }

    //  remove element by id
    Customer.findOneAndDelete({_id:_id})
    .then((item) => {
            // if (item.profileImage) {
            //     fs.unlink(item.profileImage, (err) => {
            //         if (err) throw err;
            //         console.log('successfully deleted profileImage');
            //     });
            // }
            res.sendStatus(200);
    }).catch((error) => {
        //error handle
        console.log(error);
        res.sendStatus(400);       
    });
    
});

router.put("/" ,async function(req,res){ 

    if (!req.query._id){
        return res.send({error: "Please provide an id", field:"_id"});
    }

    var _id = req.query._id;


    data = await Customer.findOne({
        _id: _id
    });

    console.log(data);

    if (!_id){
        return res.send({error: "No customer exist with this id"});
    }


    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
          // A Multer error occurred when uploading.
          console.log('A Multer error occurred when uploading.');
          console.log(err);
          return res.status(400).send({error: err.message, field: 'profileImage'});
        //   return res.status(400).send({error: 'Only .png, .jpg and .jpeg format allowed with maxsize 1Mb!', field: 'profileImage'});
        } else if (err) {
          // An unknown error occurred when uploading.
          console.log('A Multer error occurred when uploading.');
          console.log(err);
          return res.status(400).send({error: err.message, field: 'profileImage'});
        //   return res.status(400).send({error: 'Only .png, .jpg and .jpeg format allowed with maxsize 1Mb!', field: 'profileImage'});
        }
       
        console.log(req.file)
        console.log('Got query:', req.query);
        console.log('Got body:', req.body);


        if(req.body.pincode){
            var pincode = req.body.pincode;
            console.log('pincode', pincode);
            var pincodeRegex = /^\d{6}$/;
            if(!pincodeRegex.test(pincode)){
                return res.status(400).send({error:'Invalid pincode',  field:'phone'});
            }
        }
        // validate phone
        // if(req.body.phone){
        //     var phone = req.body.phone;
        //     var phoneRegex = /^\d{10}$/;
        //     if(!phoneRegex.test(phone)){
        //         return res.status(400).send({error:'Invalid phone'});
        //     }
        // }
        
        
        // check type
        if(req.body.type){
            var type = req.body.type;
            if(type != 'customer' && type != 'vendor'){
                return res.status(400).send({error:'Invalid type (customer/vendor)', field: 'type' });
            }
        }
        // check online
        if(req.body.online){
            var online = req.body.online;
            if(online != false && online != true){
                return res.status(400).send({error:'Invalid online (true/false)', field: 'online'});
            }
        }
        // check jobskills
        if(req.body.jobSkills){
            var jobSkills = req.body.jobSkills;
            if(!Array.isArray(jobSkills)){
                return res.status(400).send({error:'Invalid jobSkills (array)', field: 'jobSkills'});
            }
        }
        if (req.body.stateId && !ObjectId.isValid(req.body.stateId)) {
            return res.status(400).send({ error: 'Invalid stateId', field: 'stateId' });
        }

        // cityId validate
        if (req.body.cityId && !ObjectId.isValid(req.body.cityId)) {
            return res.status(400).send({ error: 'Invalid cityId', field: 'cityId' });
        }

        if(req.body.phone){
            let customer = await Customer.findOne({phone: req.body.phone, _id: {$ne: _id}});
            if(customer){
                return res.status(400).send({error:'Phone already exists', field:'phone'});
            }
        }

        console.log(req.file);
        if (req.file) {
            req.body.profileImage = 'uploads/images/' + req.file.filename;
            if (data.profileImage) {
                    fs.unlink(data.profileImage, (err) => {
                        if (err) {
                            console.log(err);
                        };
                        console.log({data:'successfully deleted profileImage'});
                    });
                
            }
            
        }
        
        var update_query = { };
        if(req.body.customerName && req.body.customerName != data.customerName){
            update_query.customerName = req.body.customerName;
        }

        // if(req.body.phone && req.body.phone != data.phone){
        //     update_query.phone = req.body.phone;
        // }

        if(req.body.type && req.body.type != data.type){
            update_query.type = req.body.type;
        }

        if(req.body.online && req.body.online != data.online){
            update_query.online = req.body.online;
        }

        if(req.body.jobSkills && req.body.jobSkills != data.jobSkills){
            update_query.jobSkills = req.body.jobSkills;
        }

        if(req.body.pincode && req.body.pincode != data.pincode){
            update_query.pincode = req.body.pincode;
        }

        if(req.body.profileImage){
            update_query.profileImage = req.body.profileImage;
        }

        if(req.body.address && req.body.address != data.address){
            update_query.address = req.body.address;
        }

        if(req.body.city && req.body.city != data.city){
            update_query.city = req.body.city;
        }

        if(req.body.state && req.body.state != data.state){
            update_query.state = req.body.state;
        }

        if(req.body.companyName && req.body.companyName != data.companyName){
            update_query.companyName = req.body.companyName;
        }

        if(req.body.cityId && req.body.cityId != data.cityId){
            update_query.cityId = req.body.cityId;
        }

        if(req.body.stateId && req.body.stateId != data.stateId){
            update_query.stateId = req.body.stateId;
        }

        // countryCode
        if(req.body.countryCode && req.body.countryCode != data.countryCode){
            update_query.countryCode = req.body.countryCode;
        }





        //  update element in mongodb put
        Customer.updateOne({_id:_id}, {$set: update_query})
        .then((item) => {
            return res.sendStatus(200);
        }).catch((error) => {
            //error handle
            console.log(error);
            return res.status(400).send({error: error});       
        });
        // }
    });
    // console.log('Got query:', req.query);
    // console.log('Got body:', req.body);
    // var _id = req.query._id;


    // data = await Customer.findOne({
    //     _id: _id
    // })
    // console.log(data);
    // if (!_id){
    //     res.send({error: "Please provide an id"});
    // }else if (!_id){
    //     res.send({error: "Please provide an id"});
    // }else{

    //     // if (req.files.profileImage) {
    //     //     req.body.profileImage = 'uploads/images/' + req.files.profileImage[0].filename;
    //     //     if (data.profileImage) {
    //     //         fs.unlink(data.profileImage, (err) => {
    //     //             if (err) throw err;
    //     //             console.log('successfully deleted profileImage');
    //     //         });
    //     //     }
            
    //     // }

    //     //  update element in mongodb put
    //     Customer.updateOne({_id:_id}, {$set: req.body})
    //     .then((item) => {
    //             res.sendStatus(200);
    //     }).catch((error) => {
    //         //error handle
    //         console.log(error);
    //         res.sendStatus(400);       
    //     });
    // }
});

router.put("/block" , async function(req,res){ 
    if (!req.query._id){
        return res.status(400).send({error: "Please provide an id", field:"_id"});
    }

    var _id = req.query._id;

    // blockreason
    if (!req.body.blockReason){
        return res.status(400).send({error: "Please provide a blockReason", field:"blockReason"});
    }


    // data = await Customer.findOne({
    //     _id: _id
    // });
    console.log(_id);

    await Customer.updateOne({_id:_id}, {$set: {block: true, blockReason: req.body.blockReason}});

    return res.sendStatus(200);
});

// unblock
router.put("/unblock" , async function(req,res){
    if (!req.query._id){
        return res.status(400).send({error: "Please provide an id", field:"_id"});
    }

    var _id = req.query._id;


    data = await Customer.findOne({
        _id: _id
    });

    await Customer.updateOne({_id:_id}, {$set: {block: false, blockReason: ''}});

    return res.sendStatus(200);
});
   


module.exports = router;