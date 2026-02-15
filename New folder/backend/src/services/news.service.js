const Parser = require("rss-parser");
const axios = require("axios");
const News = require("../models/News");
const Token = require("../models/Token");
const { NEWS_RSS_URL } = require("../config");
const { sendPushToTokens, incrementBadgeForTokens } = require("./fcm.service");

const parser = new Parser({
  customFields: {
    item: [["media:thumbnail", "mediaThumbnail"]]
  }
});

function isImportant(title = "") {
  const t = title.toLowerCase();
  const keys = ["labour", "labor", "iqama", "visa", "work permit", "nitaqat", "ministry", "saudization", "fine", "wage", "salary"];
  return keys.some(k => t.includes(k));
}

async function tryExtractThumbnail(item) {
  // rss thumbnail patterns
  if (item?.enclosure?.url) return item.enclosure.url;
  if (item?.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;

  // sometimes content has image; skip heavy parsing
  return "";
}

async function pullLatestNewsAndSave() {
  const feed = await parser.parseURL(NEWS_RSS_URL);
  const items = feed.items || [];

  let inserted = 0;
  const newlyInsertedImportant = [];

  for (const it of items.slice(0, 20)) {
    const link = (it.link || "").trim();
    if (!link) continue;

    const exists = await News.findOne({ link }).lean();
    if (exists) continue;

    const title = (it.title || "").trim();
    const publishedAt = it.isoDate ? new Date(it.isoDate) : new Date();
    const thumbnail = await tryExtractThumbnail(it);

    const important = isImportant(title);

    const doc = await News.create({
      title,
      link,
      source: feed.title || "Saudi News",
      publishedAt,
      thumbnail,
      summary: (it.contentSnippet || it.content || "").toString().slice(0, 350),
      important,
      pushedAt: null
    });

    inserted += 1;

    if (important) newlyInsertedImportant.push(doc);
  }

  // ✅ Push important news (max 3-4 per day)
  if (newlyInsertedImportant.length) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const pushedToday = await News.countDocuments({
      important: true,
      pushedAt: { $gte: todayStart }
    });

    const remaining = Math.max(0, 4 - pushedToday);
    const toPush = newlyInsertedImportant.slice(0, remaining);

    if (toPush.length) {
      const tokensDocs = await Token.find({ newsEnabled: true }).lean();
      const tokens = tokensDocs.map(t => t.token);

      for (const n of toPush) {
        await sendPushToTokens(tokens, {
          notification: {
            title: "Saudi Labour News",
            body: `${n.title.slice(0, 70)} • Tap to read`
          },
          data: {
            clickTarget: "updates",
            newsLink: n.link
          }
        });

        await News.updateOne({ _id: n._id }, { $set: { pushedAt: new Date() } });
        await incrementBadgeForTokens(tokensDocs, 1);
      }
    }
  }

  return { ok: true, inserted };
}

module.exports = { pullLatestNewsAndSave };
