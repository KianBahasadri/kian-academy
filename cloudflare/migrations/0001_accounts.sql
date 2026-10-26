CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL,
  profile_hash TEXT NOT NULL,
  profile_chunks INTEGER NOT NULL CHECK (profile_chunks > 0),
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS account_library_chunks (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
  contents TEXT NOT NULL,
  PRIMARY KEY (account_id, profile_id, chunk_index)
);
