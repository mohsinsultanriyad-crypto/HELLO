const mongoose = require("mongoose");

const NewsSchema = new mongoose.Schema(
  {
    title: String,
    link: { type: String, unique: true },
    source: String,
    publishedAt: Date,
    thumbnail: String,
    summary: String,

    important: { type: Boolean, default: false },

    // ✅ tracking to limit pushes/day correctly
    pushedAt: { type: Date, default: null },

    createdAt: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

NewsSchema.index({ publishedAt: -1 });
module.exports = mongoose.model("News", NewsSchema);
