-- Add pdf_path, custom_name, and folder_id to papers table
ALTER TABLE papers
  ADD COLUMN IF NOT EXISTS pdf_path text,
  ADD COLUMN IF NOT EXISTS custom_name text,
  ADD COLUMN IF NOT EXISTS folder_id uuid;

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own folders" ON folders
  FOR ALL USING (auth.uid() = user_id);
