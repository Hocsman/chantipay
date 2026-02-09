-- Migration: Drop interventions table
-- Description: Suppression complète du module Interventions

-- =====================================================
-- 1. SUPPRIMER LES POLICIES RLS
-- =====================================================
DROP POLICY IF EXISTS "Users can view own interventions" ON interventions;
DROP POLICY IF EXISTS "Users can create own interventions" ON interventions;
DROP POLICY IF EXISTS "Users can update own interventions" ON interventions;
DROP POLICY IF EXISTS "Users can delete own interventions" ON interventions;

-- =====================================================
-- 2. SUPPRIMER LES INDEX
-- =====================================================
DROP INDEX IF EXISTS idx_interventions_user_id;
DROP INDEX IF EXISTS idx_interventions_client_id;
DROP INDEX IF EXISTS idx_interventions_date;
DROP INDEX IF EXISTS idx_interventions_status;

-- =====================================================
-- 3. SUPPRIMER LA TABLE
-- =====================================================
DROP TABLE IF EXISTS interventions CASCADE;

-- =====================================================
-- COMMENTAIRE
-- =====================================================
-- Table interventions supprimée le 2026-02-09
-- Module remplacé par le module Technicien avec pointage
