const express = require('express');
const router = express.Router();


module.exports = function() {
    router.use('/', require('./staticfile'));
    return router
}