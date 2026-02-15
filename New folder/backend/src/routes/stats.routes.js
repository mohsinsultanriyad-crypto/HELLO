const express = require("express");
const Job = require("../models/Job");

const router = express.Router();

router.get("/trending-roles", async (req, res) => {
  const now = new Date();
  const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const jobs = await Job.find({
    deleted: false,
    expiresAt: { $gt: now },
    createdAt: { $gte: from }
  }).lean();

  const map = new Map();
  for (const j of jobs) {
    const role = (j.jobRole || "").trim();
    if (!role) continue;
    const score = 1 + (Number(j.views || 0) * 0.2);
    map.set(role, (map.get(role) || 0) + score);
  }

  const list = Array.from(map.entries())
    .map(([role, score]) => ({ role, score: Math.round(score * 10) / 10 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  res.json({ ok: true, trending: list });
});

module.exports = router;
