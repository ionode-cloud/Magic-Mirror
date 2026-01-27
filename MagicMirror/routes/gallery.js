const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
            const limit = 10;
            const skip = (page - 1) * limit;
            
            // Get total count of notices for pagination
            const totalMedias = await Gallery.countDocuments();
            const totalPages = Math.ceil(totalMedias / limit) || 1; // Ensure at least 1 page
            
            console.log("User Id for current useer is : ", req.user._id);
            // Get notices for current page, sorted by date (newest first)
            const galleryItems = await Gallery.find({ createdBy: req.user._id }) // Keeping newsItems variable name for template compatibility
              .sort({ priority: -1, date: -1 })
              .skip(skip)
              .limit(limit);
            
            console.log("Data fetched from DB Gallery:", galleryItems);
            res.render('gallery/index', {
                gallery: galleryItems || {},
                currentPage: page,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                user: req.user,
            });
        
    } catch (err) {
        console.error('Error rendering college info page:', err);
        res.status(500).send('Server error');
    }
});

router.post('/', async (req, res) => {
  try {
    const galleryItem = new Gallery({
      name: req.body.name,
      url: req.body.url,
      priority: req.body.priority,
      createdBy: req.user._id,
    });

    await galleryItem.save();
    res.redirect('/gallery');
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
});

router.get('/:id/edit', async (req, res) => {
  try {
    const galleryItem = await Gallery.findById(req.params.id);
    if (!galleryItem) return res.status(404).send('Gallery item not found');
    res.render('edit', { gallery: galleryItem });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.post('/:id/delete', async (req, res) => {
  try {
    const galleryItem = await Gallery.findById(req.params.id);
    if (!galleryItem) return res.status(404).send('Medias not found');
    
    await Gallery.findByIdAndDelete(req.params.id);
    res.redirect('/gallery');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

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
            
            await Gallery.findByIdAndUpdate(item.id, { 
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

module.exports = router;