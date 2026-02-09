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
  v_client_id UUID;
  v_client_name TEXT;
  v_client_email TEXT;
  v_quote_id UUID;
  v_invoice_id UUID;
  v_month INT;
  v_day INT;
  v_quote_number TEXT;
  v_invoice_number TEXT;
  v_type INT;
  v_total_ht NUMERIC;
  v_total_ttc NUMERIC;
BEGIN

  -- =====================================================
  -- 1. Créer des clients de test
  -- =====================================================
  v_client_ids := ARRAY[]::UUID[];
  
  INSERT INTO public.clients (user_id, name, email, phone, address_line1, postal_code, city)
  VALUES (v_user_id, 'Dupont Jean', 'jean.dupont@email.fr', '0612345678', '12 Rue de la Paix', '75001', 'Paris')
  RETURNING id INTO v_client_id;
  v_client_ids := array_append(v_client_ids, v_client_id);
  
  INSERT INTO public.clients (user_id, name, email, phone, address_line1, postal_code, city)
  VALUES (v_user_id, 'Martin Sophie', 'sophie.martin@email.fr', '0623456789', '34 Avenue des Champs', '69001', 'Lyon')
  RETURNING id INTO v_client_id;
  v_client_ids := array_append(v_client_ids, v_client_id);
  
  INSERT INTO public.clients (user_id, name, email, phone, address_line1, postal_code, city)
  VALUES (v_user_id, 'Durand Pierre', 'pierre.durand@email.fr', '0634567890', '56 Boulevard Victor Hugo', '33000', 'Bordeaux')
  RETURNING id INTO v_client_id;
  v_client_ids := array_append(v_client_ids, v_client_id);
  
  INSERT INTO public.clients (user_id, name, email, phone, address_line1, postal_code, city)
  VALUES (v_user_id, 'Leroy Marie', 'marie.leroy@email.fr', '0645678901', '78 Rue Nationale', '59000', 'Lille')
  RETURNING id INTO v_client_id;
  v_client_ids := array_append(v_client_ids, v_client_id);
  
  INSERT INTO public.clients (user_id, name, email, phone, address_line1, postal_code, city)
  VALUES (v_user_id, 'Moreau Luc', 'luc.moreau@email.fr', '0656789012', '90 Place de la Republique', '13001', 'Marseille')
  RETURNING id INTO v_client_id;
  v_client_ids := array_append(v_client_ids, v_client_id);
  
  INSERT INTO public.clients (user_id, name, email, phone, address_line1, postal_code, city)
  VALUES (v_user_id, 'Bernard Claire', 'claire.bernard@email.fr', '0667890123', '23 Rue du Commerce', '44000', 'Nantes')
  RETURNING id INTO v_client_id;
  v_client_ids := array_append(v_client_ids, v_client_id);
  
  INSERT INTO public.clients (user_id, name, email, phone, address_line1, postal_code, city)
  VALUES (v_user_id, 'Petit Thomas', 'thomas.petit@email.fr', '0678901234', '45 Avenue Foch', '67000', 'Strasbourg')
  RETURNING id INTO v_client_id;
  v_client_ids := array_append(v_client_ids, v_client_id);
  
  INSERT INTO public.clients (user_id, name, email, phone, address_line1, postal_code, city)
  VALUES (v_user_id, 'Robert Anne', 'anne.robert@email.fr', '0689012345', '67 Rue de la Gare', '31000', 'Toulouse')
  RETURNING id INTO v_client_id;
  v_client_ids := array_append(v_client_ids, v_client_id);

  -- =====================================================
  -- 2. Créer des devis répartis sur 2025 (environ 4 par mois)
  -- =====================================================
  FOR v_month IN 1..12 LOOP
    FOR v_day IN 1..4 LOOP
      v_quote_number := 'DEV-2025-' || LPAD(v_month::TEXT, 2, '0') || LPAD((v_day * 7)::TEXT, 2, '0');
      v_type := (v_month + v_day) % 4;
      v_total_ht := 1200 + (v_month * 100) + (v_day * 50);
      v_total_ttc := v_total_ht * 1.20;
      
      INSERT INTO public.quotes (
        user_id,
        client_id,
        quote_number,
        status,
        total_ht,
        total_ttc,
        vat_rate,
        created_at,
        expires_at
      )
      VALUES (
        v_user_id,
        v_client_ids[(v_month + v_day) % ARRAY_LENGTH(v_client_ids, 1) + 1],
        v_quote_number,
        CASE 
          WHEN v_month <= 3 THEN (ARRAY['signed', 'signed', 'canceled'])[1 + v_day % 3]
          WHEN v_month <= 6 THEN (ARRAY['signed', 'sent', 'canceled'])[1 + v_day % 3]
          WHEN v_month <= 9 THEN (ARRAY['signed', 'sent', 'sent'])[1 + v_day % 3]
          WHEN v_month <= 11 THEN (ARRAY['sent', 'sent', 'draft'])[1 + v_day % 3]
          ELSE (ARRAY['sent', 'draft', 'draft'])[1 + v_day % 3]
        END,
        v_total_ht,
        v_total_ttc,
        20,
        ('2025-' || LPAD(v_month::TEXT, 2, '0') || '-' || LPAD(LEAST(v_day * 7, 28)::TEXT, 2, '0') || ' 10:00:00')::TIMESTAMP,
        ('2025-' || LPAD(v_month::TEXT, 2, '0') || '-' || LPAD(LEAST(v_day * 7 + 15, 28)::TEXT, 2, '0') || ' 23:59:59')::TIMESTAMP
      )
      RETURNING id INTO v_quote_id;

      -- Ajouter des items au devis
      IF v_type = 0 THEN
        INSERT INTO public.quote_items (quote_id, description, quantity, unit_price_ht, vat_rate, sort_order)
        VALUES
          (v_quote_id, 'Tableau electrique avec disjoncteurs differentiels', 1, 450 + (v_day * 20), 20, 1),
          (v_quote_id, 'Installation prises et interrupteurs (x15)', 15, 25, 20, 2),
          (v_quote_id, 'Mise aux normes NF C 15-100', 1, 350 + (v_month * 10), 20, 3);
      ELSIF v_type = 1 THEN
        INSERT INTO public.quote_items (quote_id, description, quantity, unit_price_ht, vat_rate, sort_order)
        VALUES
          (v_quote_id, 'Remplacement ballon eau chaude 200L', 1, 600 + (v_day * 30), 10, 1),
          (v_quote_id, 'Installation groupe de securite neuf', 1, 85, 10, 2),
          (v_quote_id, 'Essais etancheite et mise en service', 1, 120 + (v_month * 8), 20, 3);
      ELSIF v_type = 2 THEN
        INSERT INTO public.quote_items (quote_id, description, quantity, unit_price_ht, vat_rate, sort_order)
        VALUES
          (v_quote_id, 'Pose porte interieure avec bati (x3)', 3, 280, 10, 1),
          (v_quote_id, 'Fourniture et pose plinthes (40ml)', 40, 8, 20, 2),
          (v_quote_id, 'Verification conformite DTU 36.5', 1, 90, 10, 3);
      ELSE
        INSERT INTO public.quote_items (quote_id, description, quantity, unit_price_ht, vat_rate, sort_order)
        VALUES
          (v_quote_id, 'Preparation supports (poncage, enduit)', 1, 320 + (v_day * 15), 10, 1),
          (v_quote_id, 'Peinture murs et plafonds (80m2)', 80, 12, 10, 2),
          (v_quote_id, 'Finitions et protections', 1, 150, 20, 3);
      END IF;

    END LOOP;
  END LOOP;

  -- =====================================================
  -- 3. Créer des factures réparties sur 2025 (environ 3 par mois)
  -- =====================================================
  FOR v_month IN 1..12 LOOP
    FOR v_day IN 1..3 LOOP
      v_invoice_number := 'FACT-2025-' || LPAD(v_month::TEXT, 2, '0') || LPAD((v_day * 10)::TEXT, 2, '0');
      v_type := (v_month + v_day) % 4;
      v_total_ht := 1500 + (v_month * 120) + (v_day * 60);
      v_total_ttc := v_total_ht * 1.20;
      
      -- Récupérer le nom et email du client
      SELECT name, email INTO v_client_name, v_client_email
      FROM public.clients
      WHERE id = v_client_ids[(v_month + v_day * 2) % ARRAY_LENGTH(v_client_ids, 1) + 1];
      
      INSERT INTO public.invoices (
        user_id,
        client_id,
        client_name,
        client_email,
        invoice_number,
        payment_status,
        subtotal,
        tax_rate,
        tax_amount,
        total,
        issue_date,
        due_date,
        paid_at,
        notes
      )
      VALUES (
        v_user_id,
        v_client_ids[(v_month + v_day * 2) % ARRAY_LENGTH(v_client_ids, 1) + 1],
        v_client_name,
        v_client_email,
        v_invoice_number,
        CASE 
          WHEN v_month <= 7 THEN 'paid'
          WHEN v_month = 8 THEN (ARRAY['paid', 'paid', 'sent'])[1 + v_day % 3]
          WHEN v_month = 9 THEN (ARRAY['paid', 'sent', 'sent'])[1 + v_day % 3]
          WHEN v_month = 10 THEN (ARRAY['paid', 'sent', 'overdue'])[1 + v_day % 3]
          WHEN v_month = 11 THEN (ARRAY['sent', 'overdue', 'overdue'])[1 + v_day % 3]
          ELSE (ARRAY['sent', 'sent', 'canceled'])[1 + v_day % 3]
        END,
        v_total_ht,
        20,
        v_total_ht * 0.20,
        v_total_ttc,
        ('2025-' || LPAD(v_month::TEXT, 2, '0') || '-' || LPAD(LEAST(v_day * 10, 28)::TEXT, 2, '0'))::DATE,
        ('2025-' || LPAD(v_month::TEXT, 2, '0') || '-' || LPAD(LEAST(v_day * 10 + 15, 28)::TEXT, 2, '0'))::DATE,
        CASE 
          WHEN v_month <= 7 THEN ('2025-' || LPAD(v_month::TEXT, 2, '0') || '-' || LPAD(LEAST(v_day * 10 + 10, 28)::TEXT, 2, '0') || ' 14:30:00')::TIMESTAMP
          WHEN v_month = 8 AND v_day <= 2 THEN ('2025-' || LPAD(v_month::TEXT, 2, '0') || '-' || LPAD(LEAST(v_day * 10 + 12, 28)::TEXT, 2, '0') || ' 16:00:00')::TIMESTAMP
          ELSE NULL
        END,
        CASE v_type
          WHEN 0 THEN 'Travaux electricite - Mise aux normes NF C 15-100'
          WHEN 1 THEN 'Intervention plomberie - Conformite DTU 60.1'
          WHEN 2 THEN 'Menuiserie et agencement - DTU 36.5'
          ELSE 'Peinture et ravalement - DTU 59.1'
        END
      )
      RETURNING id INTO v_invoice_id;

      -- Ajouter des items a la facture
      IF v_type = 0 THEN
        INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, total, sort_order)
        VALUES
          (v_invoice_id, 'Renovation tableau electrique complet', 1, 680 + (v_day * 25), 680 + (v_day * 25), 1),
          (v_invoice_id, 'Installation points lumineux (x12)', 12, 35, 420, 2),
          (v_invoice_id, 'Deplacement et main oeuvre', 1, 400 + (v_month * 15), 400 + (v_month * 15), 3);
      ELSIF v_type = 1 THEN
        INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, total, sort_order)
        VALUES
          (v_invoice_id, 'Installation sanitaire complete (lavabo, WC)', 1, 850 + (v_day * 30), 850 + (v_day * 30), 1),
          (v_invoice_id, 'Fourniture robinetterie et accessoires', 1, 280, 280, 2),
          (v_invoice_id, 'Essais, mise en service et controle', 1, 370 + (v_month * 12), 370 + (v_month * 12), 3);
      ELSIF v_type = 2 THEN
        INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, total, sort_order)
        VALUES
          (v_invoice_id, 'Fourniture et pose fenetres PVC (x4)', 4, 320, 1280, 1),
          (v_invoice_id, 'Habillage et finitions bois', 1, 220, 220, 2);
      ELSE
        INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, total, sort_order)
        VALUES
          (v_invoice_id, 'Preparation complete des surfaces (120m2)', 120, 8, 960, 1),
          (v_invoice_id, 'Peinture acrylique professionnelle', 1, 540 + (v_month * 10), 540 + (v_month * 10), 2);
      END IF;

    END LOOP;
  END LOOP;

  RAISE NOTICE 'Donnees de test 2025 injectees avec succes !';
  RAISE NOTICE '   - 8 clients crees';
  RAISE NOTICE '   - 48 devis crees (4 par mois)';
  RAISE NOTICE '   - 36 factures creees (3 par mois)';

END $$;
