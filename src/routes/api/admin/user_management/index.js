const express = require('express');
const router = express.Router();

router.use('/customer', require('./customer'));
// router.use('/vendor', require('./vendor'));
router.use('/admin', require('./admin'));
router.use('/codrequest', require('./codrequest'));


module.exports = router;