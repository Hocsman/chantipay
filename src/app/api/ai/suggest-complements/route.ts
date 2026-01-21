import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAISecurity, type AIRequestContext } from '@/lib/security/aiMiddleware'
import { getFromCache, setInCache, generateCacheKey } from '@/lib/redis'
import { createClient } from '@/lib/supabase/server'
import {
  normalizeRegion,
  normalizeSeason,
  getPricingMultiplier,
  applyPricingMultiplier,
  buildPricingContextLabel,
  type PricingRegion,
  type PricingSeason,
} from '@/lib/ai/pricing'

// ===========================================
// Input Validation Schema
// ===========================================
const quoteItemSchema = z.object({
  description: z.string(),
  quantity: z.number(),
  unit_price_ht: z.number(),
  vat_rate: z.number(),
})

const suggestComplementsInputSchema = z.object({
  items: z.array(quoteItemSchema).min(1, 'Au moins une ligne de devis requise'),
  trade: z.string().optional(),
  region: z.string().optional(),
  season: z.string().optional(),
  client_id: z.string().optional(),
})

type SuggestComplementsInput = z.infer<typeof suggestComplementsInputSchema>

// ===========================================
// Output Schema
// ===========================================
interface ComplementSuggestion {
  id: string
  description: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  category: 'obligatoire' | 'recommandé' | 'optionnel'
  estimated_price_ht: number
  vat_rate: number
}

interface SuggestComplementsResult {
  suggestions: ComplementSuggestion[]
  message?: string
  personalized?: boolean
}

type AcceptanceStats = {
  suggestion: ComplementSuggestion
  count: number
}

type PricingContext = {
  region: PricingRegion
  season: PricingSeason
  multiplier: number
  label: string
}

function buildPricingContext(region?: string, season?: string): PricingContext {
  const normalizedRegion = normalizeRegion(region)
  const normalizedSeason = normalizeSeason(season)
  const multiplier = getPricingMultiplier(normalizedRegion, normalizedSeason)
  const label = buildPricingContextLabel(normalizedRegion, normalizedSeason, multiplier)
  return {
    region: normalizedRegion,
    season: normalizedSeason,
    multiplier,
    label,
  }
}

function applyPricingToSuggestions(
  suggestions: ComplementSuggestion[],
  multiplier: number
): ComplementSuggestion[] {
  if (multiplier === 1) return suggestions
  return suggestions.map((suggestion) => ({
    ...suggestion,
    estimated_price_ht: applyPricingMultiplier(suggestion.estimated_price_ht, multiplier),
  }))
}

function dedupeSuggestions(suggestions: ComplementSuggestion[]): ComplementSuggestion[] {
  const seen = new Set<string>()
  const result: ComplementSuggestion[] = []

  for (const suggestion of suggestions) {
    const key = `${suggestion.id}:${suggestion.description.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push(suggestion)
  }

  return result
}

function sortSuggestions(
  suggestions: ComplementSuggestion[],
  acceptanceMap: Map<string, number>
): ComplementSuggestion[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const categoryOrder = { obligatoire: 0, recommandé: 1, optionnel: 2 }

  return [...suggestions].sort((a, b) => {
    const acceptanceA = acceptanceMap.get(a.id) || 0
    const acceptanceB = acceptanceMap.get(b.id) || 0
    if (acceptanceA !== acceptanceB) return acceptanceB - acceptanceA

    if (categoryOrder[a.category] !== categoryOrder[b.category]) {
      return categoryOrder[a.category] - categoryOrder[b.category]
    }

    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

// ===========================================
// Pre-defined Suggestions by Trade
// ===========================================
const TRADE_SUGGESTIONS: Record<string, ComplementSuggestion[]> = {
  electricite: [
    {
      id: 'elec-detecteur-fumee',
      description: 'Détecteur de fumée (DAAF) - Obligatoire',
      reason: 'Obligatoire dans tous les logements depuis 2015',
      priority: 'high',
      category: 'obligatoire',
      estimated_price_ht: 25,
      vat_rate: 10,
    },
    {
      id: 'elec-diff-30ma',
      description: 'Protection différentielle 30mA type A',
      reason: 'Sécurité électrique obligatoire NF C 15-100',
      priority: 'high',
      category: 'obligatoire',
      estimated_price_ht: 85,
      vat_rate: 10,
    },
    {
      id: 'elec-mise-terre',
      description: 'Vérification et mise à la terre',
      reason: 'Indispensable pour la sécurité des personnes',
      priority: 'high',
      category: 'recommandé',
      estimated_price_ht: 150,
      vat_rate: 10,
    },
    {
      id: 'elec-parafoudre',
      description: 'Parafoudre de tableau',
      reason: 'Protection contre les surtensions (zones exposées)',
      priority: 'medium',
      category: 'recommandé',
      estimated_price_ht: 120,
      vat_rate: 10,
    },
    {
      id: 'elec-consuel',
      description: 'Attestation CONSUEL',
      reason: 'Nécessaire pour mise en service installation neuve',
      priority: 'medium',
      category: 'optionnel',
      estimated_price_ht: 180,
      vat_rate: 20,
    },
  ],
  plomberie: [
    {
      id: 'plomb-groupe-secu',
      description: 'Groupe de sécurité neuf',
      reason: 'Obligatoire sur ballon eau chaude, à remplacer si usé',
      priority: 'high',
      category: 'recommandé',
      estimated_price_ht: 45,
      vat_rate: 10,
    },
    {
      id: 'plomb-vase-expansion',
      description: 'Vase d\'expansion sanitaire',
      reason: 'Prolonge la durée de vie du groupe de sécurité',
      priority: 'medium',
      category: 'recommandé',
      estimated_price_ht: 75,
      vat_rate: 10,
    },
    {
      id: 'plomb-reducteur-pression',
      description: 'Réducteur de pression',
      reason: 'Protège l\'installation si pression > 3 bars',
      priority: 'medium',
      category: 'recommandé',
      estimated_price_ht: 85,
      vat_rate: 10,
    },
    {
      id: 'plomb-anti-calcaire',
      description: 'Filtre anti-calcaire ou adoucisseur',
      reason: 'Prolonge la durée de vie des équipements (eau dure)',
      priority: 'low',
      category: 'optionnel',
      estimated_price_ht: 250,
      vat_rate: 10,
    },
    {
      id: 'plomb-contrat-entretien',
      description: 'Contrat d\'entretien annuel chaudière/ballon',
      reason: 'Obligatoire pour chaudière gaz, recommandé pour ballon',
      priority: 'medium',
      category: 'recommandé',
      estimated_price_ht: 120,
      vat_rate: 20,
    },
  ],
  renovation: [
    {
      id: 'reno-protection-chantier',
      description: 'Protection du chantier (bâches, cartons)',
      reason: 'Évite les dégradations accidentelles',
      priority: 'high',
      category: 'recommandé',
      estimated_price_ht: 80,
      vat_rate: 20,
    },
    {
      id: 'reno-evacuation-gravats',
      description: 'Évacuation des gravats et déchets',
      reason: 'Obligatoire pour laisser le chantier propre',
      priority: 'high',
      category: 'recommandé',
      estimated_price_ht: 200,
      vat_rate: 20,
    },
    {
      id: 'reno-nettoyage-fin',
      description: 'Nettoyage de fin de chantier',
      reason: 'Service apprécié par les clients',
      priority: 'medium',
      category: 'optionnel',
      estimated_price_ht: 150,
      vat_rate: 20,
    },
    {
      id: 'reno-diagnostic-amiante',
      description: 'Diagnostic amiante avant travaux',
      reason: 'Obligatoire pour bâtiments avant 1997',
      priority: 'high',
      category: 'obligatoire',
      estimated_price_ht: 250,
      vat_rate: 20,
    },
  ],
  peinture: [
    {
      id: 'peint-protection-sols',
      description: 'Protection des sols et meubles',
      reason: 'Évite les taches et projections',
      priority: 'high',
      category: 'recommandé',
      estimated_price_ht: 60,
      vat_rate: 20,
    },
    {
      id: 'peint-preparation-support',
      description: 'Préparation complète du support (rebouchage, ponçage)',
      reason: 'Garantit un résultat durable et esthétique',
      priority: 'high',
      category: 'recommandé',
      estimated_price_ht: 15,
      vat_rate: 10,
    },
    {
      id: 'peint-sous-couche',
      description: 'Sous-couche d\'accrochage',
      reason: 'Améliore l\'adhérence et le rendu final',
      priority: 'medium',
      category: 'recommandé',
      estimated_price_ht: 8,
      vat_rate: 10,
    },
    {
      id: 'peint-peinture-plafond',
      description: 'Peinture plafond (si non incluse)',
      reason: 'Souvent oubliée, améliore le rendu global',
      priority: 'medium',
      category: 'optionnel',
      estimated_price_ht: 12,
      vat_rate: 10,
    },
  ],
  menuiserie: [
    {
      id: 'menu-quincaillerie',
      description: 'Quincaillerie de qualité (poignées, charnières)',
      reason: 'Améliore la durabilité et l\'esthétique',
      priority: 'medium',
      category: 'recommandé',
      estimated_price_ht: 45,
      vat_rate: 20,
    },
    {
      id: 'menu-joints-etancheite',
      description: 'Joints d\'étanchéité neufs',
      reason: 'Améliore l\'isolation thermique et phonique',
      priority: 'high',
      category: 'recommandé',
      estimated_price_ht: 35,
      vat_rate: 10,
    },
    {
      id: 'menu-traitement-bois',
      description: 'Traitement du bois (insecticide, fongicide)',
      reason: 'Prolonge la durée de vie des menuiseries',
      priority: 'medium',
      category: 'optionnel',
      estimated_price_ht: 80,
      vat_rate: 10,
    },
    {
      id: 'menu-evacuation-anciennes',
      description: 'Dépose et évacuation anciennes menuiseries',
      reason: 'Service complet, évite au client de s\'en occuper',
      priority: 'medium',
      category: 'recommandé',
      estimated_price_ht: 50,
      vat_rate: 20,
    },
  ],
}

// Generic suggestions for all trades
const GENERIC_SUGGESTIONS: ComplementSuggestion[] = [
  {
    id: 'gen-deplacement',
    description: 'Frais de déplacement',
    reason: 'Couvre les trajets et le temps de transport',
    priority: 'medium',
    category: 'recommandé',
    estimated_price_ht: 35,
    vat_rate: 20,
  },
  {
    id: 'gen-garantie-decennale',
    description: 'Attestation garantie décennale',
    reason: 'Document obligatoire pour travaux structurels',
    priority: 'low',
    category: 'optionnel',
    estimated_price_ht: 0,
    vat_rate: 0,
  },
]

function normalizeCategory(value?: string | null): ComplementSuggestion['category'] {
  if (value === 'obligatoire' || value === 'recommandé' || value === 'optionnel') return value
  if (value === 'recommande') return 'recommandé'
  return 'recommandé'
}

function normalizePriority(value?: string | null): ComplementSuggestion['priority'] {
  if (value === 'high' || value === 'medium' || value === 'low') return value
  return 'medium'
}

async function loadComplianceRules(
  supabase: Awaited<ReturnType<typeof createClient>>,
  trade?: string
): Promise<ComplementSuggestion[]> {
  if (!trade) return []

  const { data, error } = await supabase
    .from('ai_compliance_rules')
    .select('id, title, reason, reference, category, priority, estimated_price_ht, vat_rate')
    .eq('trade', trade)
    .eq('active', true)
    .order('priority', { ascending: true })

  if (error || !data) return []

  return data.map((rule) => ({
    id: rule.id,
    description: rule.reference ? `${rule.title} (${rule.reference})` : rule.title,
    reason: rule.reason || rule.reference || 'Règle métier',
    priority: normalizePriority(rule.priority),
    category: normalizeCategory(rule.category),
    estimated_price_ht: Math.max(Number(rule.estimated_price_ht) || 1, 1),
    vat_rate: Number(rule.vat_rate) || 10,
  }))
}

async function loadAcceptanceStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  trade?: string
): Promise<{
  acceptanceMap: Map<string, number>
  acceptedSuggestions: ComplementSuggestion[]
  acceptedContext: string
}> {
  let query = supabase
    .from('ai_suggestion_acceptances')
    .select('suggestion_id, description, category, estimated_price_ht, vat_rate, trade')
    .eq('user_id', userId)
    .order('accepted_at', { ascending: false })
    .limit(100)

  if (trade) {
    query = query.eq('trade', trade)
  }

  const { data, error } = await query
  if (error || !data) {
    return { acceptanceMap: new Map(), acceptedSuggestions: [], acceptedContext: '' }
  }

  const stats = new Map<string, AcceptanceStats>()

  for (const entry of data) {
    const id = entry.suggestion_id
    if (!stats.has(id)) {
      stats.set(id, {
        count: 0,
        suggestion: {
          id,
          description: entry.description || 'Suggestion acceptée',
          reason: 'Souvent accepté par vous',
          priority: 'medium',
          category: normalizeCategory(entry.category),
          estimated_price_ht: Math.max(Number(entry.estimated_price_ht) || 1, 1),
          vat_rate: Number(entry.vat_rate) || 10,
        },
      })
    }
    const current = stats.get(id)
    if (current) {
      current.count += 1
    }
  }

  const sortedStats = [...stats.values()].sort((a, b) => b.count - a.count)
  const acceptedSuggestions = sortedStats.slice(0, 2).map((entry) => entry.suggestion)
  const acceptanceMap = new Map(sortedStats.map((entry) => [entry.suggestion.id, entry.count]))
  const acceptedContext = acceptedSuggestions.length
    ? `Éléments souvent acceptés: ${acceptedSuggestions.map((s) => s.description).join(', ')}`
    : ''

  return { acceptanceMap, acceptedSuggestions, acceptedContext }
}

// ===========================================
// System Prompt for AI Suggestions
// ===========================================
const SYSTEM_PROMPT = `Tu es un expert en estimation de travaux pour artisans français.
Tu analyses un devis existant pour suggérer des éléments complémentaires souvent oubliés.

RÈGLES STRICTES:
1. Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte additionnel
2. Suggère des éléments pertinents par rapport au contenu du devis
3. Priorise les éléments obligatoires (normes, sécurité)
4. Les prix doivent être réalistes pour le marché français
5. Maximum 5 suggestions pertinentes
6. Prends en compte le contexte tarifaire (région, saison) s'il est fourni
7. Intègre les règles métier transmises et les préférences utilisateur

CATÉGORIES:
- "obligatoire": Requis par la loi ou les normes
- "recommandé": Fortement conseillé pour la qualité/sécurité
- "optionnel": Améliore le service mais pas indispensable

FORMAT DE RÉPONSE:
{
  "suggestions": [
    {
      "id": "unique-id",
      "description": "Description courte du complément",
      "reason": "Explication pourquoi c'est important",
      "priority": "high|medium|low",
      "category": "obligatoire|recommandé|optionnel",
      "estimated_price_ht": 100,
      "vat_rate": 10
    }
  ],
  "message": "Message optionnel pour le client"
}`

// ===========================================
// OpenAI API Call
// ===========================================
async function callOpenAI(
  items: z.infer<typeof quoteItemSchema>[],
  trade: string | undefined,
  pricingContext: PricingContext,
  rulesContext: string,
  acceptedContext: string
): Promise<SuggestComplementsResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  const itemDescriptions = items.map((item, i) =>
    `${i + 1}. ${item.description} (Qté: ${item.quantity}, Prix: ${item.unit_price_ht}€ HT)`
  ).join('\n')

  const userPrompt = [
    trade ? `Métier: ${trade}` : '',
    pricingContext.label ? `Contexte tarifaire: ${pricingContext.label}` : '',
    rulesContext ? `Règles métier applicables:\n${rulesContext}` : '',
    acceptedContext ? `${acceptedContext}` : '',
    '',
    'Lignes du devis actuel:',
    itemDescriptions,
    '',
    'Suggère des compléments pertinents qui pourraient être oubliés.',
  ].filter(Boolean).join('\n')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('OpenAI API error:', error)
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('No content in OpenAI response')
  }

  const parsed = JSON.parse(content)

  if (!Array.isArray(parsed.suggestions)) {
    throw new Error('Invalid response: expected suggestions array')
  }

  return parsed as SuggestComplementsResult
}

// ===========================================
// Fallback Generation (without API)
// ===========================================
function generateFallback(
  items: z.infer<typeof quoteItemSchema>[],
  trade: string | undefined,
  pricingMultiplier: number
): SuggestComplementsResult {
  const itemDescriptions = items.map(i => i.description.toLowerCase()).join(' ')

  let suggestions: ComplementSuggestion[] = []

  // Get trade-specific suggestions
  if (trade && TRADE_SUGGESTIONS[trade]) {
    suggestions = [...TRADE_SUGGESTIONS[trade]]
  } else {
    // Try to detect trade from item descriptions
    if (itemDescriptions.includes('électri') || itemDescriptions.includes('tableau') || itemDescriptions.includes('prise') || itemDescriptions.includes('disjoncteur')) {
      suggestions = [...TRADE_SUGGESTIONS.electricite]
    } else if (itemDescriptions.includes('plomb') || itemDescriptions.includes('chauffe-eau') || itemDescriptions.includes('ballon') || itemDescriptions.includes('robinet') || itemDescriptions.includes('chaudière')) {
      suggestions = [...TRADE_SUGGESTIONS.plomberie]
    } else if (itemDescriptions.includes('peinture') || itemDescriptions.includes('peindre') || itemDescriptions.includes('mur') || itemDescriptions.includes('plafond')) {
      suggestions = [...TRADE_SUGGESTIONS.peinture]
    } else if (itemDescriptions.includes('menuiserie') || itemDescriptions.includes('fenêtre') || itemDescriptions.includes('porte') || itemDescriptions.includes('volet')) {
      suggestions = [...TRADE_SUGGESTIONS.menuiserie]
    } else if (itemDescriptions.includes('rénovation') || itemDescriptions.includes('travaux') || itemDescriptions.includes('démolition')) {
      suggestions = [...TRADE_SUGGESTIONS.renovation]
    }
  }

  // Filter out suggestions that might already be in the quote
  suggestions = suggestions.filter(suggestion => {
    const suggestionKeywords = suggestion.description.toLowerCase().split(' ')
    // Check if any keyword from the suggestion is NOT in any item description
    return !suggestionKeywords.some(keyword =>
      keyword.length > 4 && itemDescriptions.includes(keyword)
    )
  })

  // Add generic suggestions if not already covered
  const hasDeplacementInItems = itemDescriptions.includes('déplacement') || itemDescriptions.includes('transport')
  if (!hasDeplacementInItems) {
    suggestions.push(GENERIC_SUGGESTIONS[0])
  }

  // Limit to 5 most relevant suggestions (prioritize by category and priority)
  suggestions.sort((a, b) => {
    const categoryOrder = { obligatoire: 0, recommandé: 1, optionnel: 2 }
    const priorityOrder = { high: 0, medium: 1, low: 2 }

    const catDiff = categoryOrder[a.category] - categoryOrder[b.category]
    if (catDiff !== 0) return catDiff

    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  suggestions = suggestions.slice(0, 5)

  const adjusted = applyPricingToSuggestions(suggestions, pricingMultiplier)

  return {
    suggestions: adjusted,
    message: adjusted.length > 0
      ? `${suggestions.filter(s => s.category === 'obligatoire').length > 0 ? 'Attention: certains éléments peuvent être obligatoires.' : 'Voici quelques compléments recommandés pour votre devis.'}`
      : undefined,
  }
}

// ===========================================
// API Route Handler
// ===========================================
async function handleSuggestComplements(
  _request: NextRequest,
  context: AIRequestContext,
  input: SuggestComplementsInput
): Promise<NextResponse> {
  // Validate input
  const validationResult = suggestComplementsInputSchema.safeParse(input)
  if (!validationResult.success) {
    const errors = validationResult.error.issues.map(e => e.message).join(', ')
    return NextResponse.json({ error: errors }, { status: 400 })
  }

  const { items, trade, region, season } = validationResult.data
  const pricingContext = buildPricingContext(region, season)

  const supabase = await createClient()
  const complianceRules = await loadComplianceRules(supabase, trade)
  const rulesContext = complianceRules.length
    ? complianceRules.map((rule) => `- ${rule.description}: ${rule.reason}`).join('\n')
    : ''

  let acceptanceMap = new Map<string, number>()
  let acceptedSuggestions: ComplementSuggestion[] = []
  let acceptanceSignature = ''
  let acceptedContext = ''

  if (context.user) {
    const acceptance = await loadAcceptanceStats(supabase, context.user.id, trade)
    acceptanceMap = acceptance.acceptanceMap
    acceptedSuggestions = acceptance.acceptedSuggestions
    acceptanceSignature = acceptedSuggestions
      .map((suggestion) => `${suggestion.id}:${acceptanceMap.get(suggestion.id) || 0}`)
      .join('|')
    acceptedContext = acceptance.acceptedContext
  }

  // Check cache first
  const cacheKey = generateCacheKey({
    prefix: 'suggest-complements',
    items,
    trade,
    region: pricingContext.region,
    season: pricingContext.season,
    user: context.user?.id || 'anon',
    acceptance: acceptanceSignature || 'none',
    rules: complianceRules.map((rule) => rule.id).join('|') || 'none',
  })
  const cached = await getFromCache<SuggestComplementsResult>('aiResponse', cacheKey)
  if (cached) {
    return NextResponse.json({ ...cached, fromCache: true })
  }

  let result: SuggestComplementsResult

  try {
    // Try OpenAI API first
    result = await callOpenAI(items, trade, pricingContext, rulesContext, acceptedContext)
  } catch (error) {
    console.warn('OpenAI call failed, using fallback:', error)
    // Fallback to pre-defined suggestions
    result = generateFallback(items, trade, pricingContext.multiplier)
  }

  const adjustedRules = applyPricingToSuggestions(complianceRules, pricingContext.multiplier)
  const adjustedAccepted = applyPricingToSuggestions(acceptedSuggestions, pricingContext.multiplier)
  const mergedSuggestions = dedupeSuggestions([
    ...adjustedRules,
    ...adjustedAccepted,
    ...(result.suggestions || []),
  ])

  const sortedSuggestions = sortSuggestions(mergedSuggestions, acceptanceMap).slice(0, 5)
  const message = sortedSuggestions.length > 0
    ? `${sortedSuggestions.filter(s => s.category === 'obligatoire').length > 0 ? 'Attention: certains éléments peuvent être obligatoires.' : 'Voici quelques compléments recommandés pour votre devis.'}`
    : undefined

  const finalResult = {
    suggestions: sortedSuggestions,
    message,
    personalized: acceptedSuggestions.length > 0,
  }

  // Cache successful result (10 minutes)
  await setInCache('aiResponse', cacheKey, finalResult, 600)

  // Log pour analytics
  if (context.user) {
    console.log(`[AI:Complements] User ${context.user.id} requested suggestions, trade: ${trade || 'none'}`)
  }

  return NextResponse.json(finalResult)
}

export const POST = withAISecurity<SuggestComplementsInput>(
  {
    action: 'ai:suggest-complements',
    requireAuth: false,
    allowAnonymous: true,
  },
  handleSuggestComplements
)
