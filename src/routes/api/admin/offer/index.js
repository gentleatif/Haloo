const express = require('express');
const router = express.Router();

router.use('/', require('./offer.js'));

module.exports = router;