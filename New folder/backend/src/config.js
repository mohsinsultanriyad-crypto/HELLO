require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 3000,
  MONGO_URL: process.env.MONGO_URL || "",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
  FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "",
  FIREBASE_SERVICE_ACCOUNT_BASE64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || "",
  NEWS_RSS_URL: process.env.NEWS_RSS_URL || "https://www.spa.gov.sa/rss.xml",
  TZ: process.env.TZ || "Asia/Riyadh"
};
