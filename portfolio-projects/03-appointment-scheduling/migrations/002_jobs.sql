CREATE TABLE jobs(id TEXT PRIMARY KEY, kind TEXT NOT NULL, payload TEXT NOT NULL, available_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, state TEXT NOT NULL CHECK(state IN('pending','running','done','dead')), last_error TEXT);
CREATE INDEX jobs_ready ON jobs(state,available_at);
