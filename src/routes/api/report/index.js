const express = require('express');
const router = express.Router();

router.use('/adminreport', require('./admin_report'));

module.exports = router;