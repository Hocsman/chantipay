import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'

// Initialisation lazy de Resend
let resend: Resend | null = null
function getResend() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

// ===========================================
// Rate Limiting (Best-effort in-memory)
// ===========================================
// TODO: For production at scale, use Upstash Redis or similar
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 5 // 5 requests per window

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 }
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }

  record.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count }
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip)
    }
  }
}, 60 * 1000) // Every minute

// ===========================================
// Input Validation Schema
// ===========================================
const contactSchema = z.object({
  name: z.string().min(2, 'Nom trop court').max(100, 'Nom trop long'),
  email: z.string().email('Email invalide'),
  subject: z.string().min(3, 'Sujet trop court').max(120, 'Sujet trop long'),
  message: z.string().min(10, 'Message trop court').max(5000, 'Message trop long'),
  company: z.string().optional(), // honeypot
})

// ===========================================
// API Route Handler
// ===========================================
export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Check rate limit
    const { allowed, remaining } = checkRateLimit(ip)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez patienter quelques minutes.' },
        { 
          status: 429,
          headers: { 'X-RateLimit-Remaining': '0' }
        }
      )
    }

    // Parse and validate input
    const body = await request.json()
    const validationResult = contactSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.issues.map(e => e.message).join(', ')
      return NextResponse.json(
        { error: errors },
        { status: 400 }
      )
    }

    const { name, email, subject, message, company } = validationResult.data

    // Honeypot check - if company field is filled, it's likely a bot
    // Return success to not reveal the trap, but don't send email
    if (company && company.trim().length > 0) {
      console.log('🍯 Honeypot triggered - not sending email')
      return NextResponse.json(
        { ok: true },
        { headers: { 'X-RateLimit-Remaining': remaining.toString() } }
      )
    }

    // Get email configuration
    const toEmail = process.env.CONTACT_TO_EMAIL || 'contact@chantipay.com'
    const fromEmail = process.env.CONTACT_FROM_EMAIL || 'contact@chantipay.com'

    // Build email content
    const timestamp = new Date().toLocaleString('fr-FR', {
      timeZone: 'Europe/Paris',
      dateStyle: 'full',
      timeStyle: 'short',
    })

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563EB 0%, #4F46E5 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📬 Nouveau message</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2563EB;">
            <p style="margin: 0 0 10px 0;"><strong>De:</strong> ${name}</p>
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p style="margin: 0;"><strong>Sujet:</strong> ${subject}</p>
          </div>
          <h3 style="color: #374151; margin-bottom: 15px;">Message :</h3>
          <p style="color: #6B7280; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 25px 0;">
          <p style="font-size: 12px; color: #9CA3AF;">Envoyé le ${timestamp} depuis l'IP ${ip}</p>
        </div>
      </div>
    `

    // Send email via Resend
    try {
      const resendClient = getResend()
      
      if (!resendClient) {
        console.error('❌ RESEND_API_KEY non configurée')
        return NextResponse.json(
          { error: 'Service d\'email non configuré' },
          { status: 503 }
        )
      }

      const { error: sendError } = await resendClient.emails.send({
        from: 'ChantiPay Contact <contact@chantipay.com>',
        to: toEmail,
        replyTo: email,
        subject: `[ChantiPay] ${subject}`,
        html: htmlBody,
      })

      if (sendError) {
        throw sendError
      }

      console.log(`✅ Contact email sent from ${email}`)
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi du message' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { ok: true },
      { headers: { 'X-RateLimit-Remaining': remaining.toString() } }
    )

  } catch (error) {
    console.error('❌ Contact API error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
