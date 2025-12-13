import OpenAI from 'openai';

// Initialize OpenAI client lazily
// This should only be used on the server side
let openaiClient: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * System prompt for generating quote line items from job descriptions
 */
export const QUOTE_GENERATION_SYSTEM_PROMPT = `Tu es un assistant spécialisé qui aide les artisans français (plombiers, électriciens, maçons, peintres, etc.) à créer des devis professionnels.

Ta tâche est de convertir une description de travaux en lignes de devis détaillées.

Pour chaque ligne, fournis:
- description: Une description courte et professionnelle en français
- quantity: La quantité (nombre)
- unit_price_ht: Le prix unitaire HT en euros (estimation réaliste du marché français)
- vat_rate: Le taux de TVA applicable (généralement 10% pour travaux rénovation, 20% pour neuf)

Règles:
- Sépare toujours la fourniture de matériaux et la main d'œuvre
- Utilise des descriptions claires et professionnelles
- Les prix doivent être réalistes pour le marché français actuel
- Inclus tous les éléments nécessaires pour réaliser les travaux décrits
- Réponds UNIQUEMENT avec un tableau JSON valide, sans texte additionnel

Format de réponse attendu:
[
  { "description": "...", "quantity": 1, "unit_price_ht": 100, "vat_rate": 10 }
]`;

export type QuoteLineItem = {
  description: string;
  quantity: number;
  unit_price_ht: number;
  vat_rate: number;
};

/**
 * Generate quote line items from a job description using AI
 *
 * If OPENAI_API_KEY is not configured, returns a mocked/placeholder response
 * for development and testing purposes.
 */
export async function generateQuoteItems(
  description: string,
  trade?: string
): Promise<QuoteLineItem[]> {
  // TODO: If no OpenAI API key is set, return mock data for development
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY not configured - returning mock quote items');
    return generateMockQuoteItems(description, trade);
  }

  const userPrompt = trade
    ? `Métier: ${trade}\n\nDescription des travaux:\n${description}`
    : `Description des travaux:\n${description}`;

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: QUOTE_GENERATION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    try {
      const items = JSON.parse(content) as QuoteLineItem[];
      return items;
    } catch {
      // Try to extract JSON from the response if it contains extra text
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as QuoteLineItem[];
      }
      throw new Error('Failed to parse AI response as JSON');
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    // Fallback to mock data on API error
    console.warn('⚠️  OpenAI API error - falling back to mock quote items');
    return generateMockQuoteItems(description, trade);
  }
}

/**
 * Generate mock quote items for development/testing
 * This is used when OPENAI_API_KEY is not configured
 */
function generateMockQuoteItems(description: string, trade?: string): QuoteLineItem[] {
  // TODO: This is placeholder data for development
  // In production, ensure OPENAI_API_KEY is properly configured

  const tradePrefix = trade ? `${trade} - ` : '';

  return [
    {
      description: `${tradePrefix}Fourniture de matériaux`,
      quantity: 1,
      unit_price_ht: 150.00,
      vat_rate: 20,
    },
    {
      description: `${tradePrefix}Main d'œuvre - ${description.substring(0, 50)}`,
      quantity: 4,
      unit_price_ht: 45.00,
      vat_rate: 10,
    },
    {
      description: 'Déplacement et mise en service',
      quantity: 1,
      unit_price_ht: 50.00,
      vat_rate: 20,
    },
  ];
}
