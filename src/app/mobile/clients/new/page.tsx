'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
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
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="M. Jean Dupont"
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
