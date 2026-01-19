export type QuoteAgentType = 'auto' | 'quick' | 'advice' | 'compliance' | 'upsell'

export const QUOTE_AGENT_OPTIONS: Array<{
  value: QuoteAgentType
  label: string
  description: string
}> = [
  {
    value: 'auto',
    label: 'Auto (orchestrateur)',
    description: 'Analyse la demande et choisit le meilleur agent.',
  },
  {
    value: 'quick',
    label: 'Devis rapide',
    description: 'Génération standard optimisée pour la vitesse.',
  },
  {
    value: 'advice',
    label: 'Conseil technique',
    description: 'Ajoute des recommandations et une ligne d\'étude si pertinent.',
  },
  {
    value: 'compliance',
    label: 'Conformité & réglementation',
    description: 'Inclut des contrôles et vérifications normatives.',
  },
  {
    value: 'upsell',
    label: 'Upsell',
    description: 'Propose des services additionnels optionnels.',
  },
]

export const QUOTE_AGENT_LABELS: Record<QuoteAgentType, string> = {
  auto: 'Auto (orchestrateur)',
  quick: 'Devis rapide',
  advice: 'Conseil technique',
  compliance: 'Conformité & réglementation',
  upsell: 'Upsell',
}

export function getAgentLabel(agent: QuoteAgentType): string {
  return QUOTE_AGENT_LABELS[agent]
}
