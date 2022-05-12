const express = require('express');
const router = express.Router();


module.exports = function() {

    router.use('/api', require('./api')());

    return router
}







// module.exports = function(app, io) {
//     return app.use('/api', require('./api/index.js'));
// }