import winston from "winston";
import fs from "fs";
import path from "path";
import application from "../configs/application.js";

const logDir = path.join(process.cwd(), "src", "storages", "logs");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  defaultMeta: { service: "evaluate-application" },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
    }),
  ],
});

if (application.APP_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.splat(),
    })
  );
}

export default logger;
