const mongoose = require('mongoose');

const socialMediaSchema = new mongoose.Schema({
    platform: {
        type: String,
        required: true
    },
    handle: {
        type: String,
        required: true
    },
    url: String
});

const collegeInfoSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    tagline: String,
    logoUrl: String,
    established: String,
    address: String,
    phone: String,
    email: String,
    website: String,
    socialMedia: [socialMediaSchema],
    departments: [String],
    facilities: [String],
    updatedAt: {
        type: Date,
        default: Date.now
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('CollegeInfo', collegeInfoSchema); 