const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const News = require('../models/News');
const { requireAuth } = require("../middlewares/authentication");


router.use(requireAuth);
// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  }
});

// Route to update priorities - MUST come before /:id routes
router.post('/update-priority', async (req, res) => {
    try {
        const { items } = req.body;
        
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Invalid request format' });
        }

        // Use Promise.all to update all items concurrently
        await Promise.all(items.map(async (item) => {
            if (!item.id || typeof item.priority !== 'number') {
                throw new Error('Invalid item format');
            }
            
            await Notice.findByIdAndUpdate(item.id, { 
                priority: item.priority,
                updatedAt: new Date()
            });
        }));
        
        res.json({ success: true, message: 'Priorities updated successfully' });
    } catch (err) {
        console.error('Error updating priorities:', err);
        res.status(500).json({ error: 'Failed to update priorities' });
    }
});

// Notices admin panel home page
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    // Get total count of notices for pagination
    const totalNotices = await Notice.countDocuments();
    const totalPages = Math.ceil(totalNotices / limit) || 1; // Ensure at least 1 page
    
    console.log("User Id for current useer is : ", req.user._id);
    // Get notices for current page, sorted by date (newest first)
    const newsItems = await Notice.find({ createdBy: req.user._id }) // Keeping newsItems variable name for template compatibility
      .sort({ priority: -1, date: -1 })
      .skip(skip)
      .limit(limit);
    
    res.render('news/index', { 
      newsItems, // Keeping newsItems variable name for template compatibility
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      user: req.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Route to add a new notice
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const notice = new Notice({
      title: req.body.title,
      content: req.body.content,
      priority: req.body.priority,
      imageUrl: req.file ? '/uploads/' + req.file.filename : '',
      createdBy: req.user._id, // Assuming you have user info in req.user
    });
    
    await notice.save();
    res.redirect('/news');
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
});

// Route to get a notice for editing
router.get('/:id/edit', async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).send('Notice not found');
    res.render('news/edit', { newsItem: notice }); // Keeping newsItem variable name for template compatibility
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Route to update a notice
router.post('/:id', upload.single('image'), async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).send('Notice not found');
    
    const updateData = {
      title: req.body.title,
      content: req.body.content,
      priority: req.body.priority
    };
    
    // If a new image was uploaded, update the imageUrl
    if (req.file) {
      // Delete old image if it exists
      if (notice.imageUrl) {
        const oldImagePath = path.join(__dirname, '../public', notice.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updateData.imageUrl = '/uploads/' + req.file.filename;
    }
    
    await Notice.findByIdAndUpdate(req.params.id, updateData);
    res.redirect('/news');
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
});

// Route to delete a notice
router.post('/:id/delete', async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).send('Notice not found');
    
    // Delete image file if it exists
    if (notice.imageUrl) {
      const imagePath = path.join(__dirname, '../public', notice.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await Notice.findByIdAndDelete(req.params.id);
    res.redirect('/news');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// API endpoint to get top 10 notices for Magic Mirror
router.get('/api', async (req, res) => {
  try {
    // Get the 10 most recent notices, sorted by date (newest first) and priority (highest first)
    const notices = await News.find()
      .sort({ priority: -1, date: -1 })
      .limit(10);
    console.log("There is a req");
    
    res.json(notices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router; 