import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import nodemailer from 'nodemailer'

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
// Email Transporter
// ===========================================
function createTransporter() {
  const host = process.env.SMTP2GO_HOST
  const port = parseInt(process.env.SMTP2GO_PORT || '587', 10)
  const user = process.env.SMTP2GO_USER
  const pass = process.env.SMTP2GO_PASS

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration missing')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  })
}

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

    const textBody = `
Nouveau message de contact ChantiPay
=====================================

De: ${name}
Email: ${email}
Sujet: ${subject}

Message:
${message}

-------------------------------------
Envoyé le: ${timestamp}
IP: ${ip}
    `.trim()

    // Send email
    try {
      const transporter = createTransporter()
      
      await transporter.sendMail({
        from: `ChantiPay <${fromEmail}>`,
        to: toEmail,
        replyTo: email,
        subject: `[ChantiPay] ${subject}`,
        text: textBody,
      })

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
