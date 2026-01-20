'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2, Building2, User, Phone, MapPin, Hash, Eye, EyeOff } from 'lucide-react';
import { useAntiBot, HoneypotField } from '@/hooks/useAntiBot';
import { Separator } from '@/components/ui/separator';
import { useIsNativeApp } from '@/hooks/usePlatform';

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
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const isNativeApp = useIsNativeApp();

  // Anti-bot protection
  const { honeypot, setHoneypot, formLoadedAt } = useAntiBot();

  // OAuth sign up
  const handleOAuthSignUp = async (provider: 'google' | 'apple') => {
    setIsOAuthLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Déterminer la destination finale après authentification
      const finalDestination = isNativeApp ? '/mobile' : '/dashboard';

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${finalDestination}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        setError(error.message);
      }
      // La redirection se fera automatiquement si succès
    } catch {
      setError('Une erreur est survenue lors de l\'inscription OAuth.');
    } finally {
      setIsOAuthLoading(false);
    }
  };

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

      // 3. Stocker l'email pour pouvoir renvoyer le lien de vérification
      localStorage.setItem('pendingVerificationEmail', email);

      // 4. Rediriger vers la page de vérification d'email
      router.push('/verify-email');
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
          <Link href="/" className="mx-auto mb-4 flex items-center gap-2.5">
            <Image
              src="/favicon.svg"
              alt="ChantiPay"
              width={44}
              height={44}
              unoptimized
              className="rounded-xl"
            />
            <span className="text-2xl font-bold tracking-tight">ChantiPay</span>
          </Link>
          <CardTitle>Créer un compte</CardTitle>
          <CardDescription>
            Commencez votre essai gratuit de 14 jours
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12"
              onClick={() => handleOAuthSignUp('google')}
              disabled={isOAuthLoading || isLoading}
            >
              {isOAuthLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              S&apos;inscrire avec Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12"
              onClick={() => handleOAuthSignUp('apple')}
              disabled={isOAuthLoading || isLoading}
            >
              {isOAuthLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              )}
              S&apos;inscrire avec Apple
            </Button>
          </div>

          <div className="relative mb-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
              ou par email
            </span>
          </div>

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
                type="tel"
                inputMode="numeric"
                placeholder="123 456 789 00012"
                value={siret}
                onChange={(e) => setSiret(e.target.value)}
                maxLength={17}
              />
              <p className="text-muted-foreground text-xs">
                14 chiffres - affiché sur vos devis
              </p>
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
            <Link href="/cgu" className="underline hover:text-foreground">
              conditions d&apos;utilisation
            </Link>{' '}
            et notre{' '}
            <Link href="/politique-confidentialite" className="underline hover:text-foreground">
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
