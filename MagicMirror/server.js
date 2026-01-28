require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const { checkForAuthMid } = require("./middlewares/authentication");

// Routes & Models
const userRoutes = require("./routes/userRoutes");
const indexRoutes = require('./routes/index');
const newsRoutes = require('./routes/news');
const collegeInfoRoutes = require('./routes/collegeInfo');
const galleryRoutes = require('./routes/gallery');
const News = require("./models/News");
const Notice = require('./models/Notice');
const CollegeInfo = require('./models/CollegeInfo');
const Gallery = require('./models/Gallery');

const app = express();
const port = process.env.PORT ;

// --- CONNECT TO MONGO ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB Connection Error:', err));

// --- MIDDLEWARES ---
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// --- VIEW ENGINE ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- DATA API ROUTES ---
app.get('/notices/data', async (req, res) => {
  try {
    const userId = req.query.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    const data = await Notice.find({ createdBy: userId }).sort({ createdAt: -1 }).limit(10);
    res.json(data);
  } catch (err) {
    console.error('Error fetching notices:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/news/data', async (req, res) => {
  try {
    const userId = req.query.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    const data = await News.find({ createdBy: userId }).sort({ createdAt: -1 }).limit(10);
    res.json(data);
  } catch (err) {
    console.error('Error fetching news:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/college-info/data', async (req, res) => {
  try {
    const userId = req.query.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    const data = await CollegeInfo.findOne({ createdBy: userId }).sort({ updatedAt: -1 });
    res.json(data);
  } catch (err) {
    console.error('Error fetching college info:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/gallery/data', async (req, res) => {
  try {
    const userId = req.query.id;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    const data = await Gallery.find({ createdBy: userId }).sort({ updatedAt: -1 });
    res.json(data);
  } catch (err) {
    console.error('Error fetching gallery:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- AUTH ROUTES ---
// Logout
app.get("/logout", (req, res) => {
  res.clearCookie("token"); // clear auth cookie
  res.redirect("/user/login");
});

// Public routes
app.use("/user", userRoutes); // login/signup

// --- ROOT REDIRECT ---
// Anyone visiting `/` gets login page if not logged in
app.get('/', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/user/login');
  res.redirect('/dashboard'); // if logged in, go to dashboard
});

// --- PROTECTED ROUTES ---
// Admin panel and other protected routes
app.use('/dashboard', checkForAuthMid("token"), indexRoutes);
app.use('/news', checkForAuthMid("token"), newsRoutes);
app.use('/college-info', checkForAuthMid("token"), collegeInfoRoutes);
app.use('/gallery', checkForAuthMid("token"), galleryRoutes);

// --- START SERVER ---
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
