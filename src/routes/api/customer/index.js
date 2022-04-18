const express = require('express');
const router = express.Router();

// router.use('/requestprovider', require('./request_provider'));
// router.use('/', require('./provider_detail'));


// module.exports = router;

module.exports = function(getIOInstance) {
    // app.use('/api', require('./api/index.js')(io));
    router.use('/requestprovider', require('./request_provider')(getIOInstance));
    router.use('/', require('./provider_detail'));

    return router
}