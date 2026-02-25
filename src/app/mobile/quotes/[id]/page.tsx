'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { SignaturePad } from '@/components/SignaturePad';
import { SmartEditSheet } from '@/components/quotes/SmartEditSheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Mail, Download, Share2, PenTool, Wallet, Check, FileText, Loader2, Edit, Plus, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

type QuoteStatus = 'draft' | 'sent' | 'signed' | 'deposit_paid' | 'completed' | 'canceled';

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit_price_ht: number;
  vat_rate: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address_line1: string | null;
  address_line2: string | null;
  postal_code: string | null;
  city: string | null;
}

interface Quote {
  id: string;
  quote_number: string;
  status: QuoteStatus;
  created_at: string;
  valid_until: string | null;
  signed_at: string | null;
  signature_image_url: string | null;
  deposit_percent: number;
  deposit_amount: number;
  deposit_status: 'pending' | 'paid';
  deposit_paid_at: string | null;
  deposit_method: 'virement' | 'cash' | 'cheque' | 'autre' | null;
  items: QuoteItem[];
  clients: Client;
}

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  // États UI pour signature et acompte
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [depositMethod, setDepositMethod] = useState<string>('');
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  const [isMarkingDeposit, setIsMarkingDeposit] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // États édition manuelle
  const [isEditing, setIsEditing] = useState(false);
  const [editItems, setEditItems] = useState<QuoteItem[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Charger le devis avec toutes les données
  const loadQuote = useCallback(async () => {
    if (!params.id) return;

    // Valider le format UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(params.id as string)) {
      console.error('ID invalide (format UUID attendu):', params.id);
      toast.error('Devis non trouvé', {
        description: 'L\'identifiant du devis est invalide.'
      });
      router.push('/mobile/quotes');
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();

      // Récupérer le devis avec les infos client
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          clients (*)
        `)
        .eq('id', params.id)
        .single();

      if (quoteError) {
        console.error('Erreur Supabase:', quoteError);
        toast.error('Devis non trouvé', {
          description: quoteError.message
        });
        router.push('/mobile/quotes');
        return;
      }

      // Récupérer les lignes du devis
      const { data: items, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', params.id)
        .order('created_at', { ascending: true });

      if (itemsError) {
        console.error('Erreur items:', itemsError);
      }

      const fullQuote = {
        ...quoteData,
        items: items || [],
      };

      setQuote(fullQuote);
    } catch (error) {
      console.error('Erreur chargement devis:', error);
      router.push('/mobile/quotes');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    loadQuote();
  }, [loadQuote]);

  // Calculs des totaux
  const totalHT =
    quote?.items?.reduce((sum, item) => sum + item.quantity * item.unit_price_ht, 0) || 0;
  const totalVAT =
    quote?.items?.reduce(
      (sum, item) => sum + item.quantity * item.unit_price_ht * (item.vat_rate / 100),
      0
    ) || 0;
  const totalTTC = totalHT + totalVAT;

  // Appliquer les modifications intelligentes
  const handleSmartEdit = useCallback(async (newItems: QuoteItem[]) => {
    if (!quote) return;

    try {
      const supabase = createClient();

      // Supprimer les anciennes lignes
      await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', quote.id);

      // Insérer les nouvelles lignes
      const itemsToInsert = newItems.map((item) => ({
        quote_id: quote.id,
        description: item.description,
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        vat_rate: item.vat_rate,
      }));

      const { error: insertError } = await supabase
        .from('quote_items')
        .insert(itemsToInsert);

      if (insertError) throw insertError;

      // Recharger le devis
      await loadQuote();
    } catch (error) {
      console.error('Erreur mise à jour devis:', error);
      toast.error('Erreur lors de la mise à jour du devis');
    }
  }, [quote, loadQuote]);

  // Édition manuelle
  const startEditing = () => {
    if (!quote) return;
    setEditItems(quote.items.map(item => ({ ...item })));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditItems([]);
  };

  const updateEditItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    setEditItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addEditItem = () => {
    setEditItems(prev => [...prev, { id: `new-${Date.now()}`, description: '', quantity: 1, unit_price_ht: 0, vat_rate: 10 }]);
  };

  const removeEditItem = (index: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const saveEditing = async () => {
    if (!quote || editItems.length === 0) return;
    if (editItems.some(item => !item.description.trim())) {
      toast.error('Chaque ligne doit avoir une description');
      return;
    }

    setIsSavingEdit(true);
    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: editItems }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      setIsEditing(false);
      setEditItems([]);
      await loadQuote();
      toast.success('Devis mis à jour');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Gestion de la signature
  const handleSignature = async (signatureDataUrl: string) => {
    if (!quote) return;

    setIsSavingSignature(true);
    try {
      const response = await fetch(`/api/quotes/${quote.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: signatureDataUrl }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Erreur lors de la sauvegarde');

      // Fermer le dialog
      setIsSignatureDialogOpen(false);

      // Recharger le devis pour avoir les données à jour
      await loadQuote();

      // Afficher une notification
      toast.success('✅ ' + data.message);
    } catch (error) {
      console.error('Erreur signature:', error);
      toast.error('❌ Erreur lors de la signature. Veuillez réessayer.');
    } finally {
      setIsSavingSignature(false);
    }
  };

  // Téléchargement du PDF (compatible Chrome mobile)
  const handleDownloadPDF = async () => {
    if (!quote) return;

    setIsDownloadingPDF(true);
    try {
      const response = await fetch(`/api/quotes/${quote.id}/pdf`);

      if (!response.ok) throw new Error('Erreur lors de la génération du PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${quote.quote_number}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      // Nettoyer après un délai pour assurer la compatibilité mobile
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      toast.success('PDF téléchargé', {
        description: `Le devis ${quote.quote_number} a été téléchargé`
      });
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      toast.error('Erreur', {
        description: 'Impossible de télécharger le PDF'
      });
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Marquer l'acompte comme payé
  const handleMarkDepositPaid = async () => {
    if (!quote || !depositMethod) return;

    setIsMarkingDeposit(true);
    try {
      const response = await fetch(`/api/quotes/${quote.id}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: depositMethod }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Erreur lors de la mise à jour');

      // Fermer le dialog et recharger
      setIsDepositDialogOpen(false);
      setDepositMethod('');

      // Recharger le devis
      await loadQuote();

      // Afficher une notification
      toast.success('✅ Acompte marqué comme payé');
    } catch (error) {
      console.error('Erreur marquage acompte:', error);
      toast.error('❌ Erreur lors du marquage de l\'acompte');
    } finally {
      setIsMarkingDeposit(false);
    }
  };

  // Envoyer par email
  const handleSendEmail = async () => {
    if (!quote) return;
    if (!quote.clients?.email) {
      toast.error('Le client n\'a pas d\'adresse email');
      return;
    }

    setIsSendingEmail(true);
    try {
      const response = await fetch(`/api/quotes/${quote.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Erreur lors de l\'envoi');

      // Recharger le devis pour avoir le nouveau statut
      await loadQuote();

      toast.success('Email envoyé avec succès', {
        description: `Devis envoyé à ${quote.clients.email}`,
      });
    } catch (error) {
      console.error('Erreur envoi email:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout title="Chargement..." showBottomNav={false}>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (!quote) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'signed':
        return 'Signé';
      case 'sent':
        return 'Envoyé';
      case 'draft':
        return 'Brouillon';
      default:
        return status;
    }
  };

  return (
    <MobileLayout
      title="Détails du devis"
      subtitle={`#${quote.id.slice(0, 8)}`}
      showBottomNav={false}
    >
      <div className="p-4 space-y-6">
        {/* Bouton retour */}
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        {/* Informations du devis */}
        <div className="rounded-2xl bg-card p-6 shadow-sm space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Statut</h3>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(
                quote.status
              )}`}
            >
              {getStatusLabel(quote.status)}
            </span>
          </div>

          {/* Numéro de devis */}
          {quote.quote_number && (
            <div>
              <p className="text-sm text-muted-foreground">Numéro</p>
              <p className="text-lg font-semibold text-foreground">
                {quote.quote_number}
              </p>
            </div>
          )}

          {/* Client */}
          <div>
            <p className="text-sm text-muted-foreground">Client</p>
            <p className="text-lg font-semibold text-foreground">
              {quote.clients?.name || 'Client non trouvé'}
            </p>
            {quote.clients?.email && (
              <p className="text-sm text-muted-foreground">{quote.clients.email}</p>
            )}
            {quote.clients?.phone && (
              <p className="text-sm text-muted-foreground">{quote.clients.phone}</p>
            )}
          </div>

          {/* Montants */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total HT</span>
              <span className="text-foreground">{formatCurrency(totalHT)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">TVA</span>
              <span className="text-foreground">{formatCurrency(totalVAT)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total TTC</span>
              <span className="text-primary">{formatCurrency(totalTTC)}</span>
            </div>
            {quote.deposit_amount > 0 && (
              <div className="flex justify-between text-primary font-medium pt-2">
                <span>Acompte ({quote.deposit_percent}%)</span>
                <span>{formatCurrency(quote.deposit_amount)}</span>
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <p className="text-sm text-muted-foreground">Date de création</p>
            <p className="text-foreground">{formatDate(quote.created_at)}</p>
          </div>

          {/* Signature */}
          {quote.signed_at && (
            <div>
              <p className="text-sm text-muted-foreground">Signé le</p>
              <p className="text-foreground font-medium flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                {formatDate(quote.signed_at)}
              </p>
              {quote.signature_image_url && (
                <div className="mt-2 p-3 bg-muted/30 rounded-lg">
                  <img
                    src={quote.signature_image_url}
                    alt="Signature"
                    className="w-full max-w-xs mx-auto"
                  />
                </div>
              )}
            </div>
          )}

          {/* Acompte payé */}
          {quote.deposit_status === 'paid' && quote.deposit_paid_at && (
            <div>
              <p className="text-sm text-muted-foreground">Acompte payé le</p>
              <p className="text-foreground font-medium flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                {formatDate(quote.deposit_paid_at)}
              </p>
            </div>
          )}
        </div>

        {/* Lignes du devis */}
        {((quote.items && quote.items.length > 0) || isEditing) && (
          <div className="rounded-2xl bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Détail des prestations</h3>
              {quote.status === 'draft' && !isEditing && (
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
              )}
            </div>
            {quote.status === 'draft' && !isEditing && (
              <SmartEditSheet
                items={quote.items}
                onApplyChanges={handleSmartEdit}
              />
            )}

            {isEditing ? (
              /* Mode édition */
              <div className="space-y-4">
                {editItems.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-muted-foreground">Description</label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateEditItem(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="h-9"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 mt-4 h-8 w-8"
                        onClick={() => removeEditItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Qté</label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateEditItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="1"
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Prix HT</label>
                        <Input
                          type="number"
                          value={item.unit_price_ht}
                          onChange={(e) => updateEditItem(index, 'unit_price_ht', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="h-9"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">TVA %</label>
                        <Input
                          type="number"
                          value={item.vat_rate}
                          onChange={(e) => updateEditItem(index, 'vat_rate', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.5"
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="text-right text-sm font-medium text-muted-foreground">
                      Total HT : {formatCurrency(item.quantity * item.unit_price_ht)}
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" onClick={addEditItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une ligne
                </Button>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={cancelEditing} disabled={isSavingEdit}>
                    <X className="h-4 w-4 mr-1" />
                    Annuler
                  </Button>
                  <Button className="flex-1" onClick={saveEditing} disabled={isSavingEdit}>
                    {isSavingEdit ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Enregistrer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {quote.items.map((item, index) => (
                  <div key={item.id} className="p-3 bg-muted/30 rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-foreground">
                        Ligne {index + 1}
                      </span>
                      <span className="text-sm font-medium text-primary">
                        {formatCurrency(item.quantity * item.unit_price_ht)} HT
                      </span>
                    </div>
                    <p className="text-foreground">{item.description}</p>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        {item.quantity} × {formatCurrency(item.unit_price_ht)}
                      </span>
                      <span>TVA {item.vat_rate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {/* Bouton Signer (si pas encore signé) */}
          {quote.status !== 'signed' &&
            quote.status !== 'deposit_paid' &&
            quote.status !== 'completed' && (
              <Button
                className="w-full h-12 text-base"
                onClick={() => setIsSignatureDialogOpen(true)}
              >
                <PenTool className="mr-2 h-5 w-5" />
                Signer le devis
              </Button>
            )}

          {/* Bouton Marquer acompte payé (si signé mais pas payé) */}
          {quote.status === 'signed' &&
            quote.deposit_amount > 0 &&
            quote.deposit_status === 'pending' && (
              <Button
                className="w-full h-12 text-base"
                variant="default"
                onClick={() => setIsDepositDialogOpen(true)}
              >
                <Wallet className="mr-2 h-5 w-5" />
                Marquer l'acompte comme payé
              </Button>
            )}

          {/* Bouton Convertir en facture (si signé) */}
          {quote.status === 'signed' && (
            <Button
              className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={async () => {
                setLoading(true)
                try {
                  const { createInvoiceFromQuote } = await import('@/lib/invoiceHelpers')
                  const result = await createInvoiceFromQuote(quote, quote.clients)

                  if (!result.success) {
                    toast.error(result.error)
                    return
                  }

                  toast.success(`Facture ${result.invoiceNumber} créée avec succès !`)
                  router.push(`/mobile/factures/${result.invoiceId}`)
                } catch (error) {
                  console.error(error)
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : 'Erreur lors de la création de la facture'
                  )
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Convertir en facture
                </>
              )}
            </Button>
          )}

          {/* Autres actions */}
          <Button
            className="w-full h-12 text-base"
            variant="outline"
            onClick={handleSendEmail}
            disabled={isSendingEmail || !quote.clients?.email}
          >
            {isSendingEmail ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-5 w-5" />
                Envoyer par email
              </>
            )}
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={handleDownloadPDF}
              disabled={isDownloadingPDF}
            >
              {isDownloadingPDF ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Téléchargement...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </>
              )}
            </Button>
            <Button variant="outline" className="w-full h-12">
              <Share2 className="mr-2 h-4 w-4" />
              Partager
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog Signature */}
      <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl">✍️ Signature du client</DialogTitle>
            <DialogDescription className="text-base">
              <strong>{quote.clients?.name || 'Client'}</strong>, veuillez signer ci-dessous pour
              accepter le devis <strong>{quote.quote_number}</strong> d'un montant de{' '}
              <strong>{formatCurrency(totalTTC)}</strong>
            </DialogDescription>
          </DialogHeader>
          <SignaturePad
            onSave={handleSignature}
            onCancel={() => setIsSignatureDialogOpen(false)}
            isLoading={isSavingSignature}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Acompte */}
      <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">💰 Marquer l'acompte comme payé</DialogTitle>
            <DialogDescription className="text-base">
              Montant : <strong>{formatCurrency(quote.deposit_amount)}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-method">Méthode de paiement</Label>
              <Select value={depositMethod} onValueChange={setDepositMethod}>
                <SelectTrigger id="deposit-method" className="w-full h-12">
                  <SelectValue placeholder="Sélectionnez une méthode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virement">
                    <span className="flex items-center gap-2">🏦 Virement bancaire</span>
                  </SelectItem>
                  <SelectItem value="cash">
                    <span className="flex items-center gap-2">💵 Espèces</span>
                  </SelectItem>
                  <SelectItem value="cheque">
                    <span className="flex items-center gap-2">📝 Chèque</span>
                  </SelectItem>
                  <SelectItem value="autre">
                    <span className="flex items-center gap-2">📋 Autre</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDepositDialogOpen(false)}
              disabled={isMarkingDeposit}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleMarkDepositPaid}
              disabled={!depositMethod || isMarkingDeposit}
              className="flex-1"
            >
              {isMarkingDeposit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Confirmer'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
