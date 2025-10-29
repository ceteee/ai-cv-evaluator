CREATE TABLE IF NOT EXISTS evaluations (
    id INTEGER PRIMARY KEY,
    process_status TEXT DEFAULT 'created' CHECK(
        process_status IN ('created', 'queued', 'processing', 'completed', 'failed')
    ),
    result TEXT CHECK(json_valid(result)) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS trg_update_evaluations_timestamp
AFTER UPDATE ON evaluations
FOR EACH ROW
BEGIN
  UPDATE evaluations
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;