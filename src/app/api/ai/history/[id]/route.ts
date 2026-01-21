import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// DELETE: Supprimer une entrée spécifique de l'historique
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier que l'entrée appartient à l'utilisateur et la supprimer
    const { error, count } = await supabase
      .from('ai_history')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Erreur suppression entrée historique IA:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    if (count === 0) {
      return NextResponse.json(
        { error: 'Entrée non trouvée ou non autorisée' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: 'Entrée supprimée' })
  } catch (error) {
    console.error('Erreur DELETE /api/ai/history/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// GET: Récupérer une entrée spécifique de l'historique
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: entry, error } = await supabase
      .from('ai_history')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !entry) {
      return NextResponse.json(
        { error: 'Entrée non trouvée' },
        { status: 404 }
      )
    }

    // Transformer pour le frontend
    const formattedEntry = {
      id: entry.id,
      timestamp: new Date(entry.created_at).getTime(),
      description: entry.description,
      trade: entry.trade,
      vatRate: entry.vat_rate,
      agent: entry.agent,
      items: entry.items || [],
    }

    return NextResponse.json(formattedEntry)
  } catch (error) {
    console.error('Erreur GET /api/ai/history/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
