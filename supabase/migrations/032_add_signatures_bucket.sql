-- Create signatures storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to signatures (needed for PDF generation)
CREATE POLICY "Public can view signatures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'signatures');

-- Allow service role to upload signatures (signing can be done by unauthenticated clients)
CREATE POLICY "Service role can upload signatures"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'signatures');

-- Allow authenticated users to delete their own signatures
CREATE POLICY "Users can delete their own signatures"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);
