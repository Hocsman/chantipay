'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Save } from 'lucide-react';

export default function NewQuotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    description: '',
    amount: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/mobile/auth');
        return;
      }

      const { error } = await supabase.from('quotes').insert({
        user_id: session.user.id,
        client_name: formData.client_name,
        client_email: formData.client_email,
        description: formData.description,
        total_amount: parseFloat(formData.amount) || 0,
        status: 'draft',
      });

      if (error) throw error;

      router.push('/mobile/quotes');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création du devis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout
      title="Nouveau devis"
      subtitle="Créer un devis"
      showBottomNav={false}
    >
      <div className="p-4">
        {/* Header avec bouton retour */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="client_name">Nom du client</Label>
            <Input
              id="client_name"
              value={formData.client_name}
              onChange={(e) =>
                setFormData({ ...formData, client_name: e.target.value })
              }
              placeholder="Jean Dupont"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_email">Email du client</Label>
            <Input
              id="client_email"
              type="email"
              value={formData.client_email}
              onChange={(e) =>
                setFormData({ ...formData, client_email: e.target.value })
              }
              placeholder="jean@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Décrivez les travaux à réaliser..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Montant (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              placeholder="1500.00"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Création...' : 'Créer le devis'}
          </Button>
        </form>
      </div>
    </MobileLayout>
  );
}
