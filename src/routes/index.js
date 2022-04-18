const express = require('express');
const router = express.Router();


module.exports = function(getIOInstance) {
    // app.use('/api', require('./api/index.js')(io));
    router.use('/api', require('./api/index.js')(getIOInstance));

    return router
}







// module.exports = function(app, io) {
//     return app.use('/api', require('./api/index.js'));
// }