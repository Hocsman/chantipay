'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Mail, Lock, User, Eye, EyeOff, Building } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface MobileSignupProps {
  onSwitchToLogin: () => void;
}

export function MobileSignup({ onSwitchToLogin }: MobileSignupProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    fullName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // Sign up
      const { error: signUpError, data } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            company_name: formData.companyName,
            full_name: formData.fullName,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Create profile
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          company_name: formData.companyName,
          email: formData.email,
        });

        if (profileError) throw profileError;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header with logo */}
      <div className="flex flex-col items-center px-8 pt-12 pb-6">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-lg">
          <FileText className="h-10 w-10 text-white" strokeWidth={2} />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          Créer un compte
        </h1>
        <p className="text-center text-muted-foreground">
          Rejoignez ChantiPay et simplifiez votre gestion
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-8 pb-8">
        <form onSubmit={handleSignup} className="space-y-4">
          {/* Full name */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-foreground">
              Nom complet
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Jean Dupont"
                value={formData.fullName}
                onChange={handleChange}
                className="h-14 pl-11 text-base"
                required
              />
            </div>
          </div>

          {/* Company name */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-foreground">
              Nom de l'entreprise
            </Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="companyName"
                name="companyName"
                type="text"
                placeholder="Mon Entreprise"
                value={formData.companyName}
                onChange={handleChange}
                className="h-14 pl-11 text-base"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleChange}
                className="h-14 pl-11 text-base"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              Mot de passe
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="h-14 pl-11 pr-11 text-base"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground">
              Confirmer le mot de passe
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="h-14 pl-11 text-base"
                required
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            className="h-14 w-full text-base"
            disabled={loading}
          >
            {loading ? 'Création...' : 'Créer mon compte'}
          </Button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-muted-foreground">OU</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Switch to login */}
        <div className="text-center">
          <p className="text-muted-foreground">
            Déjà un compte ?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-semibold text-primary"
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
