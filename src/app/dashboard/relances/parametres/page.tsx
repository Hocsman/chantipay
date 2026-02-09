'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LayoutContainer } from '@/components/LayoutContainer'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Receipt,
  Clock,
  Bell,
  AlertTriangle,
  Euro,
} from 'lucide-react'
import { toast } from 'sonner'

interface QuoteSettings {
  enabled: boolean
  firstReminderDays: number
  secondReminderDays: number
  thirdReminderDays: number
  maxReminders: number
  customMessage: string
}

interface InvoiceSettings {
  enabled: boolean
  firstReminderDays: number
  secondReminderDays: number
  thirdReminderDays: number
  maxReminders: number
  customMessage: string
  latePaymentRate: number
  recoveryFee: number
}

export default function RelancesParametresPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [quoteSettings, setQuoteSettings] = useState<QuoteSettings>({
    enabled: true,
    firstReminderDays: 3,
    secondReminderDays: 7,
    thirdReminderDays: 14,
    maxReminders: 3,
    customMessage: '',
  })

  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    enabled: true,
    firstReminderDays: 7,
    secondReminderDays: 14,
    thirdReminderDays: 30,
    maxReminders: 3,
    customMessage: '',
    latePaymentRate: 10.57,
    recoveryFee: 40.0,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const [quoteRes, invoiceRes] = await Promise.all([
        fetch('/api/quotes/reminders/settings'),
        fetch('/api/invoices/reminders/settings'),
      ])

      if (quoteRes.ok) {
        const data = await quoteRes.json()
        setQuoteSettings(data)
      }

      if (invoiceRes.ok) {
        const data = await invoiceRes.json()
        setInvoiceSettings(data)
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error)
      toast.error('Erreur lors du chargement des paramètres')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const [quoteRes, invoiceRes] = await Promise.all([
        fetch('/api/quotes/reminders/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quoteSettings),
        }),
        fetch('/api/invoices/reminders/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(invoiceSettings),
        }),
      ])

      if (quoteRes.ok && invoiceRes.ok) {
        toast.success('Paramètres enregistrés')
      } else {
        const quoteError = !quoteRes.ok ? await quoteRes.json() : null
        const invoiceError = !invoiceRes.ok ? await invoiceRes.json() : null
        toast.error(quoteError?.error || invoiceError?.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <LayoutContainer>
        <PageHeader
          title="Paramètres des relances"
          description="Configurez vos règles de relance"
        />
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Chargement des paramètres...</p>
        </div>
      </LayoutContainer>
    )
  }

  return (
    <LayoutContainer>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/relances"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux relances
        </Link>
      </div>

      <PageHeader
        title="Paramètres des relances"
        description="Configurez vos règles de relance automatique"
        action={
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Paramètres Devis */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle>Relances de devis</CardTitle>
                  <CardDescription>
                    Délais après l'envoi du devis
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={quoteSettings.enabled}
                onCheckedChange={(checked) =>
                  setQuoteSettings({ ...quoteSettings, enabled: checked })
                }
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quote-first" className="text-xs">
                  1ère relance
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="quote-first"
                    type="number"
                    min={1}
                    max={30}
                    value={quoteSettings.firstReminderDays}
                    onChange={(e) =>
                      setQuoteSettings({
                        ...quoteSettings,
                        firstReminderDays: parseInt(e.target.value) || 3,
                      })
                    }
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">jours</span>
                </div>
              </div>
              <div>
                <Label htmlFor="quote-second" className="text-xs">
                  2ème relance
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="quote-second"
                    type="number"
                    min={1}
                    max={60}
                    value={quoteSettings.secondReminderDays}
                    onChange={(e) =>
                      setQuoteSettings({
                        ...quoteSettings,
                        secondReminderDays: parseInt(e.target.value) || 7,
                      })
                    }
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">jours</span>
                </div>
              </div>
              <div>
                <Label htmlFor="quote-third" className="text-xs">
                  3ème relance
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="quote-third"
                    type="number"
                    min={1}
                    max={90}
                    value={quoteSettings.thirdReminderDays}
                    onChange={(e) =>
                      setQuoteSettings({
                        ...quoteSettings,
                        thirdReminderDays: parseInt(e.target.value) || 14,
                      })
                    }
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">jours</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="quote-max" className="text-xs">
                Nombre maximum de relances
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="quote-max"
                  type="number"
                  min={0}
                  max={5}
                  value={quoteSettings.maxReminders}
                  onChange={(e) =>
                    setQuoteSettings({
                      ...quoteSettings,
                      maxReminders: parseInt(e.target.value) || 3,
                    })
                  }
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">relances max</span>
              </div>
            </div>

            <Separator />

            <div>
              <Label htmlFor="quote-message" className="text-xs">
                Message personnalisé (optionnel)
              </Label>
              <Textarea
                id="quote-message"
                placeholder="Message additionnel à inclure dans les emails de relance..."
                value={quoteSettings.customMessage}
                onChange={(e) =>
                  setQuoteSettings({
                    ...quoteSettings,
                    customMessage: e.target.value,
                  })
                }
                rows={3}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Paramètres Factures */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <CardTitle>Relances de factures</CardTitle>
                  <CardDescription>
                    Délais après la date d'échéance
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={invoiceSettings.enabled}
                onCheckedChange={(checked) =>
                  setInvoiceSettings({ ...invoiceSettings, enabled: checked })
                }
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="invoice-first" className="text-xs">
                  1ère relance
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="invoice-first"
                    type="number"
                    min={1}
                    max={30}
                    value={invoiceSettings.firstReminderDays}
                    onChange={(e) =>
                      setInvoiceSettings({
                        ...invoiceSettings,
                        firstReminderDays: parseInt(e.target.value) || 7,
                      })
                    }
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">jours</span>
                </div>
              </div>
              <div>
                <Label htmlFor="invoice-second" className="text-xs">
                  2ème relance
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="invoice-second"
                    type="number"
                    min={1}
                    max={60}
                    value={invoiceSettings.secondReminderDays}
                    onChange={(e) =>
                      setInvoiceSettings({
                        ...invoiceSettings,
                        secondReminderDays: parseInt(e.target.value) || 14,
                      })
                    }
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">jours</span>
                </div>
              </div>
              <div>
                <Label htmlFor="invoice-third" className="text-xs">
                  3ème relance
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="invoice-third"
                    type="number"
                    min={1}
                    max={90}
                    value={invoiceSettings.thirdReminderDays}
                    onChange={(e) =>
                      setInvoiceSettings({
                        ...invoiceSettings,
                        thirdReminderDays: parseInt(e.target.value) || 30,
                      })
                    }
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">jours</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="invoice-max" className="text-xs">
                Nombre maximum de relances
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="invoice-max"
                  type="number"
                  min={0}
                  max={5}
                  value={invoiceSettings.maxReminders}
                  onChange={(e) =>
                    setInvoiceSettings({
                      ...invoiceSettings,
                      maxReminders: parseInt(e.target.value) || 3,
                    })
                  }
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">relances max</span>
              </div>
            </div>

            <Separator />

            {/* Pénalités de retard */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Pénalités de retard
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="late-rate" className="text-xs">
                    Taux d'intérêt de retard
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="late-rate"
                      type="number"
                      step="0.01"
                      min={0}
                      max={100}
                      value={invoiceSettings.latePaymentRate}
                      onChange={(e) =>
                        setInvoiceSettings({
                          ...invoiceSettings,
                          latePaymentRate: parseFloat(e.target.value) || 10.57,
                        })
                      }
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="recovery-fee" className="text-xs">
                    Frais de recouvrement
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="recovery-fee"
                      type="number"
                      step="0.01"
                      min={0}
                      max={1000}
                      value={invoiceSettings.recoveryFee}
                      onChange={(e) =>
                        setInvoiceSettings({
                          ...invoiceSettings,
                          recoveryFee: parseFloat(e.target.value) || 40.0,
                        })
                      }
                      className="w-24"
                    />
                    <Euro className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Ces montants sont mentionnés dans les emails de relance de factures
                conformément à l'article L441-6 du Code de commerce.
              </p>
            </div>

            <Separator />

            <div>
              <Label htmlFor="invoice-message" className="text-xs">
                Message personnalisé (optionnel)
              </Label>
              <Textarea
                id="invoice-message"
                placeholder="Message additionnel à inclure dans les emails de relance..."
                value={invoiceSettings.customMessage}
                onChange={(e) =>
                  setInvoiceSettings({
                    ...invoiceSettings,
                    customMessage: e.target.value,
                  })
                }
                rows={3}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info automatisation */}
      <Card className="bg-gradient-to-br from-violet-500/5 to-violet-500/10 border-violet-500/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <Bell className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">
                Relances automatiques (bientôt disponible)
              </h3>
              <p className="text-sm text-muted-foreground">
                Les relances automatiques enverront automatiquement des emails de
                rappel selon les intervalles configurés ci-dessus. Cette
                fonctionnalité sera disponible prochainement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bouton enregistrer en bas */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={isSaving} size="lg" className="gap-2">
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Enregistrer les paramètres
        </Button>
      </div>
    </LayoutContainer>
  )
}
