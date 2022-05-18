const express = require('express');
const router = express.Router();
const customer_auth = require('../../../middleware/customer_auth');

module.exports = function() {
    router.use('/auth', require('./auth')());
    router.use('/user',customer_auth, require('./user')());
    router.use('/serviceinfo',customer_auth, require('./service_info')());
    return router
}