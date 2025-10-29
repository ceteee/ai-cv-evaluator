CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY,
    evaluation_id INTEGER NOT NULL,
    type TEXT CHECK(
        type IN ('cv', 'project')
    ),
    path TEXT NOT NULL,
    parsed TEXT CHECK(json_valid(parsed)),
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evaluation_id) REFERENCES evaluations(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);