CREATE TABLE IF NOT EXISTS assistant_memory_documents (
  key text PRIMARY KEY,
  content text NOT NULL,
  version text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE assistant_memory_documents ENABLE ROW LEVEL SECURITY;
