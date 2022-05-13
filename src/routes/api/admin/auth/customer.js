const express = require('express');
const router = express.Router();
const Customer = require('../../../../models/user_management/customer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = process.env;
const generate_otp = require('../../../../utils/generate_otp');
const auth = require('../../../../middleware/auth');

router.post('/generate_otp', async (req,res) =>{
    console.log('Got query:', req.query);
    console.log('Got body:', req.body);

    let { phone } = req.body;

    if (!phone) {
        return res.status(400).send({error: 'Phone number is required', field: 'phone'});
    }
    // check phone number is int or not
    if(phone.length != 10 || isNaN(phone)){
        return res.status(400).send({error: 'Phone number must be 10 digits', field: 'phone'});
    }

    // check if phone number is already registered
    let customer = await Customer.findOne({phone});

    console.log('customer', customer);

    if (customer) {
        // check block
        if (customer.block) {
            return res.status(400).send({error: 'Your account is blocked by admin', field: 'phone'});
        }


        otp = generate_otp(4);
        customer.otp = otp;
        customer.otpExpiry = Date.now() + (2 * 60 * 1000);
        await customer.save();
        console.log(otp);
        if(!customer.type){
            return res.send({data:{_id:customer._id, newUser:true }});
        }
        return res.send({data:{_id:customer._id, newUser:false }});
        // return res.status(400).send({error: "Phone number already registered"});
    }else{
        otp = generate_otp(4);
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

    let { _id, otp, type } = req.body;

    let customer = await Customer.findOne({_id:_id});
    console.log(customer);

    if (customer) {

        if (customer.block) {
            return res.status(400).send({error: 'Your account is blocked by admin', field: 'phone'});
        }
        
        if (!customer.type) {
            console.log('customer.type', customer.type);
            console.log('type', type);
            console.log(type != 'vendor' || type != 'customer')
            if ((!type) || !(type == 'vendor' || type == 'customer')){
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
        if (customer.otp == otp) {
            // customer.otp_expiry = Date.now() + (60 * 1000);
            customer.otp = null;
            customer.otpExpiry = null;
            // save jws token
            let token = jwt.sign({ _id: customer._id, loginType:'user',  }, 'config.TOKEN_KEY', { expiresIn: '30d' });
            customer.token = token;
            await customer.save();
            return res.send({ data:customer });
        }else{
            return res.status(400).send({error: "Invalid OTP", field: 'otp'});
        }
    }else{
        return res.status(400).send({error: "Invalid Customer Id", field: '_id'});
    }
  });

router.post("/logout", auth, async (req, res) => {

    var _id = req.user._id;

    if (req.user.loginType != 'user'){
        return res.status(400).send({error:'Invalid login type'});
    }
    if(!_id){
        return res.status(400).send({error:'Unable to get id from token please relogin'});
    }

    let customer = await Customer.findOne({_id:_id});
    console.log(customer);

    if (customer) {

        customer.token = null;
        await customer.save();
        return res.status(200).send({data: "Successfully logged out"});
        
    }else{
        return res.status(400).send({error: "Invalid Customer Id from token please relogin"});
    }
  });

module.exports = router;