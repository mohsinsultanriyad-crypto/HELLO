function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function normalizeRoles(roles) {
  if (!Array.isArray(roles)) return [];
  return roles
    .map(r => (typeof r === "string" ? r.trim() : ""))
    .filter(Boolean)
    .slice(0, 30);
}

module.exports = { isNonEmptyString, normalizeRoles };
