'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Mail, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResendEmail = async () => {
    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      const supabase = createClient();
      
      // Récupérer l'email stocké temporairement
      const email = localStorage.getItem('pendingVerificationEmail');
      
      if (!email) {
        setError('Email non trouvé. Veuillez vous réinscrire.');
        return;
      }

      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (resendError) {
        setError(resendError.message);
      } else {
        setResendSuccess(true);
      }
    } catch {
      setError('Erreur lors du renvoi. Veuillez réessayer.');
    } finally {
      setIsResending(false);
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
          
          {/* Grande icône email */}
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-10 w-10 text-blue-600" />
          </div>
          
          <CardTitle className="text-2xl">Vérifiez votre email</CardTitle>
          <CardDescription className="mt-2 text-base">
            Un email de confirmation a été envoyé à votre adresse.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Instructions */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="mb-2 font-semibold text-amber-800">
              📧 Activez votre compte
            </h3>
            <ol className="space-y-2 text-sm text-amber-700">
              <li>1. Ouvrez votre boîte mail</li>
              <li>2. Cliquez sur le lien dans l'email de ChantiPay</li>
              <li>3. Votre compte sera activé automatiquement</li>
            </ol>
          </div>

          {/* Avertissement spam */}
          <div className="flex items-start gap-3 rounded-lg bg-slate-100 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-slate-500 mt-0.5" />
            <div className="text-sm text-slate-600">
              <p className="font-medium">Vous ne trouvez pas l'email ?</p>
              <p className="mt-1">Vérifiez vos <strong>spams</strong> ou <strong>courriers indésirables</strong>.</p>
            </div>
          </div>

          {/* Message de succès */}
          {resendSuccess && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-700">Email renvoyé avec succès !</p>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Bouton renvoyer */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResendEmail}
            disabled={isResending}
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Renvoyer l'email
              </>
            )}
          </Button>

          {/* Lien vers connexion */}
          <div className="text-center text-sm text-muted-foreground">
            Déjà vérifié ?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
