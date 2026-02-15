require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { User, Shift, Leave, Advance, Post, Announcement } = require('./models');

const app = express();
app.use(bodyParser.json({ limit: '5mb' }));

const FRONTEND_URL = process.env.FRONTEND_URL || process.env.VITE_API_FRONTEND || '';
const allowedOrigins = [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'].filter(Boolean);
app.use(cors({ origin: function(origin, callback){
  if(!origin) return callback(null, true);
  if(allowedOrigins.length === 0) return callback(null, true);
  if(allowedOrigins.indexOf(origin) !== -1){ callback(null, true); } else { callback(null, false); }
}}));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fastep';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => { console.error('MongoDB connection error', err); process.exit(1); });

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/data', async (req, res) => {
  try {
    const [workers, shifts, leaves, advances, posts, announcements] = await Promise.all([
      User.find({}).lean(),
      Shift.find({}).lean(),
      Leave.find({}).lean(),
      Advance.find({}).lean(),
      Post.find({}).lean(),
      Announcement.find({}).lean()
    ]);
    res.json({ workers, shifts, leaves, advances, posts, announcements });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load data' });
  }
});

// Replace entire dataset (used by client sync/restore)
app.post('/api/sync', async (req, res) => {
  const { workers = [], shifts = [], leaves = [], advances = [], posts = [], announcements = [] } = req.body || {};
  try {
    // Replace each collection atomically (simple approach)
    await Promise.all([
      User.deleteMany({}), Shift.deleteMany({}), Leave.deleteMany({}), Advance.deleteMany({}), Post.deleteMany({}), Announcement.deleteMany({})
    ]);

    if (workers.length) await User.insertMany(workers);
    if (shifts.length) await Shift.insertMany(shifts);
    if (leaves.length) await Leave.insertMany(leaves);
    if (advances.length) await Advance.insertMany(advances);
    if (posts.length) await Post.insertMany(posts);
    if (announcements.length) await Announcement.insertMany(announcements);

    res.json({ ok: true });
  } catch (err) {
    console.error('Sync error', err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// For admin backup/restore: same as sync
app.post('/api/restore', async (req, res) => {
  const { workers = [], shifts = [], leaves = [], advances = [], posts = [], announcements = [] } = req.body || {};
  try {
    await Promise.all([
      User.deleteMany({}), Shift.deleteMany({}), Leave.deleteMany({}), Advance.deleteMany({}), Post.deleteMany({}), Announcement.deleteMany({})
    ]);
    if (workers.length) await User.insertMany(workers);
    if (shifts.length) await Shift.insertMany(shifts);
    if (leaves.length) await Leave.insertMany(leaves);
    if (advances.length) await Advance.insertMany(advances);
    if (posts.length) await Post.insertMany(posts);
    if (announcements.length) await Announcement.insertMany(announcements);
    res.json({ ok: true });
  } catch (err) {
    console.error('Restore error', err);
    res.status(500).json({ error: 'Restore failed' });
  }
});

// Simple CRUD endpoints (optional; used by future improvements)
app.get('/api/workers', async (req, res) => { res.json(await User.find({}).lean()); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
