const express = require("express");
const Token = require("../models/Token");
const { isNonEmptyString, normalizeRoles } = require("../utils/validate");

const router = express.Router();

router.post("/save", async (req, res) => {
  const { token, roles, newsEnabled, city } = req.body || {};
  if (!isNonEmptyString(token)) return res.status(400).json({ ok: false, message: "token required" });

  const rolesArr = normalizeRoles(roles);
  const cityStr = typeof city === "string" ? city.trim() : "";

  const doc = await Token.findOneAndUpdate(
    { token: token.trim() },
    {
      $set: {
        roles: rolesArr,
        newsEnabled: typeof newsEnabled === "boolean" ? newsEnabled : true,
        city: cityStr,
        updatedAt: new Date()
      },
      $setOnInsert: { createdAt: new Date() }
    },
    { upsert: true, new: true }
  );

  res.json({ ok: true, tokenId: doc._id });
});

router.post("/alerts-opened", async (req, res) => {
  const { token } = req.body || {};
  if (!isNonEmptyString(token)) return res.status(400).json({ ok: false });

  await Token.updateOne(
    { token: token.trim() },
    { $set: { badgeCount: 0, lastOpenedAlertsAt: new Date(), updatedAt: new Date() } }
  );

  res.json({ ok: true });
});

router.get("/badge", async (req, res) => {
  const token = (req.query.token || "").toString().trim();
  if (!token) return res.status(400).json({ ok: false });

  const doc = await Token.findOne({ token }).lean();
  res.json({ ok: true, badgeCount: doc?.badgeCount || 0 });
});

module.exports = router;
