'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { FileText, Mail, RefreshCw, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function MobileVerifyEmailPage() {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex flex-col items-center px-6 pt-12 pb-6">
        {/* Logo */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-lg">
          <FileText className="h-10 w-10 text-white" strokeWidth={2} />
        </div>
        
        {/* Grande icône email */}
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-100">
          <Mail className="h-12 w-12 text-blue-600" />
        </div>
        
        <h1 className="mb-2 text-2xl font-bold text-foreground text-center">
          Vérifiez votre email
        </h1>
        <p className="text-center text-muted-foreground">
          Un email de confirmation a été envoyé à votre adresse.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-8 space-y-6">
        {/* Instructions */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="mb-3 font-semibold text-amber-800 text-lg">
            📧 Activez votre compte
          </h3>
          <ol className="space-y-3 text-amber-700">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-sm font-bold text-amber-800">1</span>
              <span>Ouvrez votre boîte mail</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-sm font-bold text-amber-800">2</span>
              <span>Cliquez sur le lien dans l'email de ChantiPay</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-sm font-bold text-amber-800">3</span>
              <span>Votre compte sera activé automatiquement</span>
            </li>
          </ol>
        </div>

        {/* Avertissement spam */}
        <div className="flex items-start gap-4 rounded-2xl bg-slate-100 p-5">
          <AlertCircle className="h-6 w-6 shrink-0 text-slate-500 mt-0.5" />
          <div className="text-slate-600">
            <p className="font-medium">Vous ne trouvez pas l'email ?</p>
            <p className="mt-1 text-sm">Vérifiez vos <strong>spams</strong> ou <strong>courriers indésirables</strong>.</p>
          </div>
        </div>

        {/* Message de succès */}
        {resendSuccess && (
          <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <p className="text-green-700 font-medium">Email renvoyé avec succès !</p>
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Boutons */}
        <div className="space-y-3 pt-4">
          {/* Bouton renvoyer */}
          <Button
            variant="outline"
            className="w-full h-14 text-base rounded-xl"
            onClick={handleResendEmail}
            disabled={isResending}
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-5 w-5" />
                Renvoyer l'email
              </>
            )}
          </Button>

          {/* Bouton connexion */}
          <Button
            className="w-full h-14 text-base rounded-xl"
            onClick={() => router.push('/mobile/auth')}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Retour à la connexion
          </Button>
        </div>
      </div>
    </div>
  );
}
