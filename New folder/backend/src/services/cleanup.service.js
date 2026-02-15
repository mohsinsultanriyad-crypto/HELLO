const Job = require("../models/Job");

async function cleanupExpiredJobs() {
  const now = new Date();
  // We keep DB rows but mark deleted for safety; or you can deleteMany
  await Job.updateMany(
    { expiresAt: { $lte: now } },
    { $set: { deleted: true } }
  );
}

module.exports = { cleanupExpiredJobs };
