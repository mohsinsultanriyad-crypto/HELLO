const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  workerId: String,
  email: String,
  name: String,
  role: { type: String, enum: ['worker', 'admin'], required: true },
  trade: String,
  monthlySalary: Number,
  phone: String,
  photoUrl: String,
  password: String,
  isActive: Boolean,
  iqamaExpiry: String,
  passportExpiry: String
}, { timestamps: true });

const ShiftSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  workerId: String,
  date: String,
  startTime: Number,
  endTime: Number,
  status: String,
  breakMinutes: Number,
  notes: String,
  isApproved: Boolean,
  totalHours: Number,
  estimatedEarnings: Number,
  approvedEarnings: Number,
  advanceTaken: Number
}, { timestamps: true });

const LeaveSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  workerId: String,
  date: String,
  reason: String,
  status: String
}, { timestamps: true });

const AdvanceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  workerId: String,
  workerName: String,
  amount: Number,
  reason: String,
  requestDate: String,
  status: String,
  paymentDate: String
}, { timestamps: true });

const PostSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  authorId: String,
  authorName: String,
  content: String,
  imageUrl: String,
  timestamp: Number
}, { timestamps: true });

const AnnouncementSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  content: String,
  priority: { type: String, enum: ['low','high'] },
  timestamp: Number
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Shift = mongoose.model('Shift', ShiftSchema);
const Leave = mongoose.model('Leave', LeaveSchema);
const Advance = mongoose.model('Advance', AdvanceSchema);
const Post = mongoose.model('Post', PostSchema);
const Announcement = mongoose.model('Announcement', AnnouncementSchema);

module.exports = { User, Shift, Leave, Advance, Post, Announcement };
