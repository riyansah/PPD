function parseCookies(headerValue = "") {
  const values = {};

  for (const chunk of headerValue.split(";")) {
    const part = chunk.trim();
    if (!part) {
      continue;
    }

    const separatorIndex = part.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = decodeURIComponent(part.slice(0, separatorIndex).trim());
    const value = decodeURIComponent(part.slice(separatorIndex + 1).trim());
    values[key] = value;
  }

  return values;
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];

  if (options.path) {
    parts.push(`Path=${options.path}`);
  }

  if (options.httpOnly) {
    parts.push("HttpOnly");
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  if (options.secure) {
    parts.push("Secure");
  }

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  if (options.expires) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }

  return parts.join("; ");
}

module.exports = {
  parseCookies,
  serializeCookie
};
