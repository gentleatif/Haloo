const express = require('express');
const MainRouter = express.Router();
const auth = require('../../middleware/auth');



// MainRouter.use('/review', auth, require('./review.js'));
// MainRouter.use('/job', auth, require('./job.js'));
// MainRouter.use('/serviceinfo', auth, require('./service_info'));
// MainRouter.use('/usermanagement', auth, require('./user_management'));
// MainRouter.use('/auth', require('./auth'));
// MainRouter.use('/setting', auth, require('./setting'));
// MainRouter.use('/support', auth, require('./support'));
// MainRouter.use('/staticfile', auth, require('./static_file'));
// MainRouter.use('/dashboard', auth, require('./dashboard'));
// MainRouter.use('/', auth, require('./provider'));
// MainRouter.use('/', auth, require('./customer')(getIOInstance));
// MainRouter.get('/', auth, (req, res) => { console.log('req.user',req.user);res.send('Hello World!'); });

// module.exports = MainRouter;

module.exports = function(razorpayInstance, getIOInstance) {
    // app.use('/api', require('./api/index.js')(io));

    // console.log('razorpayInstance', razorpayInstance);
    // console.log('getIOInstance', getIOInstance);

    MainRouter.use('/review', auth, require('./review.js'));
    MainRouter.use('/job', auth, require('./job.js'));
    MainRouter.use('/serviceinfo', auth, require('./service_info'));
    MainRouter.use('/usermanagement', auth, require('./user_management'));
    MainRouter.use('/auth', require('./auth'));
    MainRouter.use('/setting', auth, require('./setting'));
    MainRouter.use('/support', auth, require('./support'));
    MainRouter.use('/staticfile', auth, require('./static_file'));
    MainRouter.use('/dashboard', auth, require('./dashboard'));
    MainRouter.use('/', auth, require('./provider'));
    MainRouter.use('/', auth, require('./customer')(getIOInstance));
    MainRouter.use('/report', auth, require('./report'));
    MainRouter.use('/', auth, require('./order')(razorpayInstance));
    MainRouter.use('/offer', auth, require('./offer'));
    MainRouter.get('/', (req, res) => { console.log('req.user',req.user);res.send('Hello World!'); });

    return MainRouter;

}