'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { ArrowLeft, Loader2, Pencil, Trash2, Mail, Phone, MapPin, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  notes?: string | null;
  client_type?: 'particulier' | 'professionnel';
  company_name?: string | null;
  siret?: string | null;
  vat_number?: string | null;
  created_at: string;
}

export default function ClientDetailMobilePage() {
  const router = useRouter();
  const params = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address_line1: '',
    postal_code: '',
    city: '',
    notes: '',
    client_type: 'particulier' as 'particulier' | 'professionnel',
    company_name: '',
    siret: '',
    vat_number: '',
  });

  const loadClient = useCallback(async () => {
    if (!params.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${params.id}`);

      if (!response.ok) {
        toast.error('Client introuvable');
        router.push('/mobile/clients');
        return;
      }

      const data = await response.json();
      setClient(data.client);
      setFormData({
        name: data.client.name || '',
        email: data.client.email || '',
        phone: data.client.phone || '',
        address_line1: data.client.address_line1 || '',
        postal_code: data.client.postal_code || '',
        city: data.client.city || '',
        notes: data.client.notes || '',
        client_type: data.client.client_type || 'particulier',
        company_name: data.client.company_name || '',
        siret: data.client.siret || '',
        vat_number: data.client.vat_number || '',
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement');
      router.push('/mobile/clients');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!client) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erreur lors de la mise à jour');
        return;
      }

      toast.success('✅ Client mis à jour');
      setIsEditing(false);
      await loadClient();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!client) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors de la suppression');
        return;
      }

      toast.success('✅ Client supprimé');
      router.push('/mobile/clients');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
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

  if (!client) {
    return null;
  }

  return (
    <MobileLayout
      title={isEditing ? 'Modifier le client' : 'Détails client'}
      subtitle={client.name}
      showBottomNav={false}
    >
      <div className="p-4 pb-24 space-y-6">
        {/* Bouton retour */}
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        {/* Informations en lecture seule */}
        {!isEditing && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="text-lg font-semibold text-foreground">{client.name}</p>
                </div>

                {client.client_type === 'professionnel' && (
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Entreprise</p>
                      <p className="text-foreground font-medium">{client.company_name}</p>
                      {client.siret && (
                        <p className="text-muted-foreground text-xs">SIRET : {client.siret}</p>
                      )}
                      {client.vat_number && (
                        <p className="text-muted-foreground text-xs">TVA : {client.vat_number}</p>
                      )}
                    </div>
                  </div>
                )}

                {client.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a
                        href={`mailto:${client.email}`}
                        className="text-foreground hover:text-primary"
                      >
                        {client.email}
                      </a>
                    </div>
                  </div>
                )}

                {client.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Téléphone</p>
                      <a
                        href={`tel:${client.phone}`}
                        className="text-foreground hover:text-primary"
                      >
                        {client.phone}
                      </a>
                    </div>
                  </div>
                )}

                {(client.address_line1 || client.city) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Adresse</p>
                      {client.address_line1 && (
                        <p className="text-foreground">{client.address_line1}</p>
                      )}
                      {client.city && (
                        <p className="text-foreground">
                          {client.postal_code} {client.city}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {client.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-foreground whitespace-pre-wrap">{client.notes}</p>
                </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Créé le</p>
                  <p className="text-foreground">
                    {client.created_at && !isNaN(new Date(client.created_at).getTime())
                      ? new Date(client.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Date inconnue'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button className="w-full h-12 text-base" onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-5 w-5" />
                Modifier
              </Button>

              <Button
                variant="destructive"
                className="w-full h-12 text-base"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-5 w-5" />
                Supprimer
              </Button>
            </div>
          </>
        )}

        {/* Formulaire d'édition */}
        {isEditing && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Modifier les informations</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                {/* Type de client */}
                <div className="space-y-2">
                  <Label>Type de client</Label>
                  <Select
                    value={formData.client_type}
                    onValueChange={(value: 'particulier' | 'professionnel') =>
                      setFormData((prev) => ({ ...prev, client_type: value }))
                    }
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="particulier">Particulier</SelectItem>
                      <SelectItem value="professionnel">Professionnel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Champs professionnel */}
                {formData.client_type === 'professionnel' && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20 p-4 space-y-4">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Informations entreprise</p>
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Raison sociale *</Label>
                      <Input
                        id="company_name"
                        name="company_name"
                        placeholder="SARL Dupont & Fils"
                        value={formData.company_name}
                        onChange={handleChange}
                        required
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="siret">SIRET</Label>
                      <Input
                        id="siret"
                        name="siret"
                        placeholder="123 456 789 00012"
                        value={formData.siret}
                        onChange={handleChange}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vat_number">N° TVA intracommunautaire</Label>
                      <Input
                        id="vat_number"
                        name="vat_number"
                        placeholder="FR 12 345678901"
                        value={formData.vat_number}
                        onChange={handleChange}
                        className="h-12"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">
                    {formData.client_type === 'professionnel' ? 'Nom du contact *' : 'Nom complet *'}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder={formData.client_type === 'professionnel' ? 'M. Jean Dupont (contact)' : 'M. Jean Dupont'}
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="jean.dupont@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="06 12 34 56 78"
                    value={formData.phone}
                    onChange={handleChange}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_line1">Adresse</Label>
                  <Input
                    id="address_line1"
                    name="address_line1"
                    placeholder="123 rue de la République"
                    value={formData.address_line1}
                    onChange={handleChange}
                    className="h-12"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Code postal</Label>
                    <Input
                      id="postal_code"
                      name="postal_code"
                      placeholder="75001"
                      value={formData.postal_code}
                      onChange={handleChange}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="Paris"
                      value={formData.city}
                      onChange={handleChange}
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Informations complémentaires..."
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset form data
                      setFormData({
                        name: client.name || '',
                        email: client.email || '',
                        phone: client.phone || '',
                        address_line1: client.address_line1 || '',
                        postal_code: client.postal_code || '',
                        city: client.city || '',
                        notes: client.notes || '',
                        client_type: client.client_type || 'particulier',
                        company_name: client.company_name || '',
                        siret: client.siret || '',
                        vat_number: client.vat_number || '',
                      });
                    }}
                    className="flex-1 h-12 text-base"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 h-12 text-base"
                  >
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog Suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le client ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le client <strong>{client.name}</strong> sera
              définitivement supprimé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
