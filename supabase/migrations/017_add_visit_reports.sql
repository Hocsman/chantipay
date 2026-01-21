-- Migration: Add visit_reports table and storage for photos
-- Created: 2026-01-21

-- ============================================
-- Table: visit_reports
-- ============================================

CREATE TABLE IF NOT EXISTS visit_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Metadata
  client_name TEXT,
  location TEXT,
  visit_date DATE,
  trade TEXT,
  context TEXT,
  
  -- Report content
  summary TEXT NOT NULL,
  diagnostics JSONB DEFAULT '[]'::jsonb,
  non_conformities JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  photo_annotations JSONB DEFAULT '[]'::jsonb,
  
  -- Photo URLs (stored in Supabase Storage)
  photo_urls TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_visit_reports_user_id ON visit_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_visit_reports_created_at ON visit_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visit_reports_client_name ON visit_reports(client_name);

-- Enable RLS
ALTER TABLE visit_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own visit reports"
  ON visit_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own visit reports"
  ON visit_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visit reports"
  ON visit_reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visit reports"
  ON visit_reports FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Storage bucket: visit-reports
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'visit-reports',
  'visit-reports',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for visit-report photos
CREATE POLICY "Users can upload their own visit report photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'visit-reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own visit report photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'visit-reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own visit report photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'visit-reports' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- Trigger: update updated_at on changes
-- ============================================

CREATE OR REPLACE FUNCTION update_visit_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_visit_reports_updated_at
  BEFORE UPDATE ON visit_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_visit_reports_updated_at();
