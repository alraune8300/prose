/*
# Add folders support to documents

1. New Tables
- `folders`
  - `id` (text, primary key) — client-generated stable id (e.g. "folder-<timestamp>")
  - `name` (text, not null)
  - `created_at` (bigint, milliseconds since epoch)
2. Modified Tables
- `documents`
  - Add `folder_id` (text, nullable) — references folders.id; null means "unfiled" note.
3. Security
- Enable RLS on `folders`.
- Allow anon + authenticated full CRUD on both tables (single-tenant, no sign-in).
*/

CREATE TABLE IF NOT EXISTS folders (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_folders" ON folders;
CREATE POLICY "anon_select_folders" ON folders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_folders" ON folders;
CREATE POLICY "anon_insert_folders" ON folders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_folders" ON folders;
CREATE POLICY "anon_update_folders" ON folders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_folders" ON folders;
CREATE POLICY "anon_delete_folders" ON folders FOR DELETE
  TO anon, authenticated USING (true);

-- Add folder_id column to documents if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE documents ADD COLUMN folder_id text;
  END IF;
END
$$;
