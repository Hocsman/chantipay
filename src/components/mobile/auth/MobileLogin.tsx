'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface MobileLoginProps {
  onSwitchToSignup: () => void;
}

export function MobileLogin({ onSwitchToSignup }: MobileLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

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
      <div className="flex flex-col items-center px-8 pt-16 pb-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-lg">
          <FileText className="h-10 w-10 text-white" strokeWidth={2} />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          Bienvenue
        </h1>
        <p className="text-center text-muted-foreground">
          Connectez-vous pour accéder à votre espace
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 px-8">
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>

        {/* Forgot password */}
        <div className="mt-4 text-center">
          <Button variant="link" className="text-primary">
            Mot de passe oublié ?
          </Button>
        </div>

        {/* Divider */}
        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-muted-foreground">OU</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Switch to signup */}
        <div className="text-center">
          <p className="text-muted-foreground">
            Pas encore de compte ?{' '}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="font-semibold text-primary"
            >
              Créer un compte
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
