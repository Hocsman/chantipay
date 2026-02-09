/**
 * Exemples d'utilisation des fonctionnalités Redis
 * 
 * Ce fichier montre comment utiliser les verrous, queues et compteurs
 * dans vos API routes ChantiPay.
 */

import {
  // Verrous distribués
  acquireLock,
  withLock,
  
  // Compteurs & Analytics
  incrementCounter,
  incrementDailyCounter,
  getUserDailyStats,
  
  // File d'attente
  enqueue,
  dequeue,
  QUEUES,
  
  // Idempotency
  withIdempotency,
  
  // Stats
  getRedisStats,
} from './redis'

// ===========================================
// 🔒 EXEMPLE 1: Verrou pour création de devis
// ===========================================

interface CreateQuoteParams {
  userId: string
  clientId: string
  items: Array<{ description: string; price: number }>
}

export async function createQuoteWithLock(params: CreateQuoteParams) {
  // Empêche l'utilisateur de créer 2 devis en même temps
  // (protection contre le double-clic)
  const result = await withLock(
    `create-quote:${params.userId}`,
    async () => {
      // Simuler la création du devis
      console.log('Création du devis en cours...')
      
      // Incrémenter les compteurs
      await incrementCounter('quotes:created:total')
      await incrementDailyCounter(params.userId, 'quotes')
      
      // Retourner le devis créé
      return {
        id: `quote_${Date.now()}`,
        ...params,
        createdAt: new Date().toISOString()
      }
    },
    30 // Verrou de 30 secondes max
  )
  
  if (!result.success) {
    throw new Error(result.error)
  }
  
  return result.data
}

// ===========================================
// 📋 EXEMPLE 2: Queue pour génération PDF
// ===========================================

interface PDFJobData {
  type: 'quote' | 'invoice'
  documentId: string
  userId: string
  email?: string // Si fourni, envoi par email après génération
}

export async function queuePDFGeneration(data: PDFJobData): Promise<string> {
  // Ajouter à la file d'attente
  const jobId = await enqueue<PDFJobData>(QUEUES.PDF_GENERATION, data)
  
  console.log(`[PDF Queue] Job ${jobId} ajouté pour ${data.type} ${data.documentId}`)
  
  return jobId
}

// Worker qui traite la queue (à appeler via CRON ou Vercel Functions)
export async function processPDFQueue(): Promise<number> {
  let processed = 0
  
  // Traiter jusqu'à 10 jobs par exécution
  for (let i = 0; i < 10; i++) {
    const job = await dequeue<PDFJobData>(QUEUES.PDF_GENERATION)
    if (!job) break
    
    try {
      console.log(`[PDF Worker] Traitement job ${job.id}...`)
      
      // Générer le PDF (votre logique ici)
      // await generatePDF(job.data.type, job.data.documentId)
      
      // Si email demandé, l'ajouter à la queue email
      if (job.data.email) {
        await enqueue(QUEUES.EMAIL_SEND, {
          to: job.data.email,
          template: 'pdf-ready',
          data: job.data
        })
      }
      
      await incrementCounter('pdfs:generated:total')
      processed++
      
    } catch (error) {
      console.error(`[PDF Worker] Erreur job ${job.id}:`, error)
      // Re-enqueue pour retry ? Ou dead-letter queue ?
    }
  }
  
  return processed
}

// ===========================================
// 📊 EXEMPLE 3: Vérifier les quotas utilisateur
// ===========================================

interface UserQuotas {
  aiCalls: { used: number; limit: number }
  quotes: { used: number; limit: number }
  invoices: { used: number; limit: number }
}

export async function checkUserQuotas(
  userId: string,
  plan: 'free' | 'pro' | 'enterprise'
): Promise<UserQuotas> {
  // Limites selon le plan
  const limits = {
    free: { aiCalls: 10, quotes: 5, invoices: 3 },
    pro: { aiCalls: 100, quotes: 50, invoices: 50 },
    enterprise: { aiCalls: 1000, quotes: 500, invoices: 500 }
  }
  
  const planLimits = limits[plan]
  
  // Récupérer les stats du jour
  const stats = await getUserDailyStats(userId, ['ai-calls', 'quotes', 'invoices'])
  
  return {
    aiCalls: { used: stats['ai-calls'], limit: planLimits.aiCalls },
    quotes: { used: stats['quotes'], limit: planLimits.quotes },
    invoices: { used: stats['invoices'], limit: planLimits.invoices }
  }
}

export async function canMakeAICall(userId: string, plan: 'free' | 'pro' | 'enterprise'): Promise<boolean> {
  const quotas = await checkUserQuotas(userId, plan)
  return quotas.aiCalls.used < quotas.aiCalls.limit
}

// ===========================================
// 🔄 EXEMPLE 4: Requête idempotente
// ===========================================

interface PaymentRequest {
  invoiceId: string
  amount: number
  paymentMethod: string
}

export async function processPayment(request: PaymentRequest, idempotencyKey: string) {
  // Si ce paiement a déjà été traité avec cette clé, retourne le résultat précédent
  // (protection contre les doubles paiements)
  return withIdempotency(
    `payment:${idempotencyKey}`,
    async () => {
      console.log(`Traitement paiement ${request.invoiceId}...`)
      
      // Votre logique de paiement ici
      // const result = await stripeClient.charge(...)
      
      return {
        success: true,
        transactionId: `txn_${Date.now()}`,
        amount: request.amount,
        processedAt: new Date().toISOString()
      }
    },
    3600 // Garder le résultat 1 heure
  )
}

// ===========================================
// 📈 EXEMPLE 5: Dashboard admin
// ===========================================

export async function getAdminDashboard() {
  const stats = await getRedisStats()
  
  return {
    redis: {
      connected: stats.connected,
      message: stats.connected 
        ? 'Redis connecté et fonctionnel' 
        : 'Mode fallback mémoire (dev)'
    },
    queues: {
      pdfPending: stats.queues[QUEUES.PDF_GENERATION] || 0,
      emailsPending: stats.queues[QUEUES.EMAIL_SEND] || 0,
      remindersPending: (stats.queues[QUEUES.QUOTE_REMINDER] || 0) + 
                        (stats.queues[QUEUES.INVOICE_REMINDER] || 0)
    },
    totals: {
      quotesCreated: stats.counters['quotes:created:total'] || 0,
      invoicesCreated: stats.counters['invoices:created:total'] || 0,
      aiCalls: stats.counters['ai:calls:total'] || 0,
      emailsSent: stats.counters['emails:sent:total'] || 0
    }
  }
}
