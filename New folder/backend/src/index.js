const express = require("express");
const cors = require("cors");
const cron = require("node-cron");

const { PORT, CORS_ORIGIN, TZ } = require("./config");
const { connectDB } = require("./db");
const { initFirebaseAdmin } = require("./firebaseAdmin");

const jobsRoutes = require("./routes/jobs.routes");
const tokensRoutes = require("./routes/tokens.routes");
const newsRoutes = require("./routes/news.routes");
const statsRoutes = require("./routes/stats.routes");

const { pullLatestNewsAndSave } = require("./services/news.service");
const { cleanupExpiredJobs } = require("./services/cleanup.service");
const { sendMorningDigest } = require("./services/digest.service");

process.env.TZ = TZ || "Asia/Riyadh";

async function boot() {
  await connectDB();
  initFirebaseAdmin();

  const app = express();
  app.use(cors({ origin: CORS_ORIGIN === "*" ? "*" : CORS_ORIGIN }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/", (req, res) => res.send("SAUDI JOB Backend v1.3.1 ✅"));

  app.use("/api/jobs", jobsRoutes);
  app.use("/api/tokens", tokensRoutes);
  app.use("/api/news", newsRoutes);
  app.use("/api/stats", statsRoutes);

  // 30 min news cron
  cron.schedule("*/30 * * * *", async () => {
    try { await pullLatestNewsAndSave(); }
    catch (e) { console.log("News cron error:", e.message); }
  });

  // daily cleanup 3:10 AM
  cron.schedule("10 3 * * *", async () => {
    try { await cleanupExpiredJobs(); }
    catch (e) { console.log("Cleanup cron error:", e.message); }
  });

  // morning digest 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    try { await sendMorningDigest(); }
    catch (e) { console.log("Digest cron error:", e.message); }
  });

  // run once on boot
  pullLatestNewsAndSave().catch(() => {});
  cleanupExpiredJobs().catch(() => {});

  app.listen(PORT, () => console.log(`✅ Backend running on :${PORT}`));
}

boot().catch(err => {
  console.error("BOOT FAILED:", err);
  process.exit(1);
});
