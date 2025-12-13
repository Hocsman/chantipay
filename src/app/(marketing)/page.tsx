import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Pen, CreditCard, Smartphone, Zap, Shield } from 'lucide-react';

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">ChantiPay</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/register">
              <Button>Essai gratuit</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center md:py-32">
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
          Devis signé, acompte encaissé,
          <br />
          <span className="text-primary">chantier sécurisé.</span>
        </h1>
        <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg md:text-xl">
          L&apos;application mobile-first pour les artisans qui veulent créer des devis
          professionnels, les faire signer sur place et encaisser l&apos;acompte en quelques secondes.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/dashboard">
            <Button size="lg" className="w-full px-8 sm:w-auto">
              Essayer gratuitement
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="w-full px-8 sm:w-auto">
            Voir la démo
          </Button>
        </div>
        <p className="text-muted-foreground mt-4 text-sm">
          14 jours d&apos;essai gratuit • Sans carte bancaire
        </p>
      </section>

      {/* Features Section */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Pensé pour les artisans sur le terrain</h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Fini les devis sur papier, les relances interminables et les acomptes jamais payés.
              ChantiPay digitalise votre processus commercial.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Smartphone className="text-primary mb-2 h-10 w-10" />
                <CardTitle>Devis sur mobile</CardTitle>
                <CardDescription>
                  Créez des devis professionnels directement depuis votre téléphone, même sur le chantier.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Pen className="text-primary mb-2 h-10 w-10" />
                <CardTitle>Signature au doigt</CardTitle>
                <CardDescription>
                  Faites signer vos clients sur place, directement sur l&apos;écran de votre téléphone.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CreditCard className="text-primary mb-2 h-10 w-10" />
                <CardTitle>Acompte instantané</CardTitle>
                <CardDescription>
                  Générez un lien de paiement et encaissez l&apos;acompte immédiatement par carte bancaire.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Zap className="text-primary mb-2 h-10 w-10" />
                <CardTitle>IA intégrée</CardTitle>
                <CardDescription>
                  Décrivez les travaux et l&apos;IA génère automatiquement les lignes de votre devis.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <FileText className="text-primary mb-2 h-10 w-10" />
                <CardTitle>PDF professionnel</CardTitle>
                <CardDescription>
                  Générez des PDF avec votre logo, signature et conditions générales en un clic.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="text-primary mb-2 h-10 w-10" />
                <CardTitle>Données sécurisées</CardTitle>
                <CardDescription>
                  Vos données sont chiffrées et sauvegardées. Conforme RGPD.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Devis sur place, signature au doigt, acompte en quelques secondes</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="bg-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-white">
                1
              </div>
              <h3 className="mb-2 text-xl font-semibold">Créez votre devis</h3>
              <p className="text-muted-foreground">
                Sur le chantier, créez votre devis en quelques taps. L&apos;IA peut vous aider à générer les lignes.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-white">
                2
              </div>
              <h3 className="mb-2 text-xl font-semibold">Faites signer</h3>
              <p className="text-muted-foreground">
                Présentez le devis au client et faites-le signer directement sur votre téléphone.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-white">
                3
              </div>
              <h3 className="mb-2 text-xl font-semibold">Encaissez l&apos;acompte</h3>
              <p className="text-muted-foreground">
                Envoyez le lien de paiement par SMS ou email. L&apos;acompte est sur votre compte en 2 jours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Tarifs simples et transparents</h2>
            <p className="text-muted-foreground">
              Pas de frais cachés. Annulez à tout moment.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            <Card className="relative">
              <CardHeader>
                <CardTitle>Artisan Solo</CardTitle>
                <CardDescription>Pour les indépendants</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">19€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Devis illimités
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Signature électronique
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Paiement en ligne
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> 50 générations IA/mois
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Export PDF
                  </li>
                </ul>
                <Link href="/register">
                  <Button className="mt-6 w-full">Commencer l&apos;essai gratuit</Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="border-primary relative">
              <div className="bg-primary absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-medium text-white">
                Populaire
              </div>
              <CardHeader>
                <CardTitle>Petite équipe</CardTitle>
                <CardDescription>Jusqu&apos;à 5 utilisateurs</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">39€</span>
                  <span className="text-muted-foreground">/mois</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Tout de Artisan Solo
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> 5 comptes utilisateurs
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> 200 générations IA/mois
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Tableau de bord équipe
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Support prioritaire
                  </li>
                </ul>
                <Link href="/register">
                  <Button className="mt-6 w-full">Commencer l&apos;essai gratuit</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Prêt à sécuriser vos chantiers ?</h2>
          <p className="text-muted-foreground mb-8">
            Rejoignez les centaines d&apos;artisans qui utilisent ChantiPay pour gagner du temps
            et sécuriser leurs paiements.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="px-8">
              Essayer gratuitement pendant 14 jours
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">ChantiPay</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 ChantiPay. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
