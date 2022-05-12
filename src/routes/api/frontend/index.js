const express = require('express');
const router = express.Router();


module.exports = function() {
    router.use('/auth', require('./auth')());
    router.get('/', (req, res) => { console.log('req.user',req.user);res.send('Hello World!'); });

    return router
}