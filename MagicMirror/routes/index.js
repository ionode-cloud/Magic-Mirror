const express = require('express');
const router = express.Router();
const News = require('../models/News');
const Notice = require('../models/Notice');
// Admin panel home page - shows form to add news and lists recent news with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Get total count of news for pagination
    const totalNews = await News.countDocuments();
    const totalPages = Math.ceil(totalNews / limit) || 1; // Ensure at least 1 page

    if (req.user && req.user._id) {
      // Get news for current page, sorted by date (newest first)
      const newsItems = await News.find({ createdBy: req.user._id }) // Keeping newsItems variable name for template compatibility  
        .sort({ priority: -1, date: -1 })
        .skip(skip)
        .limit(limit);

      // Debug information
      console.log('Pagination info:', {
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        user: req.user,
      });

      res.render('index', {
        notices: newsItems || [],
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        user: req.user,
      });

    }
    else {
      res.render('login');
    }

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Route to update priorities - MUST come before /notices/:id routes
router.post('/notices/update-priority', async (req, res) => {
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

      await News.findByIdAndUpdate(item.id, {
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

// Route to add a new news item
router.post('/notices', async (req, res) => {
  try {
    const newsItem = new News({
      title: req.body.title,
      content: req.body.content,
      priority: req.body.priority,
      createdBy: req.user._id,
    });

    await newsItem.save();
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
});

// Route to get a news item for editing
router.get('/notices/:id/edit', async (req, res) => {
  try {
    const newsItem = await News.findById(req.params.id);
    if (!newsItem) return res.status(404).send('News item not found');
    res.render('edit', { notice: newsItem });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Route to update a news item
router.post('/notices/:id', async (req, res) => {
  try {
    await News.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      content: req.body.content,
      priority: req.body.priority
    });
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
});

// Route to delete a news item
router.post('/notices/:id/delete', async (req, res) => {
  try {
    await News.findByIdAndDelete(req.params.id);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// API endpoint to get top 10 news items for Magic Mirror
router.get('/api/notices', async (req, res) => {
  try {
    // Get the 10 most recent news items, sorted by date (newest first) and priority (highest first)
    const newsItems = await Notice.find({ createdBy: req.user._id })
      .sort({ priority: -1, date: -1 })
      .limit(10);
    console.log("Server got req");

    res.json(newsItems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router; 