const Token = require("../models/Token");
const Job = require("../models/Job");
const { sendPushToTokens, incrementBadgeForTokens } = require("./fcm.service");

function startOfTodayRiyadh() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function sendMorningDigest() {
  const now = new Date();
  const todayStart = startOfTodayRiyadh();

  const tokenDocs = await Token.find({
    roles: { $exists: true, $ne: [] },
    $or: [{ lastDigestAt: null }, { lastDigestAt: { $lt: todayStart } }]
  }).lean();

  if (!tokenDocs.length) return { ok: true, sent: 0 };

  const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const jobs = await Job.find({
    deleted: false,
    expiresAt: { $gt: now },
    createdAt: { $gte: from }
  }).lean();

  const roleCount = new Map();
  for (const j of jobs) {
    const r = (j.jobRole || "").trim();
    if (!r) continue;
    roleCount.set(r, (roleCount.get(r) || 0) + 1);
  }

  let sent = 0;

  for (const t of tokenDocs) {
    const roles = Array.isArray(t.roles) ? t.roles : [];
    let bestRole = "";
    let bestCount = 0;

    for (const r of roles) {
      const c = roleCount.get(r) || 0;
      if (c > bestCount) {
        bestCount = c;
        bestRole = r;
      }
    }

    await Token.updateOne({ _id: t._id }, { $set: { lastDigestAt: now, updatedAt: now } });

    if (bestCount <= 0) continue;

    await sendPushToTokens([t.token], {
      notification: {
        title: "Morning Jobs Digest",
        body: `${bestCount} new ${bestRole} jobs • Tap to open`
      },
      data: {
        clickTarget: "alerts",
        jobRole: bestRole
      }
    });

    await incrementBadgeForTokens([t], 1);
    sent += 1;
  }

  return { ok: true, sent };
}

module.exports = { sendMorningDigest };
