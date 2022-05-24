const express = require('express');
const router = express.Router();
const Customer = require('../../../../models/user_management/customer');
const fs = require('fs');
const upload = require('../../../../middleware/multer');
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const SubCategory = require('../../../../models/service_info/sub_category');

router.get('/', async(req, res) => {
    console.log('Got query:', req.query);


    if (req.query.online) {
        var online = req.query.online
        if (online != "true" && online != "false") {
            return res.status(400).send({ error: 'online must be bool true/false' })
        }
        if (online == "true") {
            req.query.online = true
        } else {
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
        // if (req.query.jobSkills) {
        //     var jobSkillsSearch = await SubCategory.find({ category: new RegExp(req.query.jobSkills, 'i') })
        //         // console.log('jobSkill:', jobSkillsSearch);
        //     var jobSkillId = []
        //     for (var i = 0; i < jobSkillsSearch.length; i++) {
        //         jobSkillId.push(jobSkillsSearch[i]._id)
        //     }
        //     req.query.jobSkills = { $in: jobSkillId }
        // }
        // console.log('Got query:', req.query);

        // find all vender contain jobSkillId in jobSkills
        if (req.query.jobSkillId) {
            req.query.jobSkills = { $in: [ObjectId(req.query.jobSkillId)] }
            delete req.query.jobSkillId;
        }


        if (req.query._id) {
            req.query._id = ObjectId(req.query._id);
        }

        data = await Customer.aggregate([{
                $match: {...req.query, type: 'vendor' }
            },
            {
                $lookup: {
                    from: 'jobs',
                    localField: '_id',
                    foreignField: 'customerId',
                    as: 'jobDetails'
                }
            },
            // {
            //     $lookup: {
            //         from: 'categories',
            //         localField: 'jobSkills',
            //         foreignField: '_id',
            //         as: 'jobSkills'
            //     }
            // },
            {
                "$lookup": {
                    "from": "reviews",
                    "let": { "cId": "$_id" },

                    "pipeline": [{
                            "$match": {
                                $expr: { $eq: ["$" + req.query.type + "Id", { "$toObjectId": "$$cId" }] },
                                "reviewFor": req.query.type
                            }
                        },
                        { $group: { _id: null, avg: { $avg: '$rating' } } }
                    ],
                    "as": "reviewDetails"
                }
            },
            {
                $addFields: { noOfJobs: { $size: "$jobDetails" } }
            },
            {
                $project: { jobDetails: 0, reviewDetails: 0, token: 0 }
            }
        ]);
        // console.log('Got data:', data);

        // for (let index = 0; index < data.length; index++) {
        //     // const element = array[index];
        //     let jobSkills = [];
        //     console.log('data.jobSkills', data[index].jobSkills);
        //     if (data[index].jobSkills && data[index].jobSkills.length > 0) {
        //         data[index].jobSkills.forEach(element => {
        //             //  check for Active
        //             if (element.status == 'Active') {
        //                 jobSkills.push(element.categoryName);
        //             }
        //         });
        //     }
        //     // console.log('jobSkills', jobSkills);
        //     data[index].jobSkills = jobSkills;

        // }

        // forloop in customer check for profile image exist from path
        for (let i = 0; i < data.length; i++) {
            if (data[i].profileImage) {
                // check if file exist
                if (fs.existsSync(data[i].profileImage)) {
                    data[i].profileImage = data[i].profileImage;
                } else {
                    data[i].profileImage = null;
                }
            }
        }

        res.send({ data: data });
    } catch (error) {
        console.log(error);
        res.status(400).send({ error: error });
    }
});


module.exports = router;