const express = require('express');
const router = express.Router();

router.use('/email', require('./email'));
router.use('/master', require('./master'));
router.use('/socialmedia', require('./social_media'));

module.exports = router;