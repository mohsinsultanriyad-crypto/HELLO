const mongoose = require("mongoose");

const TokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },

    roles: { type: [String], default: [] },
    newsEnabled: { type: Boolean, default: true },

    city: { type: String, default: "" },

    lastDigestAt: { type: Date, default: null },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

    badgeCount: { type: Number, default: 0 },
    lastOpenedAlertsAt: { type: Date, default: null }
  },
  { versionKey: false }
);

TokenSchema.index({ token: 1 }, { unique: true });

module.exports = mongoose.model("Token", TokenSchema);
