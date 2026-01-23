"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LEGAL_ENTITY } from "@/lib/legal";

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-orange-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none"></div>

      <div className="max-w-4xl mx-auto py-12 px-4 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Retour à l&apos;accueil
        </Link>

        <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10 shadow-2xl p-8 md:p-12 space-y-12">
          <div className="border-b border-white/10 pb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Politique de Confidentialité
            </h1>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full text-xs font-medium uppercase tracking-wider">Mise à jour</span>
              <p className="text-sm text-gray-500">
                {LEGAL_ENTITY.lastUpdate.privacy}
              </p>
            </div>
          </div>

          <div className="space-y-12">

            {/* Intro */}
            <section className="space-y-4">
              <div className="text-gray-400 leading-relaxed text-justify">
                <p>
                  La présente Politique de Confidentialité décrit comment <strong className="text-white">{LEGAL_ENTITY.companyName}</strong>{" "}
                  collecte, utilise et protège les données personnelles des utilisateurs
                  du service ChantiPay, conformément au Règlement Général sur la Protection
                  des Données (RGPD) et à la loi Informatique et Libertés.
                </p>
              </div>
            </section>

            {/* Article 1 - Responsable */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">1. Responsable du traitement</h2>
              <div className="text-gray-400 leading-relaxed">
                <p className="mb-4">Le responsable du traitement des données personnelles est :</p>
                <div className="bg-white/5 rounded-lg p-6 border border-white/5">
                  <ul className="list-none space-y-2">
                    <li><strong className="text-white w-24 inline-block">Société :</strong> {LEGAL_ENTITY.companyName}</li>
                    <li><strong className="text-white w-24 inline-block">Adresse :</strong> {LEGAL_ENTITY.address}</li>
                    <li><strong className="text-white w-24 inline-block">Email :</strong> <a href={`mailto:${LEGAL_ENTITY.email}`} className="text-orange-400 hover:underline">{LEGAL_ENTITY.email}</a></li>
                    <li><strong className="text-white w-24 inline-block">SIRET :</strong> {LEGAL_ENTITY.siret}</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Article 2 - Données collectées */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">2. Données personnelles collectées</h2>
              <div className="text-gray-400 leading-relaxed space-y-6">
                <p>
                  Dans le cadre de l&apos;utilisation de ChantiPay, nous collectons les
                  données suivantes :
                </p>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Données d&apos;identification</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4 marker:text-orange-500">
                    <li>Nom et prénom</li>
                    <li>Adresse e-mail</li>
                    <li>Numéro de téléphone (optionnel)</li>
                    <li>Raison sociale de l&apos;entreprise, SIRET, Adresse pro</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Données de connexion</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4 marker:text-orange-500">
                    <li>Adresse IP, Navigateur, OS</li>
                    <li>Date/Heure de connexion</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Données d&apos;utilisation</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4 marker:text-orange-500">
                    <li>Infos clients créés</li>
                    <li>Contenu des devis et signatures</li>
                    <li>Historique paiements</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Article 3 - Finalités */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">3. Finalités du traitement</h2>
              <div className="text-gray-400 leading-relaxed">
                <p className="mb-4">Vos données personnelles sont collectées pour :</p>
                <ul className="list-disc list-inside space-y-2 ml-4 marker:text-orange-500">
                  <li>Création et gestion de votre compte utilisateur</li>
                  <li>Fourniture et amélioration du service ChantiPay</li>
                  <li>Génération des devis et documents PDF</li>
                  <li>Gestion des abonnements et de la facturation</li>
                  <li>Communication relative au service (notifications, support)</li>
                  <li>Respect de nos obligations légales et réglementaires</li>
                </ul>
              </div>
            </section>

            {/* Article 4 - Sous-traitants */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">4. Destinataires et sous-traitants</h2>
              <div className="text-gray-400 leading-relaxed">
                <p className="mb-4">Vos données peuvent être partagées avec nos partenaires de confiance :</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <strong className="text-white block mb-1">Supabase</strong>
                    <span className="text-sm">Base de données & Auth</span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <strong className="text-white block mb-1">Stripe</strong>
                    <span className="text-sm">Paiements sécurisés</span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <strong className="text-white block mb-1">Resend</strong>
                    <span className="text-sm">Emails transactionnels</span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <strong className="text-white block mb-1">Vercel</strong>
                    <span className="text-sm">Hébergement</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Article 5 - Durée */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">5. Durée de conservation</h2>
              <div className="text-gray-400 leading-relaxed">
                <ul className="list-disc list-inside space-y-2 ml-4 marker:text-orange-500">
                  <li>
                    <strong className="text-white">Compte :</strong> durée de l&apos;inscription + 3 ans
                  </li>
                  <li>
                    <strong className="text-white">Facturation :</strong> 10 ans (loi)
                  </li>
                  <li>
                    <strong className="text-white">Devis :</strong> durée inscription + 5 ans
                  </li>
                </ul>
              </div>
            </section>

            {/* Article 6 - Sécurité */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">6. Sécurité des données</h2>
              <div className="text-gray-400 leading-relaxed">
                <p>
                  Nous utilisons le chiffrement (HTTPS/TLS) pour toutes les communications et le stockage sécurisé des données.
                  L&apos;accès est restreint aux personnels autorisés.
                </p>
              </div>
            </section>

            {/* Article 7 - Vos droits */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">7. Vos droits (RGPD)</h2>
              <div className="text-gray-400 leading-relaxed">
                <p className="mb-4">Vous disposez des droits suivants :</p>
                <ul className="list-disc list-inside space-y-2 ml-4 marker:text-orange-500">
                  <li>Accès, Rectification, Effacement</li>
                  <li>Limitation, Portabilité, Opposition</li>
                  <li>Retrait du consentement</li>
                </ul>
                <p className="mt-4">
                  Pour exercer ces droits, contactez : <a href={`mailto:${LEGAL_ENTITY.email}`} className="text-orange-400 hover:underline">{LEGAL_ENTITY.email}</a>
                </p>
              </div>
            </section>

            {/* Article 8 - Cookies */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">8. Cookies</h2>
              <div className="text-gray-400 leading-relaxed">
                <p>
                  Nous utilisons uniquement des cookies essentiels au fonctionnement (session, préférences).
                  Pas de tracking publicitaire intrusif.
                </p>
              </div>
            </section>

            {/* Article 9 - Contact */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">9. Contact</h2>
              <div className="text-gray-400 leading-relaxed space-y-4">
                <p>
                  Pour toute question relative à cette Politique de Confidentialité :
                </p>
                <ul className="list-none space-y-1 ml-4">
                  <li><strong>Email :</strong> <a href={`mailto:${LEGAL_ENTITY.email}`} className="text-orange-400 hover:underline">{LEGAL_ENTITY.email}</a></li>
                  <li><strong>Adresse :</strong> {LEGAL_ENTITY.address}</li>
                </ul>
              </div>
            </section>

          </div>
        </div>

        {/* Footer navigation */}
        <div className="mt-12 text-center text-sm text-gray-600 space-x-6">
          <Link href="/mentions-legales" className="hover:text-gray-400 hover:underline">
            Mentions légales
          </Link>
          <Link href="/cgu" className="hover:text-gray-400 hover:underline">
            CGU
          </Link>
          <Link href="/politique-confidentialite" className="text-orange-500 hover:text-orange-400 hover:underline">
            Politique de confidentialité
          </Link>
        </div>
      </div>
    </div>
  );
}
