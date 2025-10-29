import db from "../configs/database.js";

class DocumentRepository {
  constructor(db) {
    this.db = db;

    this.createStatement = db.prepare(`
      INSERT INTO documents (evaluation_id, type, path, parsed)
      VALUES (@evaluation_id, @type, @path, @parsed)
    `);

    this.findByIdStatement = db.prepare(`
      SELECT * FROM documents WHERE id = ?
    `);

    this.findByEvaluationIdStatement = db.prepare(`
      SELECT * FROM documents WHERE evaluation_id = ?
    `);

    this.updateStatement = db.prepare(`
      UPDATE documents
      SET type = @type,
          path = @path,
          parsed = @parsed
      WHERE id = @id
    `);
  }

  async create(document) {
    const info = this.createStatement.run({
      evaluation_id: document.evaluation_id,
      type: document.type,
      path: document.path,
      parsed: document.parsed || null
    });
    return this.findById(info.lastInsertRowid);
  }

  async findById(id) {
    return this.findByIdStatement.get(id);
  }

  async findByEvaluationId(evaluation_id) {
    return this.findByEvaluationIdStatement.all(evaluation_id);
  }

  async update(document) {
    this.updateStatement.run({
      id: document.id,
      type: document.type,
      path: document.path,
      parsed: document.parsed
    });
    return this.findById(document.id);
  }

  async findByFilter(filters = []) {
    if (!filters.length) return [];

    const conditions = filters.map(f => `${f.key} = ?`).join(' AND ');
    const values = filters.map(f => f.value);

    const statement = this.db.prepare(`SELECT * FROM documents WHERE ${conditions}`);
    return statement.all(...values);
  }
}

export default new DocumentRepository(db);