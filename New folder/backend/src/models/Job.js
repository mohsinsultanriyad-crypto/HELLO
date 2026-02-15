const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    name: String,
    companyName: String,
    phone: String,
    email: String,
    city: String,
    jobRole: String,
    description: String,

    urgent: { type: Boolean, default: false },
    urgentUntil: { type: Date, default: null },

    views: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },

    deleted: { type: Boolean, default: false }
  },
  { versionKey: false }
);

JobSchema.index({ expiresAt: 1 });
JobSchema.index({ createdAt: -1 });
JobSchema.index({ email: 1 });

module.exports = mongoose.model("Job", JobSchema);
