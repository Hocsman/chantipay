'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Send, Loader2, CheckCircle, AlertCircle, Mail, MessageSquare, Clock, Sparkles } from 'lucide-react'
import { useAntiBot, HoneypotField } from '@/hooks/useAntiBot'
import { cn } from '@/lib/utils'

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<'success' | 'error' | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  // Anti-bot protection
  const { honeypot, setHoneypot, formLoadedAt } = useAntiBot()

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Anti-bot: honeypot check
    if (honeypot) {
      // Silently pretend success for bots
      setResult('success')
      return
    }

    // Anti-bot: time check (submitted too fast = bot)
    if (Date.now() - formLoadedAt < 3000) {
      setErrorMessage('Veuillez patienter quelques secondes avant d\'envoyer.')
      return
    }

    setIsSubmitting(true)
    setResult(null)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, company: honeypot }),
      })

      if (response.ok) {
        setResult('success')
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        const data = await response.json().catch(() => ({}))
        setErrorMessage(data.error || 'Erreur lors de l\'envoi')
        setResult('error')
      }
    } catch {
      setResult('error')
      setErrorMessage('Erreur de connexion')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Retour</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/favicon.svg"
              alt="ChantiPay"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span className="font-bold text-lg">ChantiPay</span>
          </Link>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative mx-auto max-w-5xl px-6 py-12 md:py-20">
        <div className="grid md:grid-cols-5 gap-12 items-start">
          {/* Left side - Info */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                Support réactif
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Contactez-nous
              </h1>
              <p className="text-lg text-muted-foreground">
                Une question, une suggestion, ou besoin d&apos;aide ? On est là pour vous accompagner.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Réponse rapide</h3>
                  <p className="text-sm text-muted-foreground">
                    Nous répondons généralement sous 24h ouvrées
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Support personnalisé</h3>
                  <p className="text-sm text-muted-foreground">
                    Une vraie personne vous répondra, pas un robot
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Email direct</h3>
                  <p className="text-sm text-muted-foreground">
                    Ou écrivez-nous à{' '}
                    <a href="mailto:contact@chantipay.com" className="text-primary hover:underline">
                      contact@chantipay.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="md:col-span-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 overflow-hidden">
              {result === 'success' ? (
                <div className="p-8 md:p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">Message envoyé !</h2>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setResult(null)}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Envoyer un autre message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                  {/* Honeypot anti-bot field */}
                  <HoneypotField value={honeypot} onChange={setHoneypot} name="company_url" />

                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Envoyez-nous un message</h2>
                    <p className="text-sm text-muted-foreground">
                      Tous les champs sont obligatoires
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 text-sm text-red-600 dark:text-red-400 flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      {errorMessage}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Nom</Label>
                      <Input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        minLength={2}
                        maxLength={100}
                        placeholder="Votre nom"
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <Input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="votre@email.com"
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-medium">Sujet</Label>
                    <Input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      minLength={3}
                      maxLength={120}
                      placeholder="Objet de votre message"
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      minLength={10}
                      maxLength={5000}
                      placeholder="Décrivez votre demande en détail..."
                      rows={6}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {formData.message.length}/5000
                    </p>
                  </div>

                  {result === 'error' && (
                    <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      <p className="text-red-800 dark:text-red-400 text-sm">
                        Erreur lors de l&apos;envoi. Veuillez réessayer.
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className={cn(
                      "w-full h-14 text-base font-semibold gap-2 transition-all duration-300",
                      "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
                      "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                      "hover:-translate-y-0.5"
                    )}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Envoyer le message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
