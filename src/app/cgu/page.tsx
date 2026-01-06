"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LEGAL_ENTITY } from "@/lib/legal";

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l&apos;accueil
        </Link>

        <div className="bg-card rounded-lg shadow-sm p-6 md:p-8 space-y-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Conditions Générales d&apos;Utilisation
            </h1>
            <p className="text-sm text-muted-foreground">
              Dernière mise à jour : {LEGAL_ENTITY.lastUpdate.cgu}
            </p>
          </div>

          {/* Article 1 - Objet */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Article 1 - Objet
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Les présentes Conditions Générales d&apos;Utilisation (CGU) ont pour objet
              de définir les modalités et conditions d&apos;utilisation du service
              ChantiPay, accessible à l&apos;adresse{" "}
              <a
                href="https://www.chantipay.com"
                className="text-primary hover:underline"
              >
                www.chantipay.com
              </a>
              , ainsi que les droits et obligations des parties dans ce cadre.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              L&apos;inscription ou l&apos;utilisation du service implique l&apos;acceptation
              pleine et entière des présentes CGU.
            </p>
          </section>

          {/* Article 2 - Accès au service */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Article 2 - Accès au service
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Le service est accessible à toute personne physique ou morale
              disposant d&apos;une capacité juridique à contracter. L&apos;utilisateur
              déclare avoir plus de 18 ans et être habilité à utiliser le service
              dans le cadre de son activité professionnelle.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              L&apos;inscription nécessite de fournir des informations exactes et
              à jour, notamment : nom, prénom, adresse e-mail, et informations
              relatives à l&apos;entreprise (raison sociale, SIRET le cas échéant).
            </p>
          </section>

          {/* Article 3 - Description du service */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Article 3 - Description du service
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              ChantiPay est une application web de gestion de devis destinée aux
              artisans et professionnels du bâtiment. Le service permet notamment :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>La création et la gestion de fiches clients</li>
              <li>La création, l&apos;édition et l&apos;envoi de devis professionnels</li>
              <li>La génération de devis au format PDF</li>
              <li>La signature électronique des devis par les clients</li>
              <li>Le suivi des acomptes et paiements</li>
              <li>L&apos;assistance à la rédaction par intelligence artificielle</li>
            </ul>
          </section>

          {/* Article 4 - Obligations de l'utilisateur */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Article 4 - Obligations de l&apos;utilisateur
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              L&apos;utilisateur s&apos;engage à :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Utiliser le service conformément à sa destination et aux lois en vigueur</li>
              <li>Fournir des informations exactes et les maintenir à jour</li>
              <li>Préserver la confidentialité de ses identifiants de connexion</li>
              <li>Ne pas utiliser le service à des fins frauduleuses ou illicites</li>
              <li>Respecter les droits de propriété intellectuelle</li>
              <li>Ne pas tenter de porter atteinte à la sécurité du service</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              L&apos;utilisateur est seul responsable du contenu qu&apos;il crée sur la
              plateforme (devis, informations clients, etc.).
            </p>
          </section>

          {/* Article 5 - Abonnements et facturation */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Article 5 - Abonnements et facturation
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              ChantiPay propose différentes formules d&apos;abonnement :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Gratuit :</strong> Accès limité aux fonctionnalités de base</li>
              <li><strong>Artisan :</strong> Fonctionnalités avancées pour les artisans individuels</li>
              <li><strong>Pro :</strong> Toutes les fonctionnalités pour les entreprises</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Les paiements sont gérés de manière sécurisée via Stripe. L&apos;utilisateur
              peut gérer son abonnement (modification, résiliation) depuis son espace
              de facturation dans l&apos;application.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Les abonnements sont renouvelés automatiquement à leur échéance, sauf
              résiliation effectuée par l&apos;utilisateur avant la date de renouvellement.
            </p>
          </section>

          {/* Article 6 - Disponibilité du service */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Article 6 - Disponibilité du service
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              ChantiPay s&apos;efforce d&apos;assurer une disponibilité optimale du service
              24h/24, 7j/7. Toutefois, l&apos;accès peut être temporairement interrompu
              pour des opérations de maintenance, des mises à jour ou en cas de
              force majeure.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              ChantiPay ne saurait être tenu responsable des interruptions de
              service indépendantes de sa volonté.
            </p>
          </section>

          {/* Article 7 - Responsabilité */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Article 7 - Responsabilité
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              ChantiPay met en œuvre tous les moyens raisonnables pour assurer
              un service de qualité. Cependant, la responsabilité de ChantiPay
              ne saurait être engagée :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>En cas d&apos;utilisation non conforme du service par l&apos;utilisateur</li>
              <li>En cas de perte de données due à une négligence de l&apos;utilisateur</li>
              <li>En cas de dommages indirects ou consécutifs</li>
              <li>Pour le contenu créé par les utilisateurs</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              L&apos;utilisateur est seul responsable de la conformité de ses devis
              avec la législation applicable à son activité.
            </p>
          </section>

          {/* Article 8 - Propriété intellectuelle */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Article 8 - Propriété intellectuelle
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              L&apos;ensemble des éléments constituant le service ChantiPay (textes,
              graphismes, logiciels, marques, logos) sont la propriété exclusive
              de {LEGAL_ENTITY.companyName} et sont protégés par les lois françaises
              et internationales sur la propriété intellectuelle.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              L&apos;utilisateur conserve la propriété intellectuelle sur les contenus
              qu&apos;il crée via le service.
            </p>
          </section>

          {/* Article 9 - Protection des données */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Article 9 - Protection des données personnelles
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              ChantiPay collecte et traite des données personnelles conformément
              au Règlement Général sur la Protection des Données (RGPD) et à la
              loi Informatique et Libertés.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Pour plus d&apos;informations sur le traitement de vos données, veuillez
              consulter notre{" "}
              <Link
                href="/politique-confidentialite"
                className="text-blue-600 hover:underline"
              >
                Politique de Confidentialité
              </Link>
              .
            </p>
          </section>

          {/* Article 10 - Suspension et résiliation */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Article 10 - Suspension et résiliation
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              ChantiPay se réserve le droit de suspendre ou de résilier l&apos;accès
              au service en cas de :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Violation des présentes CGU</li>
              <li>Utilisation frauduleuse ou abusive du service</li>
              <li>Défaut de paiement</li>
              <li>Demande des autorités compétentes</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              L&apos;utilisateur peut à tout moment supprimer son compte et résilier
              son abonnement depuis les paramètres de son compte.
            </p>
          </section>

          {/* Article 11 - Modifications des CGU */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Article 11 - Modifications des CGU
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              ChantiPay se réserve le droit de modifier les présentes CGU à tout
              moment. Les utilisateurs seront informés des modifications par e-mail
              ou par notification dans l&apos;application.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              La poursuite de l&apos;utilisation du service après modification des CGU
              vaut acceptation des nouvelles conditions.
            </p>
          </section>

          {/* Article 12 - Droit applicable */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Article 12 - Droit applicable et juridiction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Les présentes CGU sont régies par le droit français. En cas de litige
              relatif à l&apos;interprétation ou l&apos;exécution des présentes, les parties
              s&apos;efforceront de trouver une solution amiable.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              À défaut d&apos;accord amiable, tout litige sera soumis aux tribunaux
              compétents du ressort de Paris.
            </p>
          </section>

          {/* Article 13 - Contact */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Article 13 - Contact
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Pour toute question relative aux présentes CGU, vous pouvez nous
              contacter :
            </p>
            <ul className="list-none text-muted-foreground space-y-1 ml-4">
              <li>
                <strong>Email :</strong>{" "}
                <a
                  href={`mailto:${LEGAL_ENTITY.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {LEGAL_ENTITY.email}
                </a>
              </li>
              <li>
                <strong>Adresse :</strong> {LEGAL_ENTITY.address}
              </li>
            </ul>
          </section>
        </div>

        {/* Footer navigation */}
        <div className="mt-8 text-center text-sm text-gray-500 space-x-4">
          <Link href="/mentions-legales" className="hover:text-gray-700 hover:underline">
            Mentions légales
          </Link>
          <span>•</span>
          <Link href="/politique-confidentialite" className="hover:text-gray-700 hover:underline">
            Politique de confidentialité
          </Link>
        </div>
      </div>
    </div>
  );
}
