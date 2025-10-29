import { processStatus } from "../configs/constant.js";
import db from "../configs/database.js";

class EvaluationRepository {
  constructor(db) {
    this.db = db;

    this.createStatement = db.prepare(`
      INSERT INTO evaluations (process_status)
      VALUES (@process_status)
    `);

    this.findByIdStatement = db.prepare(`
      SELECT * FROM evaluations WHERE id = ?
    `);

    this.updateStatement = db.prepare(`
      UPDATE evaluations
      SET process_status = @process_status,
          result = @result
      WHERE id = @id
    `);
  }

  async create(evaluation) {
    const info = this.createStatement.run({
      process_status: processStatus.CREATED,
    });
    return this.findById(info.lastInsertRowid);
  }

  async findById(id) {
    return this.findByIdStatement.get(id);
  }

  async update(id, data) {
    this.updateStatement.run({
      id,
      process_status: data.process_status,
      result: JSON.stringify(data.result ?? null),
    });
    return this.findById(id);
  }
}

export default new EvaluationRepository(db);
