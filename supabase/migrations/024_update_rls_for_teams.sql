-- =============================================
-- Migration 024: Mise à jour RLS pour équipes
-- =============================================
-- Modifie les policies existantes pour permettre
-- l'accès aux membres d'équipe selon leurs permissions

-- =============================================
-- 1. CLIENTS - Accès lecture pour membres avec permission
-- =============================================

-- Supprimer l'ancienne policy de lecture
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;

-- Nouvelle policy avec support équipe
CREATE POLICY "Users and team members can view clients"
    ON clients FOR SELECT
    USING (
        auth.uid() = user_id
        OR (is_team_member_of(user_id) AND has_team_permission('view_clients'))
    );

-- =============================================
-- 2. QUOTES - Accès selon permissions
-- =============================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Users can view their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can insert their own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON quotes;

-- Lecture
CREATE POLICY "Users and team members can view quotes"
    ON quotes FOR SELECT
    USING (
        auth.uid() = user_id
        OR (is_team_member_of(user_id) AND has_team_permission('view_quotes'))
    );

-- Création
CREATE POLICY "Users and team members can insert quotes"
    ON quotes FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR (
            user_id = get_team_owner_id()
            AND has_team_permission('edit_quotes')
        )
    );

-- Modification
CREATE POLICY "Users and team members can update quotes"
    ON quotes FOR UPDATE
    USING (
        auth.uid() = user_id
        OR (is_team_member_of(user_id) AND has_team_permission('edit_quotes'))
    );

-- =============================================
-- 3. QUOTE_ITEMS - Suit les permissions des devis
-- =============================================

DROP POLICY IF EXISTS "Users can view their quote items" ON quote_items;
DROP POLICY IF EXISTS "Users can insert their quote items" ON quote_items;
DROP POLICY IF EXISTS "Users can update their quote items" ON quote_items;
DROP POLICY IF EXISTS "Users can delete their quote items" ON quote_items;

CREATE POLICY "Users and team members can view quote items"
    ON quote_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM quotes q
            WHERE q.id = quote_items.quote_id
            AND (
                auth.uid() = q.user_id
                OR (is_team_member_of(q.user_id) AND has_team_permission('view_quotes'))
            )
        )
    );

CREATE POLICY "Users and team members can insert quote items"
    ON quote_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM quotes q
            WHERE q.id = quote_items.quote_id
            AND (
                auth.uid() = q.user_id
                OR (is_team_member_of(q.user_id) AND has_team_permission('edit_quotes'))
            )
        )
    );

CREATE POLICY "Users and team members can update quote items"
    ON quote_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM quotes q
            WHERE q.id = quote_items.quote_id
            AND (
                auth.uid() = q.user_id
                OR (is_team_member_of(q.user_id) AND has_team_permission('edit_quotes'))
            )
        )
    );

CREATE POLICY "Users and team members can delete quote items"
    ON quote_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM quotes q
            WHERE q.id = quote_items.quote_id
            AND (
                auth.uid() = q.user_id
                OR (is_team_member_of(q.user_id) AND has_team_permission('edit_quotes'))
            )
        )
    );

-- =============================================
-- 4. INVOICES - Accès selon permissions
-- =============================================

DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON invoices;

CREATE POLICY "Users and team members can view invoices"
    ON invoices FOR SELECT
    USING (
        auth.uid() = user_id
        OR (is_team_member_of(user_id) AND has_team_permission('view_invoices'))
    );

CREATE POLICY "Users and team members can insert invoices"
    ON invoices FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR (
            user_id = get_team_owner_id()
            AND has_team_permission('edit_invoices')
        )
    );

CREATE POLICY "Users and team members can update invoices"
    ON invoices FOR UPDATE
    USING (
        auth.uid() = user_id
        OR (is_team_member_of(user_id) AND has_team_permission('edit_invoices'))
    );

-- =============================================
-- 5. INVOICE_ITEMS - Suit les permissions des factures
-- =============================================

DROP POLICY IF EXISTS "Users can view their invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Users can insert their invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Users can update their invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Users can delete their invoice items" ON invoice_items;

CREATE POLICY "Users and team members can view invoice items"
    ON invoice_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM invoices i
            WHERE i.id = invoice_items.invoice_id
            AND (
                auth.uid() = i.user_id
                OR (is_team_member_of(i.user_id) AND has_team_permission('view_invoices'))
            )
        )
    );

CREATE POLICY "Users and team members can insert invoice items"
    ON invoice_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM invoices i
            WHERE i.id = invoice_items.invoice_id
            AND (
                auth.uid() = i.user_id
                OR (is_team_member_of(i.user_id) AND has_team_permission('edit_invoices'))
            )
        )
    );

CREATE POLICY "Users and team members can update invoice items"
    ON invoice_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM invoices i
            WHERE i.id = invoice_items.invoice_id
            AND (
                auth.uid() = i.user_id
                OR (is_team_member_of(i.user_id) AND has_team_permission('edit_invoices'))
            )
        )
    );

CREATE POLICY "Users and team members can delete invoice items"
    ON invoice_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM invoices i
            WHERE i.id = invoice_items.invoice_id
            AND (
                auth.uid() = i.user_id
                OR (is_team_member_of(i.user_id) AND has_team_permission('edit_invoices'))
            )
        )
    );

-- =============================================
-- 6. TECHNICIANS - Accès selon permissions
-- =============================================

DROP POLICY IF EXISTS "Users can view their own technicians" ON technicians;
DROP POLICY IF EXISTS "Users can insert their own technicians" ON technicians;
DROP POLICY IF EXISTS "Users can update their own technicians" ON technicians;
DROP POLICY IF EXISTS "Users can delete their own technicians" ON technicians;

CREATE POLICY "Users and team members can view technicians"
    ON technicians FOR SELECT
    USING (
        auth.uid() = user_id
        OR is_team_member_of(user_id)
    );

CREATE POLICY "Users and team members can insert technicians"
    ON technicians FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR (
            user_id = get_team_owner_id()
            AND has_team_permission('manage_technicians')
        )
    );

CREATE POLICY "Users and team members can update technicians"
    ON technicians FOR UPDATE
    USING (
        auth.uid() = user_id
        OR (is_team_member_of(user_id) AND has_team_permission('manage_technicians'))
    );

CREATE POLICY "Users and team members can delete technicians"
    ON technicians FOR DELETE
    USING (
        auth.uid() = user_id
        OR (is_team_member_of(user_id) AND has_team_permission('manage_technicians'))
    );

-- =============================================
-- 7. TIME_ENTRIES - Pointage
-- =============================================

DROP POLICY IF EXISTS "Users can view their own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can insert their own time entries" ON time_entries;
DROP POLICY IF EXISTS "Users can update their own time entries" ON time_entries;

CREATE POLICY "Users and team members can view time entries"
    ON time_entries FOR SELECT
    USING (
        auth.uid() = user_id
        OR is_team_member_of(user_id)
    );

CREATE POLICY "Users and team members can insert time entries"
    ON time_entries FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR (
            user_id = get_team_owner_id()
            AND has_team_permission('edit_pointage')
        )
    );

CREATE POLICY "Users and team members can update time entries"
    ON time_entries FOR UPDATE
    USING (
        auth.uid() = user_id
        OR (is_team_member_of(user_id) AND has_team_permission('edit_pointage'))
    );

-- =============================================
-- 8. WORK_SESSIONS - Sessions de travail
-- =============================================

DROP POLICY IF EXISTS "Users can view their own work sessions" ON work_sessions;

CREATE POLICY "Users and team members can view work sessions"
    ON work_sessions FOR SELECT
    USING (
        auth.uid() = user_id
        OR is_team_member_of(user_id)
    );

-- =============================================
-- 9. VISIT_REPORTS - Rapports de visite
-- =============================================

DROP POLICY IF EXISTS "Users can view their own visit reports" ON visit_reports;
DROP POLICY IF EXISTS "Users can insert their own visit reports" ON visit_reports;
DROP POLICY IF EXISTS "Users can update their own visit reports" ON visit_reports;

CREATE POLICY "Users and team members can view visit reports"
    ON visit_reports FOR SELECT
    USING (
        auth.uid() = user_id
        OR (is_team_member_of(user_id) AND has_team_permission('create_visit_reports'))
    );

CREATE POLICY "Users and team members can insert visit reports"
    ON visit_reports FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR (
            user_id = get_team_owner_id()
            AND has_team_permission('create_visit_reports')
        )
    );

CREATE POLICY "Users and team members can update visit reports"
    ON visit_reports FOR UPDATE
    USING (
        auth.uid() = user_id
        OR (is_team_member_of(user_id) AND has_team_permission('create_visit_reports'))
    );

-- =============================================
-- 10. TASKS - Tâches/Interventions
-- =============================================

-- Note: Les tâches sont visibles par tous les membres de l'équipe
-- mais seuls ceux avec view_assigned_jobs verront l'UI

DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;

CREATE POLICY "Users and team members can view tasks"
    ON tasks FOR SELECT
    USING (
        auth.uid() = user_id
        OR is_team_member_of(user_id)
    );

CREATE POLICY "Users can insert tasks"
    ON tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update tasks"
    ON tasks FOR UPDATE
    USING (auth.uid() = user_id);

-- =============================================
-- Commentaire final
-- =============================================
COMMENT ON SCHEMA public IS 'RLS mis à jour pour support équipe - Migration 024';
