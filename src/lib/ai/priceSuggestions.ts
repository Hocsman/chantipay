/**
 * Service de suggestions de prix IA
 * Fournit des estimations de prix basées sur le marché pour les lignes de devis
 */

export interface PriceSuggestion {
  minPrice: number
  maxPrice: number
  avgPrice: number
  confidence: 'high' | 'medium' | 'low'
  warning?: 'too_low' | 'too_high' | null
}

export interface PriceAnalysis {
  suggestion: PriceSuggestion
  message: string
  isPriceAberrant: boolean
}

/**
 * Base de données de prix moyens par type de prestation
 * Ces prix sont indicatifs et basés sur le marché français des artisans
 */
const PRICE_DATABASE: Record<string, PriceSuggestion> = {
  // PLOMBERIE
  'fuite': { minPrice: 80, maxPrice: 150, avgPrice: 115, confidence: 'high', warning: null },
  'reparation fuite': { minPrice: 80, maxPrice: 150, avgPrice: 115, confidence: 'high', warning: null },
  'wc': { minPrice: 200, maxPrice: 400, avgPrice: 300, confidence: 'high', warning: null },
  'toilette': { minPrice: 200, maxPrice: 400, avgPrice: 300, confidence: 'high', warning: null },
  'lavabo': { minPrice: 150, maxPrice: 350, avgPrice: 250, confidence: 'high', warning: null },
  'douche': { minPrice: 800, maxPrice: 2500, avgPrice: 1500, confidence: 'medium', warning: null },
  'baignoire': { minPrice: 600, maxPrice: 2000, avgPrice: 1200, confidence: 'medium', warning: null },
  'chaudiere': { minPrice: 2000, maxPrice: 5000, avgPrice: 3500, confidence: 'high', warning: null },
  'chauffe-eau': { minPrice: 400, maxPrice: 1200, avgPrice: 800, confidence: 'high', warning: null },
  'ballon eau chaude': { minPrice: 400, maxPrice: 1200, avgPrice: 800, confidence: 'high', warning: null },
  'robinet': { minPrice: 50, maxPrice: 200, avgPrice: 120, confidence: 'high', warning: null },
  'mitigeur': { minPrice: 80, maxPrice: 250, avgPrice: 150, confidence: 'high', warning: null },
  'siphon': { minPrice: 40, maxPrice: 100, avgPrice: 70, confidence: 'high', warning: null },
  'tuyauterie': { minPrice: 100, maxPrice: 400, avgPrice: 250, confidence: 'medium', warning: null },
  'debouchage': { minPrice: 100, maxPrice: 300, avgPrice: 180, confidence: 'high', warning: null },

  // ÉLECTRICITÉ
  'tableau electrique': { minPrice: 800, maxPrice: 2000, avgPrice: 1400, confidence: 'high', warning: null },
  'disjoncteur': { minPrice: 30, maxPrice: 150, avgPrice: 80, confidence: 'high', warning: null },
  'differentiel': { minPrice: 40, maxPrice: 200, avgPrice: 100, confidence: 'high', warning: null },
  'prise electrique': { minPrice: 30, maxPrice: 80, avgPrice: 50, confidence: 'high', warning: null },
  'interrupteur': { minPrice: 25, maxPrice: 70, avgPrice: 45, confidence: 'high', warning: null },
  'point lumineux': { minPrice: 50, maxPrice: 150, avgPrice: 90, confidence: 'high', warning: null },
  'spot encastre': { minPrice: 40, maxPrice: 100, avgPrice: 65, confidence: 'high', warning: null },
  'applique': { minPrice: 60, maxPrice: 200, avgPrice: 120, confidence: 'medium', warning: null },
  'volet roulant electrique': { minPrice: 300, maxPrice: 800, avgPrice: 500, confidence: 'high', warning: null },
  'mise aux normes': { minPrice: 1000, maxPrice: 3000, avgPrice: 2000, confidence: 'medium', warning: null },
  'eclairage led': { minPrice: 40, maxPrice: 150, avgPrice: 80, confidence: 'high', warning: null },

  // PEINTURE
  'peinture mur': { minPrice: 20, maxPrice: 50, avgPrice: 30, confidence: 'high', warning: null },
  'peinture plafond': { minPrice: 25, maxPrice: 60, avgPrice: 40, confidence: 'high', warning: null },
  'peinture facade': { minPrice: 30, maxPrice: 80, avgPrice: 50, confidence: 'medium', warning: null },
  'peinture piece': { minPrice: 300, maxPrice: 800, avgPrice: 500, confidence: 'medium', warning: null },
  'peinture volet': { minPrice: 40, maxPrice: 120, avgPrice: 75, confidence: 'high', warning: null },
  'ravalement': { minPrice: 40, maxPrice: 100, avgPrice: 65, confidence: 'medium', warning: null },
  'enduit': { minPrice: 15, maxPrice: 40, avgPrice: 25, confidence: 'high', warning: null },
  'ponçage': { minPrice: 10, maxPrice: 30, avgPrice: 18, confidence: 'high', warning: null },

  // MENUISERIE
  'porte interieure': { minPrice: 200, maxPrice: 600, avgPrice: 400, confidence: 'high', warning: null },
  'porte entree': { minPrice: 800, maxPrice: 2500, avgPrice: 1500, confidence: 'medium', warning: null },
  'fenetre pvc': { minPrice: 300, maxPrice: 800, avgPrice: 500, confidence: 'high', warning: null },
  'fenetre bois': { minPrice: 400, maxPrice: 1200, avgPrice: 750, confidence: 'medium', warning: null },
  'parquet flottant': { minPrice: 25, maxPrice: 60, avgPrice: 40, confidence: 'high', warning: null },
  'parquet massif': { minPrice: 50, maxPrice: 120, avgPrice: 80, confidence: 'medium', warning: null },
  'placard': { minPrice: 400, maxPrice: 1500, avgPrice: 900, confidence: 'medium', warning: null },
  'escalier': { minPrice: 2000, maxPrice: 6000, avgPrice: 4000, confidence: 'low', warning: null },
  'terrasse bois': { minPrice: 80, maxPrice: 200, avgPrice: 130, confidence: 'medium', warning: null },

  // GÉNÉRAL
  'main oeuvre': { minPrice: 35, maxPrice: 65, avgPrice: 45, confidence: 'high', warning: null },
  'deplacement': { minPrice: 30, maxPrice: 80, avgPrice: 50, confidence: 'high', warning: null },
  'forfait': { minPrice: 100, maxPrice: 500, avgPrice: 250, confidence: 'low', warning: null },
}

/**
 * Détecte les mots-clés dans une description pour trouver le type de prestation
 */
function detectKeywords(description: string): string[] {
  const normalizedDesc = description.toLowerCase()
  const keywords: string[] = []

  for (const key of Object.keys(PRICE_DATABASE)) {
    if (normalizedDesc.includes(key)) {
      keywords.push(key)
    }
  }

  // Trier par longueur décroissante pour privilégier les matches les plus spécifiques
  return keywords.sort((a, b) => b.length - a.length)
}

/**
 * Obtenir une suggestion de prix pour une ligne de devis
 */
export function getPriceSuggestion(description: string, quantity: number = 1): PriceSuggestion | null {
  const keywords = detectKeywords(description)

  if (keywords.length === 0) {
    // Pas de correspondance trouvée, retourner une suggestion générique
    return {
      minPrice: 50,
      maxPrice: 500,
      avgPrice: 200,
      confidence: 'low',
      warning: null,
    }
  }

  // Utiliser le premier keyword (le plus spécifique)
  const suggestion = PRICE_DATABASE[keywords[0]]

  if (!suggestion) return null

  // Ajuster les prix selon la quantité
  return {
    minPrice: suggestion.minPrice * quantity,
    maxPrice: suggestion.maxPrice * quantity,
    avgPrice: suggestion.avgPrice * quantity,
    confidence: suggestion.confidence,
    warning: suggestion.warning,
  }
}

/**
 * Analyser un prix par rapport aux suggestions
 */
export function analyzePriceWithSuggestion(
  description: string,
  currentPrice: number,
  quantity: number = 1
): PriceAnalysis {
  const suggestion = getPriceSuggestion(description, quantity)

  if (!suggestion) {
    return {
      suggestion: {
        minPrice: 0,
        maxPrice: 0,
        avgPrice: 0,
        confidence: 'low',
        warning: null,
      },
      message: 'Aucune suggestion disponible pour ce type de prestation',
      isPriceAberrant: false,
    }
  }

  let warning: 'too_low' | 'too_high' | null = null
  let message = ''
  let isPriceAberrant = false

  const pricePerUnit = quantity > 0 ? currentPrice / quantity : currentPrice

  // Prix unitaire trop bas (< 70% du minimum)
  if (pricePerUnit < suggestion.minPrice * 0.7) {
    warning = 'too_low'
    message = `⚠️ Prix potentiellement trop bas. Prix marché: ${suggestion.minPrice.toFixed(0)}-${suggestion.maxPrice.toFixed(0)} €`
    isPriceAberrant = true
  }
  // Prix unitaire trop élevé (> 150% du maximum)
  else if (pricePerUnit > suggestion.maxPrice * 1.5) {
    warning = 'too_high'
    message = `⚠️ Prix potentiellement trop élevé. Prix marché: ${suggestion.minPrice.toFixed(0)}-${suggestion.maxPrice.toFixed(0)} €`
    isPriceAberrant = true
  }
  // Prix dans la fourchette basse
  else if (pricePerUnit < suggestion.avgPrice * 0.85) {
    message = `💡 Prix dans la fourchette basse du marché (${suggestion.minPrice.toFixed(0)}-${suggestion.maxPrice.toFixed(0)} €)`
  }
  // Prix dans la fourchette haute
  else if (pricePerUnit > suggestion.avgPrice * 1.15) {
    message = `💡 Prix dans la fourchette haute du marché (${suggestion.minPrice.toFixed(0)}-${suggestion.maxPrice.toFixed(0)} €)`
  }
  // Prix dans la moyenne
  else {
    message = `✅ Prix conforme au marché (${suggestion.minPrice.toFixed(0)}-${suggestion.maxPrice.toFixed(0)} €)`
  }

  return {
    suggestion: {
      ...suggestion,
      warning,
    },
    message,
    isPriceAberrant,
  }
}

/**
 * Formater une fourchette de prix pour l'affichage
 */
export function formatPriceRange(suggestion: PriceSuggestion): string {
  return `${suggestion.minPrice.toFixed(0)}-${suggestion.maxPrice.toFixed(0)} €`
}

/**
 * Obtenir le badge de confiance
 */
export function getConfidenceBadge(confidence: PriceSuggestion['confidence']): {
  label: string
  color: string
} {
  switch (confidence) {
    case 'high':
      return { label: 'Confiance élevée', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
    case 'medium':
      return { label: 'Confiance moyenne', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' }
    case 'low':
      return { label: 'Confiance faible', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' }
  }
}
