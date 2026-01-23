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
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-orange-500/30">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-600/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium">Retour</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-8 w-8 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]">
              <Image
                src="/favicon.svg"
                alt="ChantiPay"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>
            <span className="font-bold text-lg text-white group-hover:text-orange-500 transition-colors">ChantiPay</span>
          </Link>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative mx-auto max-w-5xl px-6 py-12 md:py-20 z-10">
        <div className="grid md:grid-cols-5 gap-12 items-start">
          {/* Left side - Info */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                Support réactif 7j/7
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
                Contactez-nous
              </h1>
              <p className="text-lg text-gray-400 leading-relaxed">
                Une question sur Factur-X ? Besoin d'une démo personnalisée ? Notre équipe d'experts est là pour vous accompagner.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Réponse rapide</h3>
                  <p className="text-sm text-gray-400">
                    Nous répondons généralement sous quelques heures
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Support humain</h3>
                  <p className="text-sm text-gray-400">
                    Une vraie personne basée en France vous répondra
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0 text-orange-400">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Email direct</h3>
                  <p className="text-sm text-gray-400">
                    Ou écrivez-nous à{' '}
                    <a href="mailto:contact@chantipay.com" className="text-orange-400 hover:text-orange-300 hover:underline transition-colors">
                      contact@chantipay.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="md:col-span-3">
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              {result === 'success' ? (
                <div className="p-8 md:p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3 text-white">Message envoyé !</h2>
                  <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                    Merci pour votre message. Nous vous répondrons dans les plus brefs délais directement par email.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setResult(null)}
                    className="gap-2 border-white/10 hover:bg-white/5 text-white"
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
                    <h2 className="text-xl font-semibold text-white">Envoyez-nous un message</h2>
                    <p className="text-sm text-gray-400">
                      Tous les champs sont obligatoires
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      {errorMessage}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-300">Nom</Label>
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
                        className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-orange-500 focus:ring-orange-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-300">Email</Label>
                      <Input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="votre@email.com"
                        className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-orange-500 focus:ring-orange-500/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-medium text-gray-300">Sujet</Label>
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
                      className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-orange-500 focus:ring-orange-500/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium text-gray-300">Message</Label>
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
                      className="resize-none bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-orange-500 focus:ring-orange-500/20"
                    />
                    <p className="text-xs text-gray-500 text-right">
                      {formData.message.length}/5000
                    </p>
                  </div>

                  {result === 'error' && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <p className="text-red-400 text-sm">
                        Erreur lors de l&apos;envoi. Veuillez réessayer.
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className={cn(
                      "w-full h-14 text-base font-bold gap-2 transition-all duration-300",
                      "bg-orange-600 hover:bg-orange-500 text-white",
                      "shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)]",
                      "hover:-translate-y-0.5 border-0"
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
