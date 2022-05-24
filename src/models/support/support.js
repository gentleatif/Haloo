var mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'customer',
        required: true,
    },
    query: {
        type: String,
    },
    status: {
        type: String,
        default: 'pending',
    },
    supportImage: {
        type: String,
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'job',
        required: true,
    },
}, {
    timestamps: true,
});

const Support = mongoose.model('support', supportSchema);
module.exports = Support;