'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MobileLayout } from '@/components/mobile/MobileLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Receipt,
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

export default function MobileRelancesParametresPage() {
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
      toast.error('Erreur lors du chargement')
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
        toast.error('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <MobileLayout title="Paramètres" showBottomNav={false}>
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout title="Paramètres relances" showBottomNav={false}>
      <div className="p-4 space-y-4">
        <Link
          href="/mobile/relances"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Link>

        {/* Paramètres Devis */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Relances devis</h3>
                  <p className="text-xs text-muted-foreground">
                    Délais après envoi
                  </p>
                </div>
              </div>
              <Switch
                checked={quoteSettings.enabled}
                onCheckedChange={(checked) =>
                  setQuoteSettings({ ...quoteSettings, enabled: checked })
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">1ère</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Input
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
                    className="w-16 h-9"
                  />
                  <span className="text-xs text-muted-foreground">j</span>
                </div>
              </div>
              <div>
                <Label className="text-xs">2ème</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Input
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
                    className="w-16 h-9"
                  />
                  <span className="text-xs text-muted-foreground">j</span>
                </div>
              </div>
              <div>
                <Label className="text-xs">3ème</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Input
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
                    className="w-16 h-9"
                  />
                  <span className="text-xs text-muted-foreground">j</span>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs">Max relances</Label>
              <Input
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
                className="w-20 h-9 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Message personnalisé</Label>
              <Textarea
                placeholder="Message optionnel..."
                value={quoteSettings.customMessage}
                onChange={(e) =>
                  setQuoteSettings({
                    ...quoteSettings,
                    customMessage: e.target.value,
                  })
                }
                rows={2}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Paramètres Factures */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Relances factures</h3>
                  <p className="text-xs text-muted-foreground">
                    Délais après échéance
                  </p>
                </div>
              </div>
              <Switch
                checked={invoiceSettings.enabled}
                onCheckedChange={(checked) =>
                  setInvoiceSettings({ ...invoiceSettings, enabled: checked })
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">1ère</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Input
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
                    className="w-16 h-9"
                  />
                  <span className="text-xs text-muted-foreground">j</span>
                </div>
              </div>
              <div>
                <Label className="text-xs">2ème</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Input
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
                    className="w-16 h-9"
                  />
                  <span className="text-xs text-muted-foreground">j</span>
                </div>
              </div>
              <div>
                <Label className="text-xs">3ème</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Input
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
                    className="w-16 h-9"
                  />
                  <span className="text-xs text-muted-foreground">j</span>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs">Max relances</Label>
              <Input
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
                className="w-20 h-9 mt-1"
              />
            </div>

            {/* Pénalités */}
            <div className="pt-2 border-t space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Pénalités de retard
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Taux d'intérêt</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <Input
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
                      className="w-20 h-9"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Frais recouvrement</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <Input
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
                      className="w-20 h-9"
                    />
                    <Euro className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs">Message personnalisé</Label>
              <Textarea
                placeholder="Message optionnel..."
                value={invoiceSettings.customMessage}
                onChange={(e) =>
                  setInvoiceSettings({
                    ...invoiceSettings,
                    customMessage: e.target.value,
                  })
                }
                rows={2}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bouton enregistrer */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full gap-2"
          size="lg"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Enregistrer
        </Button>

        <div className="h-8" />
      </div>
    </MobileLayout>
  )
}
