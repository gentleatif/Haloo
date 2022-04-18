const express = require('express');
const router = express.Router();
const SocialMedia = require('../../../models/setting/social_media');
const fs = require('fs');
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

router.get('/',async (req,res) =>{
    console.log('Got query:', req.query);
    if (req.query._id) {
        req.query._id = ObjectId(req.query._id) 
    }
    try {
        data = await SocialMedia.find(req.query);
        res.send({data:data});

    }   catch (error) {
        console.log(error);
        res.sendStatus(400);
    }
})

// router.post('/', async (req,res) =>{
//     console.log('Got query:', req.query);
//     console.log('Got body:', req.body);

//     try{
//         var { facebookPageUrl, linkedInUrl, InstagramUrl, youtubeUrl, fbApplicationId, fbSecretKey, googleSecretKey, googlePlayStoreUrl, appleAppStoreUrl } = req.body;

//         var socialMedia = new SocialMedia({ facebookPageUrl, linkedInUrl, InstagramUrl, youtubeUrl, fbApplicationId, fbSecretKey, googleSecretKey, googlePlayStoreUrl, appleAppStoreUrl });
        
//         await socialMedia.save();
//         return res.status(200).send('ok');
//     } catch (error) {
//         console.log(error);
//         return res.status(400).send(error); 
//     }
// })

router.delete("/" ,async function(req,res){
    // console.log('Got query:', req.query);
    // console.log('Got body:', req.body);
    var _id = req.query._id;
    if (!_id){
        res.send({error: "Please provide an id"});
    }else{
        //  remove element by id
        SocialMedia.remove({_id:_id})
        .then((item) => {
                res.sendStatus(200);
        }).catch((error) => {
            //error handle
            console.log(error);
            res.sendStatus(400);       
        });
    }
});

router.put("/", async function(req,res){
    console.log('Got query:', req.query);
    console.log('Got body:', req.body);
    var _id = req.query._id;


    if (!_id){
        res.send({error: "Please provide an id"});
    }else{

        //  update element in mongodb put
        SocialMedia.updateOne({_id:_id}, {$set: req.body})
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