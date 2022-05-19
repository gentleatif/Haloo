const express = require('express');
const router = express.Router();
const Customer = require('../../../../models/user_management/customer');
const fs = require('fs');
const upload = require('../../../../middleware/multer');
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Category = require('../../../../models/service_info/category');

router.get('/provider',async (req,res) =>{
    console.log('user details', req.user);
    console.log('Got query:', req.query);
    console.log('Got body:', req.user.loginType);
    if(req.user.loginType == 'user'){
        if(!req.user._id){
            return res.status(400).send({error : 'Unable to get id from token please relogin'});
        }

        if (req.user._id) {
            req.user._id = ObjectId(req.user._id) 
        }

        if (req.query.online){
            var online  = req.query.online
            if(online != "true" && online != "false"){
                return res.status(400).send({ error : 'online must be bool true/false' })
            }
            if(online == "true"){
                req.query.online = true
            }else{
                req.query.online = false
            }
        }
        
        console.log('Got query:', req.query);     

        
        try {
            // data = await Customer.find(findQuery);
            
            //add values from query search_query
            // if(req.query.jobSkill){
            //     req.query.jobSkill = new RegExp(req.query.jobSkill, 'i')
            // }

            // find id of job skill contain name from query
            if(req.query.jobSkills){
                var jobSkillsSearch = await Category.find({categoryName: new RegExp(req.query.jobSkills, 'i')})
                // console.log('jobSkill:', jobSkillsSearch);
                var jobSkillId = []
                for(var i = 0; i < jobSkillsSearch.length; i++){
                    jobSkillId.push(jobSkillsSearch[i]._id)
                }
                req.query.jobSkills = {$in : jobSkillId}
            }
            console.log('Got query:', req.query);


            if(req.query._id){
                req.query._id = ObjectId(req.query._id);
            }

            data = await Customer.aggregate([
                {
                    $match : { ...req.query, type:'vendor'}
                },
                {
                    $lookup: {
                        from: 'jobs',
                        localField: '_id',
                        foreignField: 'customerId',
                        as: 'jobDetails'
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
                    $addFields: {noOfJobs: { $size: "$jobDetails" }}
                },
                {
                    $project : { jobDetails : 0, reviewDetails : 0, token : 0 }
                }
            ]);
            // console.log('Got data:', data);

            for (let index = 0; index < data.length; index++) {
                // const element = array[index];
                let jobSkills = [];
                console.log('data.jobSkills', data[index].jobSkills);
                if(data[index].jobSkills && data[index].jobSkills.length > 0){
                    data[index].jobSkills.forEach(element => {
                        //  check for Active
                        if(element.status == 'Active'){                        
                            jobSkills.push(element.categoryName);
                        }
                    });
                }
                // console.log('jobSkills', jobSkills);
                data[index].jobSkills = jobSkills;
                
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
            
            res.send({data:data});
        }   catch (error) {
            console.log(error);
            res.status(400).send({error: error}); 
        }
    }else{
        res.status(400).send('Invalid login type');
    }
});

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

// router.delete("/" ,async function(req,res){
//     // console.log('Got query:', req.query);
//     // console.log('Got body:', req.body);
//     var _id = req.user._id;

    
//     if (req.user.loginType != 'user'){
//        return res.status(400).send('Invalid login type');
//     }
//     if(!_id){
//         return res.status(400).send('Unable to get id from token please relogin');
    
//     }else{
//         //  remove element by id
//         Customer.findOneAndDelete({_id:_id})
//         .then((item) => {
//                 if (item.profileImage) {
//                     fs.unlink(item.profileImage, (err) => {
//                         if (err) console.log(err);;
//                         console.log('successfully deleted profileImage');
//                     });
//                 }
//                 res.sendStatus(200);
//         }).catch((error) => {
//             //error handle
//             console.log(error);
//             res.sendStatus(400);       
//         });
//     }
// });

// router.put("/", upload.fields([{name: 'profileImage', maxCount: 1}]) ,async function(req,res){
//     console.log('Got query:', req.query);
//     console.log('Got body:', req.body);
//     console.log('Got files:', req.files);
//     console.log('req.files.profileImage', req.files.profileImage);
//     var _id = req.user._id;

    
//     if (req.user.loginType != 'user'){
//        return res.status(400).send('Invalid login type');
//     }
//     if(!_id){
//         return res.status(400).send('Unable to get id from token please relogin');
//     }
//     data = await Customer.findOne({
//         _id: _id
//     })
//     console.log(data);
//     if (!data){
//         return res.send({error: "No customer found"});
//     }else{

//         if (req.files.profileImage) {
//             req.body.profileImage = 'uploads/images/' + req.files.profileImage[0].filename;
//             if (data.profileImage) {
//                     fs.unlink(data.profileImage, (err) => {
//                         if (err) {
//                             console.log(err);
//                         };
//                         console.log('successfully deleted profileImage');
//                     });
                
//             }
            
//         }

//         //  update element in mongodb put
//         Customer.updateOne({_id:_id}, {$set: req.body})
//         .then((item) => {
//                 res.sendStatus(200);
//         }).catch((error) => {
//             //error handle
//             console.log(error);
//             res.sendStatus(400);       
//         });
//     }
// });

module.exports = router;