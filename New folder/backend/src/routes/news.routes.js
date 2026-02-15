const express = require("express");
const News = require("../models/News");

const router = express.Router();

router.get("/", async (req, res) => {
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "30", 10)));
  const news = await News.find({})
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  res.json({ ok: true, news });
});

module.exports = router;
