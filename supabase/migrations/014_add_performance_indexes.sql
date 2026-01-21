-- ============================================
-- Migration: Add Performance Indexes
-- Date: 2025-01-21
-- Description: Indexes for optimized queries on quotes, invoices, clients
-- ============================================

-- ===========================================
-- Indexes on quotes table
-- ===========================================

-- Index for user_id (most common filter)
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);

-- Index for status filtering (pending, accepted, rejected, expired)
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- Composite index for user + status (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_quotes_user_status ON quotes(user_id, status);

-- Index for created_at (recent quotes, sorting)
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);

-- Composite index for user + date (timeline queries)
CREATE INDEX IF NOT EXISTS idx_quotes_user_created ON quotes(user_id, created_at DESC);

-- Index for quote number search
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number);

-- Index for client_id (filter by client)
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);

-- ===========================================
-- Indexes on quote_items table
-- ===========================================

-- Index for quote_id (foreign key, join performance)
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);

-- Full-text search on description (for AI similarity)
CREATE INDEX IF NOT EXISTS idx_quote_items_description_gin ON quote_items USING gin(to_tsvector('french', description));

-- ===========================================
-- Indexes on invoices table
-- ===========================================

-- Index for user_id
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);

-- Index for status (draft, sent, paid, overdue, cancelled)
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Composite index for user + status
CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON invoices(user_id, status);

-- Index for due_date (overdue detection)
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Index for client_id
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);

-- ===========================================
-- Indexes on clients table
-- ===========================================

-- Index for user_id
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- Index for name search
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- Full-text search on name + email
CREATE INDEX IF NOT EXISTS idx_clients_search_gin ON clients USING gin(
  to_tsvector('french', coalesce(name, '') || ' ' || coalesce(email, ''))
);

-- ===========================================
-- Indexes on ai_history table
-- ===========================================

-- Index for user_id + created_at (recent history)
CREATE INDEX IF NOT EXISTS idx_ai_history_user_created ON ai_history(user_id, created_at DESC);

-- Index for type filtering
CREATE INDEX IF NOT EXISTS idx_ai_history_type ON ai_history(type);

-- ===========================================
-- Indexes on interventions table
-- ===========================================

-- Index for user_id
CREATE INDEX IF NOT EXISTS idx_interventions_user_id ON interventions(user_id);

-- Index for scheduled_date (calendar queries)
CREATE INDEX IF NOT EXISTS idx_interventions_scheduled_date ON interventions(scheduled_date);

-- Index for status
CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status);

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
