-- Allow papers to be saved to the library without being digested (analysed) yet.
-- An un-digested paper has analysis = NULL until the user clicks "Digest".
ALTER TABLE papers ALTER COLUMN analysis DROP NOT NULL;
