const express = require('express');
const router = express.Router();
const Customer = require('../../../models/user_management/customer');
const fs = require('fs');
const upload = require('../../../controller/multer').single('profileImage');
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const multer = require('multer');



router.get('/',async (req,res) =>{
    console.log('user details', req.user);
    console.log('Got query:', req.query);
    console.log('Got body:', req.user.loginType);
    if(req.user.loginType == 'user'){
        if(!req.user._id){
            return res.status(400).send({error:'Unable to get id from token please relogin'});
        }

        if (req.user._id) {
            req.user._id = ObjectId(req.user._id) 
        }
        try {
            // data = await Customer.find(findQuery);
            data = await Customer.aggregate([
                {
                    $match : {...req.query, _id:req.user._id}
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
                    $lookup: {
                        from: 'categories',
                        localField: 'jobSkills',
                        foreignField: '_id',
                        as: 'jobSkills'
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
                    $project : { jobDetails : 0, reviewDetails : 0, token : 0 }
                }
            ]);

            let jobSkills = [];
            console.log('data.jobSkills', data[0].jobSkills);
            if(data[0].jobSkills && data[0].jobSkills.length > 0){
                data[0].jobSkills.forEach(element => {
                    //  check for Active
                    if(element.status == 'Active'){                        
                        jobSkills.push(element.categoryName);
                    }
                });
            }
            console.log('jobSkills', jobSkills);
            data[0].jobSkills = jobSkills;


            // convert stateDetails array to json
            if(data[0].stateDetails && data[0].stateDetails.length > 0){
                data[0].stateDetails = data[0].stateDetails[0];
            }

            // convert cityDetails array to json
            if(data[0].cityDetails && data[0].cityDetails.length > 0){
                data[0].cityDetails = data[0].cityDetails[0];
            }

                

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


            if(data.length){
                return res.status(200).send({data:data[0]});
            }
            res.send({data:data});
        }   catch (error) {
            console.log(error);
            res.status(400).send({error: error}); 
        }
    }else{
        res.status(400).send({error:'Invalid login type'});
    }
})

// router.post('/', upload.single('profileImage'), async (req,res) =>{
//     console.log('Got query:', req.query);
//     console.log('Got body:', req.body);

//     try{
//         var {
//             companyName,
//             customerName, 
//             emailAddress, 
//             firstName,
//             lastName,
//             type,
//             phone, 
//             ageBracket, 
//             noOfJobs, 
//             address, 
//             city, 
//             state, 
//             pincode, 
//             averageRating, 
//             lastAccessOn, 
//             codStatus, 
//             status } = req.body;

//         var profileImage;
//         if (req.files.profileImage) {
//             profileImage = 'uploads/images/' + req.files.profileImage[0].filename;
//         }

//         var newCustomer = new Customer({
//             companyName,
//             customerName, 
//             emailAddress, 
//             firstName,
//             lastName,
//             type,
//             phone, 
//             ageBracket, 
//             noOfJobs, 
//             address, 
//             city, 
//             state, 
//             pincode, 
//             averageRating, 
//             lastAccessOn, 
//             codStatus, 
//             status });
        
//         await newCustomer.save();

//         return res.status(200).send('ok');
//     } catch (error) {
//         console.log(error);
//         return res.status(400).send(error); 
//     }
// })

router.delete("/" ,async function(req,res){
    // console.log('Got query:', req.query);
    // console.log('Got body:', req.body);
    var _id = req.user._id;

    
    if (req.user.loginType != 'user'){
       return res.status(400).send({ error:'Invalid login type' });
    }
    if(!_id){
        return res.status(400).send('Unable to get id from token please relogin');
    
    }else{
        //  remove element by id
        Customer.findOneAndDelete({_id:_id})
        .then((item) => {
                if (item.profileImage) {
                    fs.unlink(item.profileImage, (err) => {
                        if (err) console.log(err);;
                        console.log('successfully deleted profileImage');
                    });
                }
                res.sendStatus(200);
        }).catch((error) => {
            //error handle
            console.log(error);
            res.status(400).send({error: error});    
        });
    }
});

router.put("/" ,async function(req,res){

    console.log('user details', req.user);
    var _id = req.user._id;

    if (req.user.loginType != 'user'){
        return res.status(400).send({error:'Invalid login type'});
    }
    if(!_id){
        return res.status(400).send({error:'Unable to get id from token please relogin'});
    }
    data = await Customer.findOne({
        _id: _id
    })
    console.log(data);
    if (!data){
        return res.status(400).send({error: "No customer found"});
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
          console.log("err",err);
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
                return res.status(400).send({error:'Invalid pincode', field: 'pincode'});
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
                return res.status(400).send({error:'Invalid type (customer/vendor)', field: 'type'});
            }
        }
        // check online
        if(req.body.online){
            var online = Boolean(req.body.online);
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
            // check jobSkills contain type mongodbId   
            console.log('jobSkills', jobSkills);
            for(var i=0; i<jobSkills.length; i++){
                if(!mongoose.Types.ObjectId.isValid(jobSkills[i])){
                    return res.status(400).send({error:'Invalid jobSkills (mongodbId)', field: 'jobSkills'});
                }
            }
        }

        if(req.body.phone){
            let customer = await Customer.findOne({phone: req.body.phone, _id: {$ne: _id}});
            if(customer){
                return res.status(400).send({error:'Phone already exists', field:'phone'});
            }
        }

        if (req.body.stateId && !ObjectId.isValid(req.body.stateId)) {
            return res.status(400).send({ error: 'Invalid stateId', field: 'stateId' });
        }

        // cityId validate
        if (req.body.cityId && !ObjectId.isValid(req.body.cityId)) {
            return res.status(400).send({ error: 'Invalid cityId', field: 'cityId' });
        }
        

        var profileImages
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

        if(req.body.stateId && req.body.stateId != data.stateId){
            update_query.stateId = req.body.stateId;
        }

        if(req.body.cityId && req.body.cityId != data.cityId){
            update_query.cityId = req.body.cityId;
        }

        if(req.body.countryCode && req.body.countryCode != data.countryCode){
            update_query.countryCode = req.body.countryCode;
        }

        update_query.completedProfile = true;


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
});

module.exports = router;