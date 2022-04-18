const express = require('express');
const router = express.Router();

router.use('/admin', require('./admin'));
router.use('/customer', require('./customer'));
// router.use('/vendor', require('./vendor'));
module.exports = router;