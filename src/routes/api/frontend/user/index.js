const express = require('express');
const router = express.Router();


module.exports = function() {
    router.use('/customer', require('./customer'));
    router.use('/vendor', require('./vendor'));
    return router
}