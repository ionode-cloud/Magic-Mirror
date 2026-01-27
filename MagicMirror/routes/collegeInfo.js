const express = require('express');
const router = express.Router();
const CollegeInfo = require('../models/CollegeInfo');

// GET college info
router.get('/api', async (req, res) => {
    try {
        // Find the most recent college info (assuming there's only one document)
        let collegeInfo = await CollegeInfo.findOne({ createdBy: req.user._id }).sort({ updatedAt: -1 });

        // If no college info exists, create a default one
        if (!collegeInfo) {
            collegeInfo = await CollegeInfo.create({
                name: "Your College Name",
                tagline: "Excellence in Education",
                logoUrl: "https://via.placeholder.com/100",
                established: "YYYY",
                address: "Your College Address",
                phone: "Your Contact Number",
                email: "contact@college.edu",
                website: "www.college.edu",
                socialMedia: [
                    { platform: "Facebook", handle: "@collegename" },
                    { platform: "Twitter", handle: "@collegename" }
                ],
                departments: ["Department 1", "Department 2"],
                facilities: ["Facility 1", "Facility 2"],
                createdBy: req.user._id,
            });
        }

        res.json(collegeInfo);
    } catch (err) {
        console.error('Error fetching college info:', err);
        res.status(500).json({ error: 'Failed to fetch college info' });
    }
});

// POST to update college info
router.post('/api', async (req, res) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: User not logged in' });
        }

        // Add createdBy to the request body before saving
        req.body.createdBy = userId;

        // Find existing info created by the user
        const existingInfo = await CollegeInfo.findOne({ createdBy: userId }).sort({ updatedAt: -1 });

        if (existingInfo) {
            Object.assign(existingInfo, req.body);
            existingInfo.updatedAt = Date.now();
            await existingInfo.save();
            res.json(existingInfo);
        } else {
            const newInfo = await CollegeInfo.create(req.body);
            res.status(201).json(newInfo);
        }
    } catch (err) {
        console.error('Error updating college info:', err);
        res.status(500).json({ error: 'Failed to update college info' });
    }
});


// GET admin page for editing college info
router.get('/', async (req, res) => {
    try {
        if (req.user && req.user._id) {
            const collegeInfo = await CollegeInfo.findOne({ createdBy: req.user._id }).sort({ updatedAt: -1 });
            res.render('collegeinfo/index', { collegeInfo: collegeInfo || {}, user: req.user });
        }
        else{
            res.render('login'); // Render to login if user is not authenticated
        }
    } catch (err) {
        console.error('Error rendering college info page:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router; 
