'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowLeft, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function NewClientMobilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erreur lors de la création du client');
        return;
      }

      toast.success('✅ Client créé avec succès');
      router.push('/mobile/clients');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MobileLayout title="Nouveau client" subtitle="Ajouter un client" showBottomNav={false}>
      <div className="p-4 pb-24 space-y-6">
        {/* Bouton retour */}
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations du client</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    <SelectItem value="professionnel">
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Professionnel
                      </span>
                    </SelectItem>
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
                  onClick={() => router.back()}
                  className="flex-1 h-12 text-base"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-12 text-base"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer le client
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}
