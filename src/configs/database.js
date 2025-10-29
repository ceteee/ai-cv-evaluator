import Database from "better-sqlite3";
import logger from "../utils/logger.js";
import path from "path";
import fs from "fs";

const DB_PATH = path.resolve("src/storages/databases", "evaluator.db");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let db;

try {
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("foreign_keys = ON");
  logger.info(`Database initialized at ${DB_PATH}`);
} catch (err) {
  logger.error(`Failed to initialize database: ${err.message}`);
  throw err;
}

export async function checkDbConnection() {
  try {
    const result = db.prepare("SELECT 1 AS ok").get();
    if (result.ok === 1) {
      logger.info("Database connection is healthy");
    }
  } catch (err) {
    logger.error(`Database connection failed: ${err.message}`);
    throw err;
  }
}

export default db;