import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAISecurity, type AIRequestContext } from '@/lib/security/aiMiddleware'
import { createClient } from '@/lib/supabase/server'

const suggestionSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['obligatoire', 'recommandé', 'optionnel']),
  estimated_price_ht: z.number().min(0),
  vat_rate: z.number().min(0),
})

const acceptSuggestionsSchema = z.object({
  suggestions: z.array(suggestionSchema).min(1),
  trade: z.string().optional(),
  region: z.string().optional(),
  season: z.string().optional(),
})

type AcceptSuggestionsInput = z.infer<typeof acceptSuggestionsSchema>

async function handleAcceptSuggestions(
  _request: NextRequest,
  context: AIRequestContext,
  body: AcceptSuggestionsInput
): Promise<NextResponse> {
  if (!context.user) {
    return NextResponse.json({ error: 'Authentification requise' }, { status: 401 })
  }

  const validationResult = acceptSuggestionsSchema.safeParse(body)
  if (!validationResult.success) {
    const errors = validationResult.error.issues.map((e) => e.message).join(', ')
    return NextResponse.json({ error: errors }, { status: 400 })
  }

  const { suggestions, trade, region, season } = validationResult.data
  const supabase = await createClient()

  const rows = suggestions.map((suggestion) => ({
    user_id: context.user?.id,
    suggestion_id: suggestion.id,
    trade: trade || null,
    description: suggestion.description,
    category: suggestion.category,
    estimated_price_ht: suggestion.estimated_price_ht,
    vat_rate: suggestion.vat_rate,
    metadata: {
      region: region || null,
      season: season || null,
    },
  }))

  const { error } = await supabase
    .from('ai_suggestion_acceptances')
    .insert(rows)

  if (error) {
    console.error('[AI:Suggestions] Error saving acceptances:', error)
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export const POST = withAISecurity<AcceptSuggestionsInput>(
  {
    action: 'ai:suggest-complements',
    requireAuth: true,
    allowAnonymous: false,
  },
  handleAcceptSuggestions
)
