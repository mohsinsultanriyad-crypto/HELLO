const mongoose = require("mongoose");
const { MONGO_URL } = require("./config");

async function connectDB() {
  if (!MONGO_URL) throw new Error("MONGO_URL missing");
  await mongoose.connect(MONGO_URL);
  console.log("✅ MongoDB connected");
}

module.exports = { connectDB };
