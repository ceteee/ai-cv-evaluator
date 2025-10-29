export default class Document {
  constructor({ id, evaluation_id, type, path, parsed, uploaded_at }) {
    this.id = id;
    (this.evaluation_id = evaluation_id), (this.type = type);
    this.path = path;
    this.parsed = parsed;
    this.uploaded_at = uploaded_at;
  }
}
