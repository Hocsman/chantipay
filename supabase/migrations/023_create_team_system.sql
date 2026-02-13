-- =============================================
-- Migration 023: Système de gestion d'équipe
-- =============================================
-- Permet aux patrons d'inviter des membres d'équipe
-- avec des permissions configurables

-- =============================================
-- 1. Table team_members (membres d'équipe)
-- =============================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Le patron/propriétaire du compte
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- L'utilisateur membre (NULL jusqu'à acceptation de l'invitation)
    member_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Informations d'invitation
    email TEXT NOT NULL,
    invitation_token UUID DEFAULT gen_random_uuid(),
    invitation_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (invitation_status IN ('pending', 'accepted', 'expired', 'revoked')),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

    -- Profil du membre
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    role_title TEXT DEFAULT 'Membre',

    -- Statut
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Contraintes
    UNIQUE(owner_id, email),
    UNIQUE(invitation_token)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_team_members_owner_id ON team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_member_user_id ON team_members(member_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_invitation_token ON team_members(invitation_token);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(invitation_status);

-- =============================================
-- 2. Table team_member_permissions (permissions)
-- =============================================
CREATE TABLE IF NOT EXISTS team_member_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,

    -- Permissions (toutes désactivées par défaut)
    view_assigned_jobs BOOLEAN DEFAULT false,      -- Voir interventions assignées
    edit_pointage BOOLEAN DEFAULT false,           -- Créer/modifier son pointage
    view_clients BOOLEAN DEFAULT false,            -- Lecture seule clients
    create_visit_reports BOOLEAN DEFAULT false,    -- Créer rapports de visite
    view_quotes BOOLEAN DEFAULT false,             -- Lecture seule devis
    edit_quotes BOOLEAN DEFAULT false,             -- Créer/modifier devis
    view_invoices BOOLEAN DEFAULT false,           -- Lecture seule factures
    edit_invoices BOOLEAN DEFAULT false,           -- Créer/modifier factures
    manage_technicians BOOLEAN DEFAULT false,      -- Gérer techniciens

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Une seule ligne de permissions par membre
    UNIQUE(team_member_id)
);

CREATE INDEX IF NOT EXISTS idx_permissions_team_member_id ON team_member_permissions(team_member_id);

-- =============================================
-- 3. Fonctions helper pour les policies RLS
-- =============================================

-- Vérifie si l'utilisateur courant est membre de l'équipe d'un owner
CREATE OR REPLACE FUNCTION is_team_member_of(owner_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members
        WHERE owner_id = owner_uuid
        AND member_user_id = auth.uid()
        AND invitation_status = 'accepted'
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Récupère l'owner_id pour un membre d'équipe
CREATE OR REPLACE FUNCTION get_team_owner_id()
RETURNS UUID AS $$
DECLARE
    owner_uuid UUID;
BEGIN
    SELECT owner_id INTO owner_uuid
    FROM team_members
    WHERE member_user_id = auth.uid()
    AND invitation_status = 'accepted'
    AND is_active = true
    LIMIT 1;

    RETURN owner_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vérifie si l'utilisateur a une permission spécifique
CREATE OR REPLACE FUNCTION has_team_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN;
BEGIN
    EXECUTE format(
        'SELECT %I FROM team_member_permissions tmp
         JOIN team_members tm ON tm.id = tmp.team_member_id
         WHERE tm.member_user_id = auth.uid()
         AND tm.invitation_status = ''accepted''
         AND tm.is_active = true
         LIMIT 1',
        permission_name
    ) INTO has_perm;

    RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Récupère l'user_id effectif (owner pour membres, soi-même pour owners)
CREATE OR REPLACE FUNCTION get_effective_user_id()
RETURNS UUID AS $$
DECLARE
    owner_uuid UUID;
BEGIN
    owner_uuid := get_team_owner_id();
    IF owner_uuid IS NOT NULL THEN
        RETURN owner_uuid;
    END IF;
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 4. RLS Policies pour team_members
-- =============================================
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Les owners peuvent gérer leurs membres
CREATE POLICY "Owners can manage their team members"
    ON team_members
    FOR ALL
    USING (auth.uid() = owner_id);

-- Les membres peuvent voir leur propre adhésion
CREATE POLICY "Team members can view their own membership"
    ON team_members
    FOR SELECT
    USING (member_user_id = auth.uid());

-- =============================================
-- 5. RLS Policies pour team_member_permissions
-- =============================================
ALTER TABLE team_member_permissions ENABLE ROW LEVEL SECURITY;

-- Les owners peuvent gérer les permissions
CREATE POLICY "Owners can manage permissions"
    ON team_member_permissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.id = team_member_id
            AND tm.owner_id = auth.uid()
        )
    );

-- Les membres peuvent voir leurs propres permissions
CREATE POLICY "Team members can view their own permissions"
    ON team_member_permissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.id = team_member_id
            AND tm.member_user_id = auth.uid()
        )
    );

-- =============================================
-- 6. Trigger pour updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_team_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_team_updated_at();

CREATE TRIGGER team_member_permissions_updated_at
    BEFORE UPDATE ON team_member_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_team_updated_at();

-- =============================================
-- 7. Commentaires
-- =============================================
COMMENT ON TABLE team_members IS 'Membres d''équipe invités par les propriétaires de compte';
COMMENT ON TABLE team_member_permissions IS 'Permissions configurables pour chaque membre d''équipe';
COMMENT ON FUNCTION is_team_member_of IS 'Vérifie si l''utilisateur courant est membre actif de l''équipe d''un owner';
COMMENT ON FUNCTION get_team_owner_id IS 'Retourne l''ID du propriétaire si l''utilisateur courant est un membre d''équipe';
COMMENT ON FUNCTION has_team_permission IS 'Vérifie si l''utilisateur courant a une permission spécifique';
COMMENT ON FUNCTION get_effective_user_id IS 'Retourne l''ID effectif pour les requêtes (owner_id pour membres, auth.uid() sinon)';
