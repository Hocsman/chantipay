import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ===========================================
// Input Validation Schema
// ===========================================
const getPreferencesInputSchema = z.object({
  trade: z.string().optional(),
  itemDescription: z.string().optional(),
})

// ===========================================
// Output Types
// ===========================================
interface PriceStatistics {
  avgPrice: number
  minPrice: number
  maxPrice: number
  count: number
  lastUsed: string | null
}

interface CategoryPreference {
  category: string
  avgPrice: number
  count: number
  commonDescriptions: string[]
}

interface UserPreferences {
  // Prix moyens par catégorie de travaux
  pricesByCategory: Record<string, PriceStatistics>
  // Taux horaire moyen détecté
  avgHourlyRate: number | null
  // Formulations fréquentes
  commonFormulations: string[]
  // Préférences de TVA
  preferredVatRates: { rate: number; count: number }[]
  // Statistiques globales
  totalQuotes: number
  totalItems: number
  // Détection d'anomalies
  priceAnomalyThreshold: {
    low: number  // Prix considéré comme trop bas
    high: number // Prix considéré comme trop haut
  } | null
}

interface PriceHint {
  message: string | null
  suggestedPrice: number | null
  confidence: 'high' | 'medium' | 'low'
  basedOn: number // Nombre de devis analysés
}

// ===========================================
// Helper Functions
// ===========================================

// Catégoriser une description de ligne de devis
function categorizeDescription(description: string): string {
  const lower = description.toLowerCase()

  // Électricité
  if (lower.includes('tableau') || lower.includes('disjoncteur') || lower.includes('différentiel')) {
    return 'electricite_tableau'
  }
  if (lower.includes('prise') || lower.includes('interrupteur')) {
    return 'electricite_appareillage'
  }
  if (lower.includes('câbl') || lower.includes('tirage') || lower.includes('fil')) {
    return 'electricite_cablage'
  }

  // Plomberie
  if (lower.includes('chauffe-eau') || lower.includes('ballon') || lower.includes('cumulus')) {
    return 'plomberie_eau_chaude'
  }
  if (lower.includes('robinet') || lower.includes('mitigeur')) {
    return 'plomberie_robinetterie'
  }
  if (lower.includes('wc') || lower.includes('toilette') || lower.includes('cuvette')) {
    return 'plomberie_sanitaire'
  }
  if (lower.includes('tuyau') || lower.includes('canalisation') || lower.includes('évacuation')) {
    return 'plomberie_tuyauterie'
  }

  // Peinture
  if (lower.includes('peinture') || lower.includes('peindre')) {
    if (lower.includes('plafond')) return 'peinture_plafond'
    if (lower.includes('mur')) return 'peinture_mur'
    return 'peinture_general'
  }

  // Main d'œuvre
  if (lower.includes('main d\'œuvre') || lower.includes('main d\'oeuvre') || lower.includes('mo ') || lower.includes('heure')) {
    return 'main_oeuvre'
  }

  // Déplacement
  if (lower.includes('déplacement') || lower.includes('transport')) {
    return 'deplacement'
  }

  // Fournitures
  if (lower.includes('fourniture') || lower.includes('matéri')) {
    return 'fournitures'
  }

  return 'autre'
}

// Extraire le taux horaire d'une description
function extractHourlyRate(description: string, price: number, quantity: number): number | null {
  const lower = description.toLowerCase()

  // Chercher des patterns comme "X heures", "Xh", etc.
  const hourPatterns = [
    /(\d+(?:[.,]\d+)?)\s*(?:heure|h)\b/i,
    /main d'œuvre.*?(\d+(?:[.,]\d+)?)\s*h/i,
  ]

  for (const pattern of hourPatterns) {
    const match = lower.match(pattern)
    if (match) {
      const hours = parseFloat(match[1].replace(',', '.'))
      if (hours > 0) {
        return price / hours
      }
    }
  }

  // Si la quantité est en heures (détection heuristique)
  if ((lower.includes('heure') || lower.includes(' h ') || lower.match(/\bh\b/)) && quantity > 0) {
    return price / quantity
  }

  return null
}

// ===========================================
// API Route Handler - GET
// ===========================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url)
    const trade = searchParams.get('trade') || undefined
    const itemDescription = searchParams.get('itemDescription') || undefined

    // Récupérer les devis de l'utilisateur (status: sent, accepted, ou paid = validés)
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select(`
        id,
        created_at,
        status,
        vat_rate,
        quote_items (
          description,
          quantity,
          unit_price_ht,
          vat_rate
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['sent', 'accepted', 'paid'])
      .order('created_at', { ascending: false })
      .limit(100) // Limiter pour les performances

    if (quotesError) {
      console.error('Erreur récupération devis:', quotesError)
      throw new Error('Erreur lors de la récupération des devis')
    }

    if (!quotes || quotes.length === 0) {
      return NextResponse.json({
        pricesByCategory: {},
        avgHourlyRate: null,
        commonFormulations: [],
        preferredVatRates: [],
        totalQuotes: 0,
        totalItems: 0,
        priceAnomalyThreshold: null,
      } as UserPreferences)
    }

    // Analyser les données
    const pricesByCategory: Record<string, { prices: number[], descriptions: string[], lastUsed: string | null }> = {}
    const hourlyRates: number[] = []
    const vatRateCounts: Record<number, number> = {}
    const allDescriptions: string[] = []
    let totalItems = 0

    for (const quote of quotes) {
      const items = quote.quote_items || []

      for (const item of items) {
        totalItems++
        const category = categorizeDescription(item.description)
        const unitPrice = item.unit_price_ht

        // Initialiser la catégorie si nécessaire
        if (!pricesByCategory[category]) {
          pricesByCategory[category] = { prices: [], descriptions: [], lastUsed: null }
        }

        pricesByCategory[category].prices.push(unitPrice)
        pricesByCategory[category].descriptions.push(item.description)
        if (!pricesByCategory[category].lastUsed) {
          pricesByCategory[category].lastUsed = quote.created_at
        }

        // Extraire le taux horaire
        const hourlyRate = extractHourlyRate(item.description, unitPrice, item.quantity)
        if (hourlyRate && hourlyRate > 20 && hourlyRate < 200) { // Filtrer les valeurs aberrantes
          hourlyRates.push(hourlyRate)
        }

        // Compter les taux de TVA
        const vatRate = item.vat_rate || quote.vat_rate || 20
        vatRateCounts[vatRate] = (vatRateCounts[vatRate] || 0) + 1

        // Collecter les descriptions
        allDescriptions.push(item.description)
      }
    }

    // Calculer les statistiques par catégorie
    const priceStatsByCategory: Record<string, PriceStatistics> = {}
    for (const [category, data] of Object.entries(pricesByCategory)) {
      if (data.prices.length > 0) {
        const sorted = [...data.prices].sort((a, b) => a - b)
        priceStatsByCategory[category] = {
          avgPrice: Math.round(data.prices.reduce((a, b) => a + b, 0) / data.prices.length * 100) / 100,
          minPrice: sorted[0],
          maxPrice: sorted[sorted.length - 1],
          count: data.prices.length,
          lastUsed: data.lastUsed,
        }
      }
    }

    // Calculer le taux horaire moyen
    const avgHourlyRate = hourlyRates.length > 0
      ? Math.round(hourlyRates.reduce((a, b) => a + b, 0) / hourlyRates.length * 100) / 100
      : null

    // Trier les taux de TVA par fréquence
    const preferredVatRates = Object.entries(vatRateCounts)
      .map(([rate, count]) => ({ rate: parseFloat(rate), count }))
      .sort((a, b) => b.count - a.count)

    // Extraire les formulations fréquentes (mots clés)
    const wordFrequency: Record<string, number> = {}
    for (const desc of allDescriptions) {
      const words = desc.toLowerCase().split(/\s+/).filter(w => w.length > 3)
      for (const word of words) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1
      }
    }
    const commonFormulations = Object.entries(wordFrequency)
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word)

    // Calculer le seuil d'anomalie de prix
    const allPrices = Object.values(pricesByCategory).flatMap(d => d.prices)
    let priceAnomalyThreshold = null
    if (allPrices.length >= 10) {
      const sorted = [...allPrices].sort((a, b) => a - b)
      const q1 = sorted[Math.floor(sorted.length * 0.25)]
      const q3 = sorted[Math.floor(sorted.length * 0.75)]
      const iqr = q3 - q1
      priceAnomalyThreshold = {
        low: Math.max(0, q1 - 1.5 * iqr),
        high: q3 + 1.5 * iqr,
      }
    }

    const preferences: UserPreferences = {
      pricesByCategory: priceStatsByCategory,
      avgHourlyRate,
      commonFormulations,
      preferredVatRates,
      totalQuotes: quotes.length,
      totalItems,
      priceAnomalyThreshold,
    }

    return NextResponse.json(preferences)

  } catch (error) {
    console.error('❌ Erreur préférences utilisateur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse des préférences' },
      { status: 500 }
    )
  }
}

// ===========================================
// API Route Handler - POST (Get price hint for specific item)
// ===========================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Parser et valider l'entrée
    const body = await request.json()
    const { itemDescription, trade } = body

    if (!itemDescription || itemDescription.length < 5) {
      return NextResponse.json(
        { error: 'Description trop courte' },
        { status: 400 }
      )
    }

    // Catégoriser la description
    const category = categorizeDescription(itemDescription)

    // Récupérer les items similaires de l'utilisateur
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select(`
        id,
        quote_items (
          description,
          quantity,
          unit_price_ht
        )
      `)
      .eq('user_id', user.id)
      .in('status', ['sent', 'accepted', 'paid'])
      .order('created_at', { ascending: false })
      .limit(50)

    if (quotesError) {
      throw new Error('Erreur lors de la récupération des devis')
    }

    // Chercher des items similaires
    const similarItems: { description: string, price: number }[] = []
    const searchTerms = itemDescription.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3)

    for (const quote of quotes || []) {
      for (const item of quote.quote_items || []) {
        const itemLower = item.description.toLowerCase()
        const itemCategory = categorizeDescription(item.description)

        // Vérifier si c'est la même catégorie
        if (itemCategory === category) {
          similarItems.push({ description: item.description, price: item.unit_price_ht })
          continue
        }

        // Vérifier les termes communs
        const matchCount = searchTerms.filter((term: string) => itemLower.includes(term)).length
        if (matchCount >= 2 || (searchTerms.length === 1 && matchCount === 1)) {
          similarItems.push({ description: item.description, price: item.unit_price_ht })
        }
      }
    }

    if (similarItems.length === 0) {
      return NextResponse.json({
        message: null,
        suggestedPrice: null,
        confidence: 'low',
        basedOn: 0,
      } as PriceHint)
    }

    // Calculer le prix suggéré
    const prices = similarItems.map(i => i.price)
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 100) / 100
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)

    // Déterminer la confiance
    let confidence: 'high' | 'medium' | 'low' = 'low'
    if (similarItems.length >= 5) {
      confidence = 'high'
    } else if (similarItems.length >= 2) {
      confidence = 'medium'
    }

    // Construire le message
    let message: string
    if (similarItems.length >= 3) {
      message = `Vous facturez habituellement ${avgPrice.toFixed(2)}€ HT pour ce type de prestation (min: ${minPrice.toFixed(2)}€, max: ${maxPrice.toFixed(2)}€)`
    } else if (similarItems.length >= 1) {
      message = `Prix similaire dans vos devis précédents: ${avgPrice.toFixed(2)}€ HT`
    } else {
      message = `Aucun historique trouvé pour ce type de prestation`
    }

    const hint: PriceHint = {
      message,
      suggestedPrice: avgPrice,
      confidence,
      basedOn: similarItems.length,
    }

    return NextResponse.json(hint)

  } catch (error) {
    console.error('❌ Erreur suggestion prix:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse' },
      { status: 500 }
    )
  }
}
