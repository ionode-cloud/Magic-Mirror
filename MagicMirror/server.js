require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
// const session = require("express-session");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const { checkForAuthMid } = require("./middlewares/authentication");
const userRoutes = require("./routes/userRoutes");
const News = require("./models/News");
const Notice = require('./models/Notice');
const CollegeInfo = require('./models/CollegeInfo');
const Gallery = require('./models/Gallery');

dotenv.config(); // Load environment variables

const app = express();
const port = process.env.PORT;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error(' MongoDB Connection Error:', err));

// Enable CORS
app.use(cors({
  origin: '*',  // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
// app.use(checkForAuthMid("token"));


// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware for parsing requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Import Routes
const indexRoutes = require('./routes/index');
const newsRoutes = require('./routes/news');
const collegeInfoRoutes = require('./routes/collegeInfo');
const galleryRoutes = require('./routes/gallery');



// Direct read and write data routes
app.get('/notices/data', async (req, res) => {
  try {
    const userId = req.query.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const data = await Notice.find({ createdBy: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(data);
  } catch (err) {
    console.error('Error fetching user news:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/news/data', async (req, res) => {
  try {
    const userId = req.query.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const data = await News.find({ createdBy: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(data);
  } catch (err) {
    console.error('Error fetching user news:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/college-info/data', async (req, res) => {
  try {
    const userId = req.query.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const data = await CollegeInfo.findOne({ createdBy: userId }).sort({ updatedAt: -1 });
    console.log("Data fetched from DB:", data);

    res.json(data);
  } catch (err) {
    console.error('Error fetching user college-info :', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/gallery/data', async (req, res) => {
  try {
    const userId = req.query.id;
    console.log("User ID:", userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const data = await Gallery.find({ createdBy: userId }).sort({ updatedAt: -1 });
    console.log("Data fetched from DB:", data);

    res.json(data);
  } catch (err) {
    console.error('Error fetching user gallery :', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Authentication Routes
// --- LOGOUT ---
app.get("/logout", (req, res) => {
  // Clear token and redirect to login
  res.clearCookie("token");
  res.redirect("/user/login");
});

// --- USER ROUTES ---
app.use("/user", userRoutes); // login/signup routes

// --- ROOT ROUTE ---
app.get('/', (req, res) => {
  const token = req.cookies.token;
  if(!token){
    return res.redirect('/user/login'); // not logged in → login page
  }
  res.redirect('/dashboard'); // logged in → admin panel
});

// --- PROTECTED ROUTES ---
app.use('/dashboard', checkForAuthMid("token"), indexRoutes); // admin panel
app.use('/news', checkForAuthMid("token"), newsRoutes);
app.use('/college-info', checkForAuthMid("token"), collegeInfoRoutes);
app.use('/gallery', checkForAuthMid("token"), galleryRoutes);

// Start Express Server
app.listen(port, () => {
  console.log(` Server running at http://localhost:${port}`);
});
