function shouldLog(targetLevel, messageLevel) {
  const levels = ["debug", "info", "warn", "error"];
  return levels.indexOf(messageLevel) >= levels.indexOf(targetLevel);
}

function createLogger({ level = "info" } = {}) {
  function write(messageLevel, message, fields = {}) {
    if (!shouldLog(level, messageLevel)) {
      return;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      level: messageLevel,
      message,
      ...fields
    };

    const line = `${JSON.stringify(entry)}\n`;
    const stream = messageLevel === "error" ? process.stderr : process.stdout;
    stream.write(line);
  }

  return {
    debug(message, fields) {
      write("debug", message, fields);
    },
    info(message, fields) {
      write("info", message, fields);
    },
    warn(message, fields) {
      write("warn", message, fields);
    },
    error(message, fields) {
      write("error", message, fields);
    }
  };
}

module.exports = {
  createLogger
};
