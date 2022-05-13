const express = require('express');
const router = express.Router();
const Customer = require('../../../models/user_management/customer');
const Job = require('../../../models/job');
const fs = require('fs');
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const Category = require('../../../models/service_info/category');
const SubCategory = require('../../../models/service_info/sub_category');
const State = require('../../../models/service_info/state');
const City = require('../../../models/service_info/city');


router.get('/',async (req,res) =>{
    console.log('user details', req.user);
    console.log('Got query:', req.query);
    
    try {
        let vendor = await Customer.find({type: 'vendor'});
        total_vendor = vendor.length;

        let customer = await Customer.find({type: 'customer'});
        total_customer = customer.length;

        let job = await Job.find({status: 'completed'});
        completed_job = job.length;

        //  pending job
        let pending_job = await Job.find({status: 'pending'});
        total_pending_job = pending_job.length;

        // cancelled job
        let cancelled_job = await Job.find({status: 'cancelled'});
        total_cancelled_job = cancelled_job.length;

        //  total categories
        let categories = await Category.find({});
        total_categories = categories.length;

        //  total sub categories
        let sub_categories = await SubCategory.find({});
        total_sub_categories = sub_categories.length;

        //  total state
        let state = await State.find({});
        total_state = state.length;

        //  total city
        let city = await City.find({});
        total_city = city.length;


        // recent jobs of last 7 days
        // let recent_job = await Job.find({});
        // let recent_job_array = [];
        // for(let i=0; i<recent_job.length; i++){
        //     let job_date = new Date(recent_job[i].createdAt);
        //     let today = new Date();
        //     let diff = today.getTime() - job_date.getTime();
        //     let days = Math.floor(diff / (1000 * 60 * 60 * 24));
        //     if(days <= 7){
        //         recent_job_array.push(recent_job[i]);
        //     }
        // }

        let recent_job = await Job.find(
            {
                "createdAt": 
                {
                    $gte: new Date((new Date().getTime() - (7 * 24 * 60 * 60 * 1000)))
                }
            }
            ).sort({ "date": -1 })


        

        res.send({ data: [  {total: total_vendor, title:'Total Vendors'}, 
                            {total: total_customer, title:'Total Customers'},
                            {total: completed_job, title:'Completed Jobs'},
                            {total: total_pending_job, title:'In Progress Jobs'},
                            {total: total_cancelled_job, title:'Cancelled Jobs'},
                            {total: total_categories, title:'Total Categories'},
                            {total: total_sub_categories, title:'Total Sub Categories'},
                            {total: total_state, title:'Total State'},
                            {total: total_city, title:'Total City'},
                            {recent_job: recent_job, title:'Recent Job'} 
        ]});
        // [
        // {total:20,title:'total customers'},
        // {total:20,title:'total customers'},
        // {total:20,title:'total customers'},
        // ]
    }   catch (error) {
        console.log(error);
        res.status(400).send({error: error}); 
    }
})

module.exports = router;