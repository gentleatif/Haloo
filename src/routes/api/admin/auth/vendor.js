const express = require('express');
const router = express.Router();
const Vendor = require('../../../models/user_management/vendor');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const upload = require('../../../controller/multer');
const config = process.env;
const generate_otp = require('../../../utils/generate_otp');

router.post('/generate_otp', async (req,res) =>{
    console.log('Got query:', req.query);
    console.log('Got body:', req.body);

    let { phone } = req.body;

    // check if phone number is already registered
    let vendor = await Vendor.findOne({phone});

    if (vendor) {
        otp = generate_otp(4);
        console.log(otp);
        vendor.otp = otp;
        // customer.otp_expiry = Date.now() + (60 * 1000);
        await vendor.save();
        console.log(otp);
        return res.send({data:{vendorId:vendor._id }});
        // return res.status(400).send({error: "Phone number already registered"});
    }else{
        otp = generate_otp(4);
        let vendor = new Vendor({
            phone,
            otp
        });
        await vendor.save();
        console.log(otp);
        return res.send({data:{vendorId:vendor._id, otp}});
    }
})



router.post("/verify_otp", async (req, res) => {

    let { vendorId, otp } = req.body;

    let vendor = await Vendor.findOne({_id:vendorId});

    if (vendor) {
        console.log(vendor.otp);
        console.log(otp);
        if (vendor.otp == otp) {
            // customer.otp_expiry = Date.now() + (60 * 1000);
            vendor.otp = null;
            // save jws token
            let token = jwt.sign({ _id: vendor._id, type:'vendor' }, 'config.TOKEN_KEY', { expiresIn: '365d' });
            vendor.token = token;
            await vendor.save();
            return res.send({data:{vendor:vendor}});
        }else{
            return res.status(400).send({error: "Invalid OTP"});
        }
    }else{
        return res.status(400).send({error: "Invalid Vendor Id"});
    }
  });

module.exports = router;