'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<'success' | 'error' | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    company: '', // honeypot
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setResult(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setResult('success')
        setFormData({ name: '', email: '', subject: '', message: '', company: '' })
      } else {
        setResult('error')
      }
    } catch {
      setResult('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Retour</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-xl px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3">Contact</h1>
          <p className="text-muted-foreground">
            Une question ? Écrivez-nous, on vous répond rapidement.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Envoyez-nous un message</CardTitle>
            <CardDescription>
              Tous les champs sont obligatoires
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result === 'success' ? (
              <div className="rounded-lg border bg-green-50 border-green-200 p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <p className="font-semibold text-green-800 text-lg">
                  Message envoyé ✅
                </p>
                <p className="text-green-700 text-sm mt-2">
                  Nous vous répondrons dans les plus brefs délais.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setResult(null)}
                >
                  Envoyer un autre message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot field - hidden from users */}
                <div className="hidden" aria-hidden="true">
                  <Label htmlFor="company">Entreprise</Label>
                  <Input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <Label htmlFor="name">Nom</Label>
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
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="votre@email.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Sujet</Label>
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
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    minLength={10}
                    maxLength={5000}
                    placeholder="Votre message..."
                    rows={5}
                    className="mt-1 resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {formData.message.length}/5000
                  </p>
                </div>

                {result === 'error' && (
                  <div className="rounded-lg border bg-red-50 border-red-200 p-4 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-800 text-sm">
                      Erreur lors de l&apos;envoi. Veuillez réessayer.
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer le message
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Additional info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Vous pouvez aussi nous écrire directement à{' '}
            <a
              href="mailto:contact@chantipay.com"
              className="text-primary hover:underline"
            >
              contact@chantipay.com
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
