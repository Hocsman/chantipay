'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2, Building2, User, Phone, MapPin, Hash, Eye, EyeOff } from 'lucide-react';
import { useAntiBot, HoneypotField } from '@/hooks/useAntiBot';

export default function RegisterPage() {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [siret, setSiret] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Anti-bot protection
  const { honeypot, setHoneypot, formLoadedAt } = useAntiBot();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Anti-bot: honeypot check
    if (honeypot) {
      // Silently fail for bots
      return;
    }
    
    // Anti-bot: time check (submitted too fast = bot)
    if (Date.now() - formLoadedAt < 3000) {
      setError('Veuillez patienter quelques secondes.');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // 1. Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // 2. Create/update the profile with company info
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: email,
            full_name: fullName || null,
            company_name: companyName || null,
            phone: phone || null,
            address: address || null,
            siret: siret || null,
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't block registration if profile creation fails
          // The user can complete their profile later
        }
      }

      // 3. Redirect to dashboard after successful registration
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 flex items-center gap-2">
            <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold">ChantiPay</span>
          </Link>
          <CardTitle>Créer un compte</CardTitle>
          <CardDescription>
            Commencez votre essai gratuit de 14 jours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot anti-bot field */}
            <HoneypotField value={honeypot} onChange={setHoneypot} name="company_website" />
            
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            
            {/* Personal Info */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Nom complet *
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Jean Dupont"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            
            {/* Company Info */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Nom de l&apos;entreprise *
              </Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Plomberie Dupont"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                autoComplete="organization"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Téléphone *
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="06 12 34 56 78"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Adresse <span className="text-muted-foreground text-xs">(optionnel)</span>
              </Label>
              <Input
                id="address"
                type="text"
                placeholder="123 rue de la Paix, 75001 Paris"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoComplete="street-address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="siret" className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                SIRET <span className="text-muted-foreground text-xs">(optionnel)</span>
              </Label>
              <Input
                id="siret"
                type="text"
                placeholder="123 456 789 00012"
                value={siret}
                onChange={(e) => setSiret(e.target.value)}
                maxLength={17}
              />
              <p className="text-muted-foreground text-xs">
                14 chiffres - affiché sur vos devis
              </p>
            </div>

            {/* Separator */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">
                  Identifiants
                </span>
              </div>
            </div>
            
            {/* Auth Info */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-muted-foreground text-xs">
                Minimum 8 caractères
              </p>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer mon compte
            </Button>
          </form>
          <p className="text-muted-foreground mt-4 text-center text-xs">
            En créant un compte, vous acceptez nos{' '}
            <Link href="#" className="underline">
              conditions d&apos;utilisation
            </Link>{' '}
            et notre{' '}
            <Link href="#" className="underline">
              politique de confidentialité
            </Link>
            .
          </p>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Déjà un compte ? </span>
            <Link href="/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
