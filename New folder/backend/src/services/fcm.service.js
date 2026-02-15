const admin = require("firebase-admin");
const Token = require("../models/Token");

async function sendPushToTokens(tokens, message) {
  if (!tokens || !tokens.length) return { ok: true, sent: 0 };

  // FCM allows max 500 tokens per call
  const chunks = [];
  for (let i = 0; i < tokens.length; i += 500) chunks.push(tokens.slice(i, i + 500));

  let sent = 0;

  for (const chunk of chunks) {
    const payload = {
      tokens: chunk,
      notification: message.notification,
      data: message.data || {}
    };

    const resp = await admin.messaging().sendEachForMulticast(payload);

    sent += resp.successCount || 0;

    // remove invalid tokens
    const invalid = [];
    resp.responses.forEach((r, idx) => {
      if (!r.success) {
        const code = r.error?.code || "";
        if (
          code.includes("registration-token-not-registered") ||
          code.includes("invalid-argument")
        ) {
          invalid.push(chunk[idx]);
        }
      }
    });

    if (invalid.length) {
      await Token.deleteMany({ token: { $in: invalid } });
    }
  }

  return { ok: true, sent };
}

async function incrementBadgeForTokens(tokenDocs, inc = 1) {
  const ids = (tokenDocs || []).map(t => t._id).filter(Boolean);
  if (!ids.length) return;

  await Token.updateMany({ _id: { $in: ids } }, { $inc: { badgeCount: inc }, $set: { updatedAt: new Date() } });
}

module.exports = { sendPushToTokens, incrementBadgeForTokens };
