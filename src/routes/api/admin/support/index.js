const express = require('express');
const router = express.Router();

router.use('/support', require('./support'));

module.exports = router;