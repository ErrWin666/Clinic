const STRIP_TAGS_RE = /<[^>]*>/g;
const STRIP_SCRIPT_RE = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const STRIP_EVENTS_RE = /\son\w+\s*=\s*[^>]*>/gi;

const sanitizeValue = (val) => {
  if (typeof val === "string") {
    return val
      .replace(STRIP_SCRIPT_RE, "")
      .replace(STRIP_EVENTS_RE, ">")
      .replace(STRIP_TAGS_RE, "")
      .trim();
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }
  if (val && typeof val === "object") {
    const result = {};
    for (const key of Object.keys(val)) {
      result[key] = sanitizeValue(val[key]);
    }
    return result;
  }
  return val;
};

function sanitizeInput(req, _res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === "object") {
    req.params = sanitizeValue(req.params);
  }
  next();
}

module.exports = sanitizeInput;
