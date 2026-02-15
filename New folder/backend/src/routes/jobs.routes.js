const express = require("express");
const Job = require("../models/Job");
const Token = require("../models/Token");
const { isNonEmptyString } = require("../utils/validate");
const { sendPushToTokens, incrementBadgeForTokens } = require("../services/fcm.service");

const router = express.Router();

function calcExpiresAt(createdAt) {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + 15);
  return d;
}

router.get("/", async (req, res) => {
  const now = new Date();

  const jobs = await Job.find({
    deleted: false,
    expiresAt: { $gt: now }
  })
    .sort({ urgentUntil: -1, createdAt: -1 })
    .lean();

  const mapped = jobs.map(j => ({
    ...j,
    urgent: !!(j.urgentUntil && new Date(j.urgentUntil) > now)
  }));

  res.json({ ok: true, jobs: mapped });
});

router.post("/", async (req, res) => {
  const b = req.body || {};
  const required = ["name", "phone", "email", "city", "jobRole", "description"];
  for (const k of required) {
    if (!isNonEmptyString(b[k])) return res.status(400).json({ ok: false, message: `${k} required` });
  }

  const createdAt = new Date();
  const urgent = !!b.urgent;
  const urgentUntil = urgent ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000) : null;

  const job = await Job.create({
    name: b.name.trim(),
    companyName: (b.companyName || "").toString().trim(),
    phone: b.phone.trim(),
    email: b.email.trim().toLowerCase(),
    city: b.city.trim(),
    jobRole: b.jobRole.trim(),
    description: b.description.trim(),
    urgent,
    urgentUntil,
    views: 0,
    createdAt,
    expiresAt: calcExpiresAt(createdAt),
    deleted: false
  });

  const role = job.jobRole;
  const tokenDocs = await Token.find({ roles: role }).lean();
  const tokens = tokenDocs.map(t => t.token);

  await sendPushToTokens(tokens, {
    notification: {
      title: `New Job: ${role}`,
      body: `${job.city} • Tap to open`
    },
    data: {
      clickTarget: "alerts",
      jobRole: role,
      jobId: String(job._id)
    }
  });

  await incrementBadgeForTokens(tokenDocs, 1);

  res.json({ ok: true, job });
});

router.patch("/:id/view", async (req, res) => {
  const { id } = req.params;

  const job = await Job.findOneAndUpdate(
    { _id: id, deleted: false },
    { $inc: { views: 1 } },
    { new: true }
  ).lean();

  if (!job) return res.status(404).json({ ok: false, message: "Not found" });
  res.json({ ok: true, views: job.views });
});

router.get("/myposts/by-email", async (req, res) => {
  const email = (req.query.email || "").toString().trim().toLowerCase();
  if (!email) return res.status(400).json({ ok: false, message: "email required" });

  const jobs = await Job.find({ email, deleted: false })
    .sort({ createdAt: -1 })
    .lean();

  res.json({ ok: true, jobs });
});

router.patch("/:id/edit", async (req, res) => {
  const { id } = req.params;
  const b = req.body || {};
  const email = (b.email || "").toString().trim().toLowerCase();
  if (!email) return res.status(400).json({ ok: false, message: "email required" });

  const job = await Job.findOne({ _id: id, deleted: false }).lean();
  if (!job) return res.status(404).json({ ok: false, message: "Not found" });
  if (job.email !== email) return res.status(403).json({ ok: false, message: "email mismatch" });

  const update = {};
  if (typeof b.companyName === "string") update.companyName = b.companyName.trim();
  if (typeof b.phone === "string") update.phone = b.phone.trim();
  if (typeof b.city === "string") update.city = b.city.trim();
  if (typeof b.jobRole === "string") update.jobRole = b.jobRole.trim();
  if (typeof b.description === "string") update.description = b.description.trim();

  if (typeof b.urgent === "boolean") {
    update.urgent = b.urgent;
    update.urgentUntil = b.urgent ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;
  }

  const updated = await Job.findOneAndUpdate(
    { _id: id, deleted: false },
    { $set: update },
    { new: true }
  ).lean();

  res.json({ ok: true, job: updated });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const email = (req.body?.email || "").toString().trim().toLowerCase();
  if (!email) return res.status(400).json({ ok: false, message: "email required" });

  const job = await Job.findOne({ _id: id, deleted: false }).lean();
  if (!job) return res.status(404).json({ ok: false, message: "Not found" });
  if (job.email !== email) return res.status(403).json({ ok: false, message: "email mismatch" });

  await Job.updateOne({ _id: id }, { $set: { deleted: true } });
  res.json({ ok: true });
});

module.exports = router;
