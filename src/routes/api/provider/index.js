const express = require('express');
const router = express.Router();

router.use('/profile', require('./profile_detail'));

module.exports = router;