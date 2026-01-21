-- ============================================
-- Migration: Add Performance Indexes
-- Date: 2025-01-21
-- Description: Indexes for optimized queries on quotes, invoices, clients
-- Note: Some indexes already exist from initial migrations, we use IF NOT EXISTS
-- ============================================

-- ===========================================
-- Indexes on quotes table
-- ===========================================

-- Composite index for user + status (dashboard queries) - NEW
CREATE INDEX IF NOT EXISTS idx_quotes_user_status ON quotes(user_id, status);

-- Index for created_at (recent quotes, sorting) - NEW
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);

-- Composite index for user + date (timeline queries) - NEW
CREATE INDEX IF NOT EXISTS idx_quotes_user_created ON quotes(user_id, created_at DESC);

-- Index for quote number search - NEW
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number);

-- ===========================================
-- Indexes on quote_items table
-- ===========================================

-- Index for quote_id (foreign key, join performance)
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);

-- Full-text search on description (for AI similarity) - NEW
CREATE INDEX IF NOT EXISTS idx_quote_items_description_gin ON quote_items USING gin(to_tsvector('french', description));

-- ===========================================
-- Indexes on invoices table
-- Note: Column is payment_status, not status
-- ===========================================

-- Composite index for user + payment_status - NEW
CREATE INDEX IF NOT EXISTS idx_invoices_user_payment_status ON invoices(user_id, payment_status);

-- ===========================================
-- Indexes on clients table
-- ===========================================

-- Index for name search - NEW
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- Full-text search on name + email - NEW
CREATE INDEX IF NOT EXISTS idx_clients_search_gin ON clients USING gin(
  to_tsvector('french', coalesce(name, '') || ' ' || coalesce(email, ''))
);

-- ===========================================
-- Indexes on ai_history table
-- ===========================================

-- Index for user_id + created_at (recent history) - NEW
CREATE INDEX IF NOT EXISTS idx_ai_history_user_created ON ai_history(user_id, created_at DESC);

-- Index for type filtering - NEW
CREATE INDEX IF NOT EXISTS idx_ai_history_type ON ai_history(type);

-- ===========================================
-- Indexes on interventions table
-- Note: Column is 'date', not 'scheduled_date'
-- ===========================================

-- Composite index for user + date - NEW
CREATE INDEX IF NOT EXISTS idx_interventions_user_date ON interventions(user_id, date);

-- ===========================================
-- Analyze tables for query planner
-- ===========================================
ANALYZE quotes;
ANALYZE quote_items;
ANALYZE invoices;
ANALYZE clients;
ANALYZE ai_history;
ANALYZE interventions;

-- ===========================================
-- Comments
-- ===========================================
COMMENT ON INDEX idx_quotes_user_status IS 'Composite index for dashboard queries: filter by user and status';
COMMENT ON INDEX idx_quote_items_description_gin IS 'Full-text search index for AI-powered quote item similarity';
COMMENT ON INDEX idx_clients_search_gin IS 'Full-text search on clients for autocomplete';
