import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/clients/[id]
 * Récupère un client spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer le client
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !client) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Erreur API client:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * PATCH /api/clients/[id]
 * Met à jour un client
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, email, address_line1, postal_code, city, notes } = body;

    // Validation
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Le nom du client est requis' },
        { status: 400 }
      );
    }

    // Vérifier que le client appartient à l'utilisateur
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existingClient) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
    }

    // Mettre à jour le client
    const { data: client, error } = await supabase
      .from('clients')
      .update({
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address_line1: address_line1?.trim() || null,
        postal_code: postal_code?.trim() || null,
        city: city?.trim() || null,
        notes: notes?.trim() || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur mise à jour client:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du client' },
        { status: 500 }
      );
    }

    return NextResponse.json({ client, message: 'Client mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur API client:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * DELETE /api/clients/[id]
 * Supprime un client
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que le client appartient à l'utilisateur
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existingClient) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
    }

    // Supprimer le client
    const { error } = await supabase.from('clients').delete().eq('id', id);

    if (error) {
      console.error('Erreur suppression client:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du client' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Client supprimé avec succès' });
  } catch (error) {
    console.error('Erreur API client:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
