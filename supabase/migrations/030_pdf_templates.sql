-- =============================================
-- 030: Templates PDF premium
-- =============================================

-- Ajout des colonnes de personnalisation PDF
ALTER TABLE settings ADD COLUMN IF NOT EXISTS pdf_template TEXT DEFAULT 'classic';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS pdf_accent_color TEXT DEFAULT '#F97316';
