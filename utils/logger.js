// utils/logger.js
const { createLogger, format, transports } = require("winston");
const path = require("path");
const fs = require("fs");

const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const base = format.printf(({ level, message, timestamp, stack, ...meta }) => {
  const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  const stackStr = stack ? `\n${stack}` : "";
  return `${timestamp} ${level}: ${message}${extra}${stackStr}`;
});

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    base,
  ),
  defaultMeta: { service: "logistics-mono" },
  transports: [
    new transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 5 * 1024 * 1024,
      maxFiles: 3,
      tailable: true,
    }),
    new transports.File({
      filename: path.join(logsDir, "app.log"),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), base),
    }),
  );
}

module.exports = logger;
