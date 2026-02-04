-- =====================================================
-- Script: Injection de données de test 2025
-- Description: Créer des clients, devis et factures pour l'année 2025
-- Usage: Remplace 'YOUR_USER_ID_HERE' par ton UUID utilisateur réel
-- =====================================================

-- ⚠️ REMPLACE cette valeur par ton vrai user_id
DO $$
DECLARE
  v_user_id UUID := 'YOUR_USER_ID_HERE'; -- 👈 À REMPLACER
  v_client_ids UUID[];
  v_quote_id UUID;
  v_invoice_id UUID;
  v_month INT;
  v_day INT;
  v_quote_number TEXT;
  v_invoice_number TEXT;
BEGIN

  -- =====================================================
  -- 1. Créer des clients de test
  -- =====================================================
  INSERT INTO public.clients (user_id, name, email, phone, address, postal_code, city)
  VALUES
    (v_user_id, 'Dupont Jean', 'jean.dupont@email.fr', '0612345678', '12 Rue de la Paix', '75001', 'Paris'),
    (v_user_id, 'Martin Sophie', 'sophie.martin@email.fr', '0623456789', '34 Avenue des Champs', '69001', 'Lyon'),
    (v_user_id, 'Durand Pierre', 'pierre.durand@email.fr', '0634567890', '56 Boulevard Victor Hugo', '33000', 'Bordeaux'),
    (v_user_id, 'Leroy Marie', 'marie.leroy@email.fr', '0645678901', '78 Rue Nationale', '59000', 'Lille'),
    (v_user_id, 'Moreau Luc', 'luc.moreau@email.fr', '0656789012', '90 Place de la République', '13001', 'Marseille'),
    (v_user_id, 'Bernard Claire', 'claire.bernard@email.fr', '0667890123', '23 Rue du Commerce', '44000', 'Nantes'),
    (v_user_id, 'Petit Thomas', 'thomas.petit@email.fr', '0678901234', '45 Avenue Foch', '67000', 'Strasbourg'),
    (v_user_id, 'Robert Anne', 'anne.robert@email.fr', '0689012345', '67 Rue de la Gare', '31000', 'Toulouse')
  RETURNING ARRAY_AGG(id) INTO v_client_ids;

  -- =====================================================
  -- 2. Créer des devis répartis sur 2025 (environ 4 par mois)
  -- =====================================================
  FOR v_month IN 1..12 LOOP
    FOR v_day IN 1..4 LOOP
      v_quote_number := 'DEV-2025-' || LPAD(v_month::TEXT, 2, '0') || LPAD((v_day * 7)::TEXT, 2, '0');
      
      INSERT INTO public.quotes (
        user_id,
        client_id,
        quote_number,
        status,
        total_ht,
        total_ttc,
        vat_amount,
        created_at,
        valid_until,
        notes
      )
      VALUES (
        v_user_id,
        v_client_ids[(v_month + v_day) % ARRAY_LENGTH(v_client_ids, 1) + 1], -- Client aléatoire
        v_quote_number,
        CASE 
          WHEN v_month <= 3 THEN (ARRAY['accepted', 'accepted', 'rejected'])[1 + v_day % 3]
          WHEN v_month <= 6 THEN (ARRAY['accepted', 'sent', 'rejected'])[1 + v_day % 3]
          WHEN v_month <= 9 THEN (ARRAY['accepted', 'sent', 'sent'])[1 + v_day % 3]
          WHEN v_month <= 11 THEN (ARRAY['sent', 'sent', 'draft'])[1 + v_day % 3]
          ELSE (ARRAY['sent', 'draft', 'draft'])[1 + v_day % 3] -- Devis récents
        END,
        1200 + (v_month * 100) + (v_day * 50), -- Montant variable HT
        (1200 + (v_month * 100) + (v_day * 50)) * 1.10, -- TTC avec TVA 10%
        (1200 + (v_month * 100) + (v_day * 50)) * 0.10, -- TVA 10%
        ('2025-' || LPAD(v_month::TEXT, 2, '0') || '-' || LPAD((v_day * 7)::TEXT, 2, '0') || ' 10:00:00')::TIMESTAMP,
        ('2025-' || LPAD(v_month::TEXT, 2, '0') || '-' || LPAD((v_day * 7 + 15)::TEXT, 2, '0') || ' 23:59:59')::TIMESTAMP,
        CASE 
          WHEN (v_month + v_day) % 4 = 0 THEN 'Rénovation électrique complète - NF C 15-100'
          WHEN (v_month + v_day) % 4 = 1 THEN 'Installation plomberie sanitaire - DTU 60.1'
          WHEN (v_month + v_day) % 4 = 2 THEN 'Pose menuiserie intérieure - DTU 36.5'
          ELSE 'Travaux de peinture et finition - DTU 59.1'
        END
      )
      RETURNING id INTO v_quote_id;

      -- Ajouter des items au devis (prestations variées selon le type)
      CASE (v_month + v_day) % 4
        WHEN 0 THEN -- Électricité
          INSERT INTO public.quote_items (quote_id, description, quantity, unit_price, vat_rate, total_ht, total_ttc)
          VALUES
            (v_quote_id, 'Tableau électrique avec disjoncteurs différentiels 30mA', 1, 450 + (v_day * 20), 10, 450 + (v_day * 20), (450 + (v_day * 20)) * 1.10),
            (v_quote_id, 'Installation prises et interrupteurs (x15)', 15, 25, 20, 375, 450),
            (v_quote_id, 'Mise aux normes NF C 15-100', 1, 350 + (v_month * 10), 10, 350 + (v_month * 10), (350 + (v_month * 10)) * 1.10);
        WHEN 1 THEN -- Plomberie
          INSERT INTO public.quote_items (quote_id, description, quantity, unit_price, vat_rate, total_ht, total_ttc)
          VALUES
            (v_quote_id, 'Remplacement ballon d''eau chaude 200L', 1, 600 + (v_day * 30), 10, 600 + (v_day * 30), (600 + (v_day * 30)) * 1.10),
            (v_quote_id, 'Installation groupe de sécurité neuf', 1, 85, 10, 85, 93.5),
            (v_quote_id, 'Essais d''étanchéité et mise en service', 1, 120 + (v_month * 8), 20, 120 + (v_month * 8), (120 + (v_month * 8)) * 1.20);
        WHEN 2 THEN -- Menuiserie
          INSERT INTO public.quote_items (quote_id, description, quantity, unit_price, vat_rate, total_ht, total_ttc)
          VALUES
            (v_quote_id, 'Pose porte intérieure avec bâti (x3)', 3, 280, 10, 840, 924),
            (v_quote_id, 'Fourniture et pose plinthes (40ml)', 40, 8, 20, 320, 384),
            (v_quote_id, 'Vérification conformité DTU 36.5', 1, 90, 10, 90, 99);
        ELSE -- Peinture
          INSERT INTO public.quote_items (quote_id, description, quantity, unit_price, vat_rate, total_ht, total_ttc)
          VALUES
            (v_quote_id, 'Préparation supports (ponçage, enduit)', 1, 320 + (v_day * 15), 10, 320 + (v_day * 15), (320 + (v_day * 15)) * 1.10),
            (v_quote_id, 'Peinture murs et plafonds (80m²)', 80, 12, 10, 960, 1056),
            (v_quote_id, 'Finitions et protections', 1, 150, 20, 150, 180);
      END CASE;

    END LOOP;
  END LOOP;

  -- =====================================================
  -- 3. Créer des factures réparties sur 2025 (environ 3 par mois)
  -- =====================================================
  FOR v_month IN 1..12 LOOP
    FOR v_day IN 1..3 LOOP
      v_invoice_number := 'FACT-2025-' || LPAD(v_month::TEXT, 2, '0') || LPAD((v_day * 10)::TEXT, 2, '0');
      
      INSERT INTO public.invoices (
        user_id,
        client_id,
        invoice_number,
        payment_status,
        total_ht,
        total_ttc,
        vat_amount,
        due_date,
        paid_at,
        created_at,
        notes
      )
      VALUES (
        v_user_id,
        v_client_ids[(v_month + v_day * 2) % ARRAY_LENGTH(v_client_ids, 1) + 1], -- Client aléatoire
        v_invoice_number,
        CASE 
          WHEN v_month <= 7 THEN 'paid' -- Anciennes factures payées
          WHEN v_month = 8 THEN (ARRAY['paid', 'paid', 'pending'])[1 + v_day % 3]
          WHEN v_month = 9 THEN (ARRAY['paid', 'pending', 'pending'])[1 + v_day % 3]
          WHEN v_month = 10 THEN (ARRAY['paid', 'pending', 'overdue'])[1 + v_day % 3]
          WHEN v_month = 11 THEN (ARRAY['pending', 'overdue', 'overdue'])[1 + v_day % 3]
          ELSE (ARRAY['pending', 'pending', 'cancelled'])[1 + v_day % 3] -- Décembre
        END,
        1500 + (v_month * 120) + (v_day * 60), -- Montant variable HT
        (1500 + (v_month * 120) + (v_day * 60)) * 1.10, -- TTC avec TVA 10%
        (1500 + (v_month * 120) + (v_day * 60)) * 0.10, -- TVA 10%
        ('2025-' || LPAD(v_month::TEXT, 2, '0') || '-' || LPAD((v_day * 10 + 15)::TEXT, 2, '0'))::DATE,
        CASE 
          WHEN v_month <= 7 THEN ('2025-' || LPAD(v_month::TEXT, 2, '0') || '-' || LPAD((v_day * 10 + 10)::TEXT, 2, '0') || ' 14:30:00')::TIMESTAMP
          WHEN v_month = 8 AND v_day <= 2 THEN ('2025-' || LPAD(v_month::TEXT, 2, '0') || '-' || LPAD((v_day * 10 + 12)::TEXT, 2, '0') || ' 16:00:00')::TIMESTAMP
          WHEN v_month = 9 AND v_day = 1 THEN ('2025-09-' || LPAD((v_day * 10 + 14)::TEXT, 2, '0') || ' 11:00:00')::TIMESTAMP
          WHEN v_month = 10 AND v_day = 1 THEN ('2025-10-' || LPAD((v_day * 10 + 12)::TEXT, 2, '0') || ' 15:30:00')::TIMESTAMP
          ELSE NULL -- Factures récentes non payées
        END,
        ('2025-' || LPAD(v_month::TEXT, 2, '0') || '-' || LPAD((v_day * 10)::TEXT, 2, '0') || ' 09:00:00')::TIMESTAMP,
        CASE 
          WHEN (v_month + v_day) % 4 = 0 THEN 'Travaux électricité - Mise aux normes NF C 15-100'
          WHEN (v_month + v_day) % 4 = 1 THEN 'Intervention plomberie - Conformité DTU 60.1'
          WHEN (v_month + v_day) % 4 = 2 THEN 'Menuiserie et agencement - DTU 36.5'
          ELSE 'Peinture et ravalement - DTU 59.1'
        END
      )
      RETURNING id INTO v_invoice_id;

      -- Ajouter des items à la facture (prestations variées selon le type)
      CASE (v_month + v_day) % 4
        WHEN 0 THEN -- Électricité
          INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, vat_rate, total_ht, total_ttc)
          VALUES
            (v_invoice_id, 'Rénovation tableau électrique complet', 1, 680 + (v_day * 25), 10, 680 + (v_day * 25), (680 + (v_day * 25)) * 1.10),
            (v_invoice_id, 'Installation points lumineux (x12)', 12, 35, 20, 420, 504),
            (v_invoice_id, 'Déplacement et main d''œuvre', 1, 400 + (v_month * 15), 10, 400 + (v_month * 15), (400 + (v_month * 15)) * 1.10);
        WHEN 1 THEN -- Plomberie
          INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, vat_rate, total_ht, total_ttc)
          VALUES
            (v_invoice_id, 'Installation sanitaire complète (lavabo, WC)', 1, 850 + (v_day * 30), 10, 850 + (v_day * 30), (850 + (v_day * 30)) * 1.10),
            (v_invoice_id, 'Fourniture robinetterie et accessoires', 1, 280, 20, 280, 336),
            (v_invoice_id, 'Essais, mise en service et contrôle', 1, 370 + (v_month * 12), 10, 370 + (v_month * 12), (370 + (v_month * 12)) * 1.10);
        WHEN 2 THEN -- Menuiserie
          INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, vat_rate, total_ht, total_ttc)
          VALUES
            (v_invoice_id, 'Fourniture et pose fenêtres PVC (x4)', 4, 320, 10, 1280, 1408),
            (v_invoice_id, 'Habillage et finitions bois', 1, 220, 20, 220, 264);
        ELSE -- Peinture
          INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, vat_rate, total_ht, total_ttc)
          VALUES
            (v_invoice_id, 'Préparation complète des surfaces (120m²)', 120, 8, 10, 960, 1056),
            (v_invoice_id, 'Peinture acrylique professionnelle', 1, 540 + (v_month * 10), 10, 540 + (v_month * 10), (540 + (v_month * 10)) * 1.10);
      END CASE;

    END LOOP;
  END LOOP;

  RAISE NOTICE '✅ Données de test 2025 injectées avec succès !';
  RAISE NOTICE '   - 8 clients créés';
  RAISE NOTICE '   - 48 devis créés (4 par mois)';
  RAISE NOTICE '   - 36 factures créées (3 par mois)';

END $$;
