import { SupabaseClient } from '@supabase/supabase-js'

export type NotificationType =
  | 'quote_signed'
  | 'payment_received'
  | 'invoice_overdue'
  | 'reminder_sent'
  | 'invoice_created'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message?: string
  relatedType?: 'quote' | 'invoice'
  relatedId?: string
}

/**
 * Crée une notification in-app pour un utilisateur.
 * Utilisable depuis n'importe quelle route API.
 */
export async function createNotification(
  supabase: SupabaseClient,
  params: CreateNotificationParams
) {
  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message || null,
    related_type: params.relatedType || null,
    related_id: params.relatedId || null,
  })

  if (error) {
    console.error('Erreur création notification:', error)
  }
}
