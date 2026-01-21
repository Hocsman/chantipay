import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Types pour l'historique IA
interface AIHistoryItem {
  description: string
  quantity: number
  unit_price_ht: number
  vat_rate: number
}

interface CreateHistoryBody {
  description: string
  trade?: string
  vatRate?: number
  agent?: string
  items: AIHistoryItem[]
  totalHt?: number
}

// GET: Récupérer l'historique de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Paramètres de pagination optionnels
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const { data: history, error, count } = await supabase
      .from('ai_history')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Erreur récupération historique IA:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Transformer pour correspondre au format attendu par le frontend
    const formattedHistory = (history || []).map((entry) => ({
      id: entry.id,
      timestamp: new Date(entry.created_at).getTime(),
      description: entry.description,
      trade: entry.trade,
      vatRate: entry.vat_rate,
      agent: entry.agent,
      items: entry.items || [],
    }))

    return NextResponse.json({
      history: formattedHistory,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Erreur GET /api/ai/history:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST: Ajouter une nouvelle entrée à l'historique
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body: CreateHistoryBody = await request.json()

    // Validation
    if (!body.description || !body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { error: 'Description et items requis' },
        { status: 400 }
      )
    }

    // Calculer le total HT si non fourni
    const totalHt = body.totalHt ?? body.items.reduce(
      (sum, item) => sum + (item.quantity || 1) * (item.unit_price_ht || 0),
      0
    )

    const { data: newEntry, error } = await supabase
      .from('ai_history')
      .insert({
        user_id: user.id,
        description: body.description.slice(0, 5000), // Limiter la taille
        trade: body.trade || null,
        vat_rate: body.vatRate || null,
        agent: body.agent || null,
        items: body.items,
        total_ht: totalHt,
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur création historique IA:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    // Transformer pour le frontend
    const formattedEntry = {
      id: newEntry.id,
      timestamp: new Date(newEntry.created_at).getTime(),
      description: newEntry.description,
      trade: newEntry.trade,
      vatRate: newEntry.vat_rate,
      agent: newEntry.agent,
      items: newEntry.items || [],
    }

    return NextResponse.json(formattedEntry, { status: 201 })
  } catch (error) {
    console.error('Erreur POST /api/ai/history:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE: Supprimer tout l'historique de l'utilisateur
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { error } = await supabase
      .from('ai_history')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Erreur suppression historique IA:', error)
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Historique supprimé' })
  } catch (error) {
    console.error('Erreur DELETE /api/ai/history:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
