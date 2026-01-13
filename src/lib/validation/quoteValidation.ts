/**
 * ===========================================
 * Quote Validation Module
 * ===========================================
 * Validation rules and helpers for quote creation
 */

export const VALIDATION_RULES = {
  QUANTITY: {
    MIN: 0.01,
    MAX: 10000,
  },
  PRICE: {
    MIN: 0.01,
    MAX: 999999.99,
  },
  VAT_RATES: [0, 5.5, 10, 20] as const,
  DEPOSIT_PERCENT: {
    MIN: 0,
    MAX: 100,
  },
  DESCRIPTION: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 500,
  },
} as const

export type ValidVatRate = typeof VALIDATION_RULES.VAT_RATES[number]

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface QuoteItemValidation {
  description: string
  quantity: number
  unit_price_ht: number
  vat_rate: number
}

/**
 * Valide un taux de TVA
 */
export function isValidVatRate(rate: number): rate is ValidVatRate {
  return VALIDATION_RULES.VAT_RATES.includes(rate as ValidVatRate)
}

/**
 * Trouve le taux de TVA valide le plus proche
 */
export function getClosestValidVatRate(rate: number): ValidVatRate {
  return VALIDATION_RULES.VAT_RATES.reduce((prev, curr) =>
    Math.abs(curr - rate) < Math.abs(prev - rate) ? curr : prev
  )
}

/**
 * Valide une ligne de devis
 */
export function validateQuoteItem(item: QuoteItemValidation): ValidationResult {
  const errors: string[] = []

  // Validation description
  const trimmedDesc = item.description.trim()
  if (trimmedDesc.length < VALIDATION_RULES.DESCRIPTION.MIN_LENGTH) {
    errors.push(
      `Description trop courte (min ${VALIDATION_RULES.DESCRIPTION.MIN_LENGTH} caractères)`
    )
  }
  if (trimmedDesc.length > VALIDATION_RULES.DESCRIPTION.MAX_LENGTH) {
    errors.push(
      `Description trop longue (max ${VALIDATION_RULES.DESCRIPTION.MAX_LENGTH} caractères)`
    )
  }

  // Validation quantité
  if (isNaN(item.quantity) || !isFinite(item.quantity)) {
    errors.push('Quantité invalide')
  } else if (item.quantity < VALIDATION_RULES.QUANTITY.MIN) {
    errors.push(
      `Quantité trop faible (min ${VALIDATION_RULES.QUANTITY.MIN})`
    )
  } else if (item.quantity > VALIDATION_RULES.QUANTITY.MAX) {
    errors.push(
      `Quantité trop élevée (max ${VALIDATION_RULES.QUANTITY.MAX.toLocaleString('fr-FR')})`
    )
  }

  // Validation prix
  if (isNaN(item.unit_price_ht) || !isFinite(item.unit_price_ht)) {
    errors.push('Prix invalide')
  } else if (item.unit_price_ht < VALIDATION_RULES.PRICE.MIN) {
    errors.push(
      `Prix trop faible (min ${VALIDATION_RULES.PRICE.MIN.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })})`
    )
  } else if (item.unit_price_ht > VALIDATION_RULES.PRICE.MAX) {
    errors.push(
      `Prix trop élevé (max ${VALIDATION_RULES.PRICE.MAX.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })})`
    )
  }

  // Validation TVA
  if (!isValidVatRate(item.vat_rate)) {
    errors.push(
      `Taux de TVA invalide. Taux acceptés: ${VALIDATION_RULES.VAT_RATES.join('%, ')}%`
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Valide plusieurs lignes de devis
 */
export function validateQuoteItems(
  items: QuoteItemValidation[]
): ValidationResult {
  const errors: string[] = []

  if (items.length === 0) {
    errors.push('Au moins une ligne est requise')
    return { isValid: false, errors }
  }

  items.forEach((item, index) => {
    const result = validateQuoteItem(item)
    if (!result.isValid) {
      errors.push(`Ligne ${index + 1}: ${result.errors.join(', ')}`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Valide un pourcentage d'acompte
 */
export function validateDepositPercent(percent: number): ValidationResult {
  const errors: string[] = []

  if (isNaN(percent) || !isFinite(percent)) {
    errors.push('Pourcentage d\'acompte invalide')
  } else if (percent < VALIDATION_RULES.DEPOSIT_PERCENT.MIN) {
    errors.push(`Acompte minimum: ${VALIDATION_RULES.DEPOSIT_PERCENT.MIN}%`)
  } else if (percent > VALIDATION_RULES.DEPOSIT_PERCENT.MAX) {
    errors.push(`Acompte maximum: ${VALIDATION_RULES.DEPOSIT_PERCENT.MAX}%`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Nettoie et corrige automatiquement une ligne de devis
 */
export function sanitizeQuoteItem(
  item: QuoteItemValidation
): QuoteItemValidation {
  return {
    description: item.description.trim().slice(0, VALIDATION_RULES.DESCRIPTION.MAX_LENGTH),
    quantity: Math.min(
      Math.max(Number(item.quantity) || VALIDATION_RULES.QUANTITY.MIN, VALIDATION_RULES.QUANTITY.MIN),
      VALIDATION_RULES.QUANTITY.MAX
    ),
    unit_price_ht: Math.min(
      Math.max(Number(item.unit_price_ht) || VALIDATION_RULES.PRICE.MIN, VALIDATION_RULES.PRICE.MIN),
      VALIDATION_RULES.PRICE.MAX
    ),
    vat_rate: isValidVatRate(item.vat_rate)
      ? item.vat_rate
      : getClosestValidVatRate(item.vat_rate),
  }
}
