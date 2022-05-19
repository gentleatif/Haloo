const express = require('express');
const router = express.Router();


module.exports = function() {
    router.use('/discount', require('./discount'));
    return router
}