const jwt = require("jsonwebtoken");

// file imprt
const config = require("../../config");
const Customer = require('../models/user_management/customer');

const verifyToken = (req, res, next) => {
    const token = req.headers["x-access-token"];
    // req.body.token || req.query.token || req.headers["x-access-token"];

    if (!token) {
        return res.status(403).send({error:"A token is required for authentication"});
    }
    try {
        const decoded = jwt.verify(token, config.CUSTOMER_LOGIN_SECRET);

        console.log("decoded", decoded);

        if (decoded.loginType !== "customer") {
            return res.status(403).send({error:"You are not authorized to access this resource"});
        }

        Customer.findOne({_id: decoded.id}, (err, customer) => {
            if (err) {
                return res.status(403).send({error:"Server error"});
            }
            console.log("customer", customer);
            if (!customer) {
                return res.status(403).send({error:"Customer not found"});
            }
            if (customer.token !== token) {
                return res.status(403).send({error:"Invalid token"});
            }
            //check block
            if (customer.block) {
                return res.status(403).send({error:"Your account has been blocked by the admin"});
            }

            req.customer = customer;
            next();
        });
    } catch (err) {
        console.log("err", err);
        return res.status(401).send({error:"Invalid Token"});
    }
};

module.exports = verifyToken;


// TODO:Add block verify here