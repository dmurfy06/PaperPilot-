-- Create private storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('paper-pdfs', 'paper-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Drop old policy if it exists (re-runnable)
DROP POLICY IF EXISTS "Users manage own PDFs" ON storage.objects;

-- Allow users to manage only their own PDFs (stored under their user id as folder)
-- WITH CHECK required for INSERT operations in addition to USING for SELECT/UPDATE/DELETE
CREATE POLICY "Users manage own PDFs" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'paper-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'paper-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]
  );
