const admin = require("firebase-admin");
const { FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_BASE64 } = require("./config");

let initialized = false;

function parseServiceAccount() {
  if (FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  if (FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const decoded = Buffer.from(FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8");
    return JSON.parse(decoded);
  }
  throw new Error("Firebase service account missing (set FIREBASE_SERVICE_ACCOUNT_JSON or BASE64)");
}

function initFirebaseAdmin() {
  if (initialized) return;
  const serviceAccount = parseServiceAccount();
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  initialized = true;
  console.log("✅ Firebase Admin initialized");
}

module.exports = { initFirebaseAdmin };
