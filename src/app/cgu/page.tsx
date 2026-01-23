"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LEGAL_ENTITY } from "@/lib/legal";

export default function CGUPage() {
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
              Conditions Générales d&apos;Utilisation
            </h1>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full text-xs font-medium uppercase tracking-wider">Mise à jour</span>
              <p className="text-sm text-gray-500">
                {LEGAL_ENTITY.lastUpdate.cgu}
              </p>
            </div>
          </div>

          <div className="space-y-12">
            {/* Article 1 - Objet */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Article 1 - Objet</h2>
              <div className="text-gray-400 leading-relaxed space-y-4 text-justify">
                <p>
                  Les présentes Conditions Générales d&apos;Utilisation (CGU) ont pour objet
                  de définir les modalités et conditions d&apos;utilisation du service
                  ChantiPay, accessible à l&apos;adresse{" "}
                  <a href="https://www.chantipay.com" className="text-orange-400 hover:underline">
                    www.chantipay.com
                  </a>
                  , ainsi que les droits et obligations des parties dans ce cadre.
                </p>
                <p>
                  L&apos;inscription ou l&apos;utilisation du service implique l&apos;acceptation
                  pleine et entière des présentes CGU.
                </p>
              </div>
            </section>

            {/* Article 2 - Accès au service */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Article 2 - Accès au service</h2>
              <div className="text-gray-400 leading-relaxed space-y-4 text-justify">
                <p>
                  Le service est accessible à toute personne physique ou morale
                  disposant d&apos;une capacité juridique à contracter. L&apos;utilisateur
                  déclare avoir plus de 18 ans et être habilité à utiliser le service
                  dans le cadre de son activité professionnelle.
                </p>
                <p>
                  L&apos;inscription nécessite de fournir des informations exactes et
                  à jour, notamment : nom, prénom, adresse e-mail, et informations
                  relatives à l&apos;entreprise (raison sociale, SIRET le cas échéant).
                </p>
              </div>
            </section>

            {/* Article 3 - Description du service */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Article 3 - Description du service</h2>
              <div className="text-gray-400 leading-relaxed space-y-4 text-justify">
                <p>
                  ChantiPay est une application web de gestion de devis destinée aux
                  artisans et professionnels du bâtiment. Le service permet notamment :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 marker:text-orange-500">
                  <li>La création et la gestion de fiches clients</li>
                  <li>La création, l&apos;édition et l&apos;envoi de devis professionnels</li>
                  <li>La génération de devis au format PDF</li>
                  <li>La signature électronique des devis par les clients</li>
                  <li>Le suivi des acomptes et paiements</li>
                  <li>L&apos;assistance à la rédaction par intelligence artificielle</li>
                </ul>
              </div>
            </section>

            {/* Article 4 - Obligations de l'utilisateur */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Article 4 - Obligations de l&apos;utilisateur</h2>
              <div className="text-gray-400 leading-relaxed space-y-4 text-justify">
                <p>L&apos;utilisateur s&apos;engage à :</p>
                <ul className="list-disc list-inside space-y-2 ml-4 marker:text-orange-500">
                  <li>Utiliser le service conformément à sa destination et aux lois en vigueur</li>
                  <li>Fournir des informations exactes et les maintenir à jour</li>
                  <li>Préserver la confidentialité de ses identifiants de connexion</li>
                  <li>Ne pas utiliser le service à des fins frauduleuses ou illicites</li>
                  <li>Respecter les droits de propriété intellectuelle</li>
                  <li>Ne pas tenter de porter atteinte à la sécurité du service</li>
                </ul>
                <p>
                  L&apos;utilisateur est seul responsable du contenu qu&apos;il crée sur la
                  plateforme (devis, informations clients, etc.).
                </p>
              </div>
            </section>

            {/* Article 5 - Abonnements et facturation */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Article 5 - Abonnements et facturation</h2>
              <div className="text-gray-400 leading-relaxed space-y-4 text-justify">
                <p>ChantiPay propose différentes formules d&apos;abonnement :</p>
                <ul className="list-disc list-inside space-y-2 ml-4 marker:text-orange-500">
                  <li><strong className="text-white">Gratuit :</strong> Accès limité aux fonctionnalités de base</li>
                  <li><strong className="text-white">Artisan :</strong> Fonctionnalités avancées pour les artisans individuels</li>
                  <li><strong className="text-white">Pro :</strong> Toutes les fonctionnalités pour les entreprises</li>
                </ul>
                <p>
                  Les paiements sont gérés de manière sécurisée via Stripe. L&apos;utilisateur
                  peut gérer son abonnement (modification, résiliation) depuis son espace
                  de facturation dans l&apos;application.
                </p>
                <p>
                  Les abonnements sont renouvelés automatiquement à leur échéance, sauf
                  résiliation effectuée par l&apos;utilisateur avant la date de renouvellement.
                </p>
              </div>
            </section>

            {/* Article 6 - Disponibilité */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Article 6 - Disponibilité du service</h2>
              <div className="text-gray-400 leading-relaxed space-y-4 text-justify">
                <p>
                  ChantiPay s&apos;efforce d&apos;assurer une disponibilité optimale du service
                  24h/24, 7j/7. Toutefois, l&apos;accès peut être temporairement interrompu
                  pour des opérations de maintenance, des mises à jour ou en cas de
                  force majeure.
                </p>
                <p>
                  ChantiPay ne saurait être tenu responsable des interruptions de
                  service indépendantes de sa volonté.
                </p>
              </div>
            </section>

            {/* Article 7 - Responsabilité */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Article 7 - Responsabilité</h2>
              <div className="text-gray-400 leading-relaxed space-y-4 text-justify">
                <p>
                  ChantiPay met en œuvre tous les moyens raisonnables pour assurer
                  un service de qualité. Cependant, la responsabilité de ChantiPay
                  ne saurait être engagée :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 marker:text-orange-500">
                  <li>En cas d&apos;utilisation non conforme du service par l&apos;utilisateur</li>
                  <li>En cas de perte de données due à une négligence de l&apos;utilisateur</li>
                  <li>En cas de dommages indirects ou consécutifs</li>
                  <li>Pour le contenu créé par les utilisateurs</li>
                </ul>
                <p>
                  L&apos;utilisateur est seul responsable de la conformité de ses devis
                  avec la législation applicable à son activité.
                </p>
              </div>
            </section>

            {/* Article 8 - Propriété intellectuelle */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Article 8 - Propriété intellectuelle</h2>
              <div className="text-gray-400 leading-relaxed space-y-4 text-justify">
                <p>
                  L&apos;ensemble des éléments constituant le service ChantiPay (textes,
                  graphismes, logiciels, marques, logos) sont la propriété exclusive
                  de {LEGAL_ENTITY.companyName} et sont protégés par les lois françaises
                  et internationales sur la propriété intellectuelle.
                </p>
                <p>
                  L&apos;utilisateur conserve la propriété intellectuelle sur les contenus
                  qu&apos;il crée via le service.
                </p>
              </div>
            </section>

            {/* Article 9 - Protection des données */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Article 9 - Protection des données</h2>
              <div className="text-gray-400 leading-relaxed space-y-4 text-justify">
                <p>
                  ChantiPay collect et traite des données personnelles conformément
                  au Règlement Général sur la Protection des Données (RGPD) et à la
                  loi Informatique et Libertés.
                </p>
                <p>
                  Pour plus d&apos;informations, consultez notre{" "}
                  <Link href="/politique-confidentialite" className="text-orange-400 hover:underline">
                    Politique de Confidentialité
                  </Link>.
                </p>
              </div>
            </section>

            {/* Article 10 - Contact */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Article 10 - Contact</h2>
              <div className="text-gray-400 leading-relaxed space-y-4 text-justify">
                <p>
                  Pour toute question relative aux présentes CGU, vous pouvez nous contacter :
                </p>
                <ul className="list-none space-y-1 ml-4 mt-2">
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
          <Link href="/cgu" className="text-orange-500 hover:text-orange-400 hover:underline">
            CGU
          </Link>
          <Link href="/politique-confidentialite" className="hover:text-gray-400 hover:underline">
            Politique de confidentialité
          </Link>
        </div>
      </div>
    </div>
  );
}
