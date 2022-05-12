const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

//import files
const customer_auth = require('../../../../middleware/customer_auth');
const generate_otp = require('../../../../utils/generate_otp');
const Customer = require('../../../../models/user_management/customer');
const config = require('../../../../../config');

router.post('/generate_otp', async (req,res) =>{
    console.log('Got query:', req.query);
    console.log('Got body:', req.body);

    let { phone } = req.body;

    if (!phone) {
        return res.status(400).send({error: 'Phone number is required', field: 'phone'});
    }

    //phone regex E.164 format
    let phoneRegExp = /^\+?[1-9]\d{1,14}$/;
    if(!phoneRegExp.test(phone)){
        return res.status(400).send({error: 'Phone number must be E.164 format', field: 'phone'});
    }

    // check if phone number is already registered
    let customer = await Customer.findOne({phone});

    console.log('customer', customer);

    if (customer) {
        // check block
        if (customer.block) {
            return res.status(400).send({error: 'Your account is blocked by admin', field: 'phone'});
        }

        //generate otp ans save
        let otp = generate_otp(4);
        customer.otp = otp;
        customer.otpExpiry = Date.now() + (2 * 60 * 1000);
        await customer.save();
        console.log(otp);

        // send new user if type is not save
        if(!customer.type){
            return res.send({data:{id:customer._id, newUser:true }});
        }
        return res.send({data:{id:customer._id, newUser:false }});

    }else{
        let otp = generate_otp(4);
        let customer = new Customer({
            phone,
            otp
        });
        await customer.save();
        console.log(otp);
        return res.send({data:{_id:customer._id , newUser: true }});
    }
})



router.post("/verify_otp", async (req, res) => {

    let { id, otp, type } = req.body;

    let customer = await Customer.findOne({_id:id});
    console.log(customer);

    if (customer) {

        if (customer.block) {
            return res.status(400).send({error: 'Your account is blocked by admin', field: 'phone'});
        }

        if (!customer.type) {
            console.log('customer.type', customer.type);
            console.log('type', type);
            if ((!type) || !(type === 'vendor' || type === 'customer')){
                return res.status(400).send({error:'Type is required (vendor/customer)', field:'type'});
            }
            customer.type = type;
        }
        // check otp generated
        if (!(customer.otp || customer.otpExpiry)) {
            return res.status(400).send({error: "OTP not generated"});
        }

        // check if otp is expired
        if (customer.otpExpiry < Date.now()) {
            return res.status(400).send({error: "OTP expired"});
        }
        if (customer.otp === otp) {
            // customer.otp_expiry = Date.now() + (60 * 1000);
            customer.otp = null;
            customer.otpExpiry = null;
            // save jws token
            customer.token = jwt.sign({ id: customer._id, loginType:'customer'  }, config.CUSTOMER_LOGIN_SECRET, { expiresIn: '30d' });

            await customer.save();
            return res.send({ data:customer });
        }else{
            return res.status(400).send({error: "Invalid OTP", field: 'otp'});
        }
    }else{
        return res.status(400).send({error: "Invalid Customer Id", field: 'id'});
    }
});

router.post("/logout", customer_auth, async (req, res) => {


    // let customer = await Customer.findOne({_id:_id});
    console.log(req.customer);
    Customer.updateOne({_id:req.customer._id}, {token:null}, (err, _) => {
       if (err) {
           return res.status(400).send({error: err});
       }
        return res.status(200).send({data: "Successfully logged out"});
    });
});

module.exports = router;