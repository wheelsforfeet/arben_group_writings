CREATE TABLE IF NOT EXISTS entries (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  author     TEXT NOT NULL CHECK(author IN ('ben','arden','research')),
  type       TEXT NOT NULL,
  summary    TEXT NOT NULL,
  body       TEXT,
  url        TEXT,
  pdf_key    TEXT,
  tags       TEXT,
  created_at TEXT NOT NULL
);
