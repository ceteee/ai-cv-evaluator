import fs from "fs";
import path from "path";
import db from "../configs/database.js";
import logger from "../utils/logger.js";

(function runMigrations() {
  const migrationDir = path.resolve("src/migrations");
  const files = fs.readdirSync(migrationDir)
    .filter(f => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationDir, file), "utf8");
    try {
      db.exec(sql);
      logger.info(`Run migration: ${file}`);
    } catch (err) {
      logger.error(`Migration failed (${file}): ${err.message}`);
      throw err;
    }
  }

  logger.info("All migrations applied successfully");
})();