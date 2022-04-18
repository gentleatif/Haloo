const express = require('express');
const router = express.Router();

router.use('/category', require('./category'));
router.use('/subcategory', require('./sub_category'));
router.use('/city', require('./city'));
router.use('/state', require('./state'));

module.exports = router;