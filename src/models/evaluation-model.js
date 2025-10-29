export default class Evaludation {
  constructor({ id, process_status, result, created_at, updated_at }) {
    this.id = id;
    (this.process_status = process_status), (this.result = result);
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}