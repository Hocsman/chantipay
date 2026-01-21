export type PricingRegion = 'ile-de-france' | 'province' | 'unknown'
export type PricingSeason = 'high' | 'low' | 'normal'

const IDF_DEPARTMENTS = new Set([
  '75',
  '77',
  '78',
  '91',
  '92',
  '93',
  '94',
  '95',
])

export function normalizeRegion(region?: string): PricingRegion {
  const normalized = (region || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (!normalized) return 'unknown'
  if (['idf', 'ile-de-france', 'paris'].includes(normalized)) {
    return 'ile-de-france'
  }
  if (['province', 'hors-idf', 'hors idf'].includes(normalized)) {
    return 'province'
  }
  return 'unknown'
}

export function normalizeSeason(season?: string): PricingSeason {
  const normalized = (season || '').trim().toLowerCase()
  if (normalized === 'high' || normalized === 'haute') return 'high'
  if (normalized === 'low' || normalized === 'basse') return 'low'
  if (normalized === 'normal') return 'normal'
  return 'normal'
}

export function inferRegionFromPostalCode(postalCode?: string | null): PricingRegion {
  if (!postalCode) return 'unknown'
  const cleaned = postalCode.toString().trim()
  if (cleaned.length < 2) return 'unknown'
  const department = cleaned.slice(0, 2)
  if (IDF_DEPARTMENTS.has(department)) return 'ile-de-france'
  return 'province'
}

export function inferSeasonFromDate(date: Date = new Date()): PricingSeason {
  const month = date.getMonth() + 1
  if (month >= 6 && month <= 8) return 'high'
  if (month === 1 || month === 2) return 'low'
  return 'normal'
}

export function getPricingMultiplier(region: PricingRegion, season: PricingSeason): number {
  const regionMultiplier = region === 'ile-de-france' ? 1.12 : 1.0
  const seasonMultiplier = season === 'high' ? 1.08 : season === 'low' ? 0.95 : 1.0
  return regionMultiplier * seasonMultiplier
}

export function applyPricingMultiplier(value: number, multiplier: number): number {
  const adjusted = value * multiplier
  const rounded = adjusted >= 20 ? Math.round(adjusted / 5) * 5 : Math.round(adjusted)
  const clamped = Math.min(Math.max(rounded, 1), 100000)
  return clamped
}

export function buildPricingContextLabel(
  region: PricingRegion,
  season: PricingSeason,
  multiplier: number
): string {
  const regionLabel = region === 'ile-de-france' ? 'Ile-de-France' : region === 'province' ? 'Province' : 'non specifiee'
  const seasonLabel = season === 'high' ? 'haute saison' : season === 'low' ? 'basse saison' : 'saison normale'
  const percent = Math.round((multiplier - 1) * 100)
  const adjustment = percent === 0 ? 'ajustement neutre' : `ajustement ~${percent > 0 ? '+' : ''}${percent}%`
  return `Region: ${regionLabel}. Saison: ${seasonLabel}. ${adjustment}.`
}
