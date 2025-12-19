"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LEGAL_ENTITY } from "@/lib/legal";

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l&apos;accueil
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 space-y-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Politique de Confidentialité
            </h1>
            <p className="text-sm text-gray-500">
              Dernière mise à jour : {LEGAL_ENTITY.lastUpdate.privacy}
            </p>
          </div>

          {/* Introduction */}
          <section className="space-y-3">
            <p className="text-gray-600 leading-relaxed">
              La présente Politique de Confidentialité décrit comment {LEGAL_ENTITY.companyName}
              {" "}collecte, utilise et protège les données personnelles des utilisateurs
              du service ChantiPay, conformément au Règlement Général sur la Protection
              des Données (RGPD) et à la loi Informatique et Libertés.
            </p>
          </section>

          {/* Article 1 - Responsable du traitement */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">
              1. Responsable du traitement
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Le responsable du traitement des données personnelles est :
            </p>
            <ul className="list-none text-gray-600 space-y-1 ml-4">
              <li><strong>Société :</strong> {LEGAL_ENTITY.companyName}</li>
              <li><strong>Forme juridique :</strong> {LEGAL_ENTITY.legalForm}</li>
              <li><strong>Adresse :</strong> {LEGAL_ENTITY.address}</li>
              <li>
                <strong>Email :</strong>{" "}
                <a
                  href={`mailto:${LEGAL_ENTITY.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {LEGAL_ENTITY.email}
                </a>
              </li>
              <li><strong>SIRET :</strong> {LEGAL_ENTITY.siret}</li>
            </ul>
          </section>

          {/* Article 2 - Données collectées */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">
              2. Données personnelles collectées
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Dans le cadre de l&apos;utilisation de ChantiPay, nous collectons les
              données suivantes :
            </p>
            <h3 className="text-md font-medium text-gray-800 mt-4">
              Données d&apos;identification
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Nom et prénom</li>
              <li>Adresse e-mail</li>
              <li>Numéro de téléphone (optionnel)</li>
              <li>Raison sociale de l&apos;entreprise</li>
              <li>Numéro SIRET</li>
              <li>Adresse professionnelle</li>
            </ul>
            <h3 className="text-md font-medium text-gray-800 mt-4">
              Données de connexion
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Adresse IP</li>
              <li>Type de navigateur et système d&apos;exploitation</li>
              <li>Date et heure de connexion</li>
              <li>Pages consultées</li>
            </ul>
            <h3 className="text-md font-medium text-gray-800 mt-4">
              Données liées à l&apos;utilisation du service
            </h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
              <li>Informations des clients créés (nom, adresse, contact)</li>
              <li>Contenu des devis</li>
              <li>Signatures électroniques</li>
              <li>Historique des paiements et abonnements</li>
            </ul>
          </section>

          {/* Article 3 - Finalités */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">
              3. Finalités du traitement
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Vos données personnelles sont collectées pour les finalités suivantes :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Création et gestion de votre compte utilisateur</li>
              <li>Fourniture et amélioration du service ChantiPay</li>
              <li>Génération des devis et documents PDF</li>
              <li>Gestion des abonnements et de la facturation</li>
              <li>Communication relative au service (notifications, support)</li>
              <li>Respect de nos obligations légales et réglementaires</li>
              <li>Prévention de la fraude et sécurité du service</li>
              <li>Statistiques d&apos;utilisation (anonymisées)</li>
            </ul>
          </section>

          {/* Article 4 - Base légale */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">
              4. Base légale du traitement
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Le traitement de vos données repose sur les bases légales suivantes :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>
                <strong>Exécution du contrat :</strong> pour la fourniture du service
                et la gestion de votre compte
              </li>
              <li>
                <strong>Obligation légale :</strong> pour le respect de nos obligations
                comptables et fiscales
              </li>
              <li>
                <strong>Intérêt légitime :</strong> pour l&apos;amélioration de nos services
                et la prévention de la fraude
              </li>
              <li>
                <strong>Consentement :</strong> pour l&apos;envoi de communications marketing
                (si applicable)
              </li>
            </ul>
          </section>

          {/* Article 5 - Sous-traitants */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">
              5. Destinataires et sous-traitants
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Vos données peuvent être partagées avec les sous-traitants suivants,
              dans le cadre strict de la fourniture du service :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>
                <strong>Supabase :</strong> hébergement de la base de données et
                authentification (serveurs en Europe)
              </li>
              <li>
                <strong>Vercel :</strong> hébergement de l&apos;application web
              </li>
              <li>
                <strong>Stripe :</strong> traitement des paiements et facturation
              </li>
              <li>
                <strong>OpenAI :</strong> génération de contenu par intelligence
                artificielle (données anonymisées)
              </li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Ces sous-traitants sont contractuellement tenus de protéger vos données
              conformément au RGPD. Aucune donnée n&apos;est vendue à des tiers.
            </p>
          </section>

          {/* Article 6 - Durée de conservation */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">
              6. Durée de conservation
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Vos données personnelles sont conservées pendant les durées suivantes :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>
                <strong>Données du compte :</strong> pendant la durée de votre
                inscription, puis 3 ans après la suppression du compte
              </li>
              <li>
                <strong>Données de facturation :</strong> 10 ans (obligations légales
                comptables)
              </li>
              <li>
                <strong>Devis et documents :</strong> pendant la durée de votre
                inscription, puis 5 ans (prescription légale)
              </li>
              <li>
                <strong>Logs de connexion :</strong> 1 an
              </li>
            </ul>
          </section>

          {/* Article 7 - Sécurité */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">
              7. Sécurité des données
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Nous mettons en œuvre des mesures techniques et organisationnelles
              appropriées pour protéger vos données personnelles :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Chiffrement des données en transit (HTTPS/TLS)</li>
              <li>Chiffrement des données au repos</li>
              <li>Authentification sécurisée</li>
              <li>Accès restreint aux données sur la base du besoin d&apos;en connaître</li>
              <li>Sauvegardes régulières</li>
              <li>Surveillance et détection des intrusions</li>
            </ul>
          </section>

          {/* Article 8 - Droits */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">
              8. Vos droits
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Conformément au RGPD, vous disposez des droits suivants sur vos
              données personnelles :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>
                <strong>Droit d&apos;accès :</strong> obtenir une copie de vos données
              </li>
              <li>
                <strong>Droit de rectification :</strong> corriger des données inexactes
              </li>
              <li>
                <strong>Droit à l&apos;effacement :</strong> demander la suppression de
                vos données (&quot;droit à l&apos;oubli&quot;)
              </li>
              <li>
                <strong>Droit à la limitation :</strong> limiter le traitement de
                vos données
              </li>
              <li>
                <strong>Droit à la portabilité :</strong> recevoir vos données dans
                un format structuré
              </li>
              <li>
                <strong>Droit d&apos;opposition :</strong> vous opposer au traitement
                de vos données
              </li>
              <li>
                <strong>Droit de retirer votre consentement :</strong> à tout moment,
                sans affecter la licéité du traitement antérieur
              </li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Pour exercer ces droits, contactez-nous à l&apos;adresse :{" "}
              <a
                href={`mailto:${LEGAL_ENTITY.email}`}
                className="text-blue-600 hover:underline"
              >
                {LEGAL_ENTITY.email}
              </a>
            </p>
          </section>

          {/* Article 9 - Cookies */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">
              9. Cookies
            </h2>
            <p className="text-gray-600 leading-relaxed">
              ChantiPay utilise des cookies essentiels au fonctionnement du service :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>
                <strong>Cookies d&apos;authentification :</strong> pour maintenir votre
                session de connexion
              </li>
              <li>
                <strong>Cookies de préférences :</strong> pour mémoriser vos paramètres
              </li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Nous n&apos;utilisons pas de cookies publicitaires ou de tracking tiers.
            </p>
          </section>

          {/* Article 10 - Transferts internationaux */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">
              10. Transferts internationaux de données
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Certains de nos sous-traitants peuvent traiter des données en dehors
              de l&apos;Espace Économique Européen. Dans ce cas, nous nous assurons que
              des garanties appropriées sont en place :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Clauses contractuelles types de la Commission Européenne</li>
              <li>Certification au Data Privacy Framework (pour les transferts vers les USA)</li>
            </ul>
          </section>

          {/* Article 11 - Réclamations */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">
              11. Réclamations
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Si vous estimez que le traitement de vos données ne respecte pas la
              réglementation applicable, vous pouvez introduire une réclamation
              auprès de la Commission Nationale de l&apos;Informatique et des Libertés
              (CNIL) :
            </p>
            <ul className="list-none text-gray-600 space-y-1 ml-4">
              <li><strong>Site web :</strong>{" "}
                <a
                  href="https://www.cnil.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  www.cnil.fr
                </a>
              </li>
              <li><strong>Adresse :</strong> 3 Place de Fontenoy - TSA 80715 - 75334 PARIS CEDEX 07</li>
            </ul>
          </section>

          {/* Article 12 - Modifications */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">
              12. Modifications de la politique
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Nous pouvons mettre à jour cette Politique de Confidentialité à tout
              moment. Les modifications significatives seront notifiées par e-mail
              ou par notification dans l&apos;application.
            </p>
            <p className="text-gray-600 leading-relaxed">
              La date de dernière mise à jour est indiquée en haut de ce document.
            </p>
          </section>

          {/* Article 13 - Contact */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">
              13. Contact
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Pour toute question relative à cette Politique de Confidentialité
              ou pour exercer vos droits, contactez-nous :
            </p>
            <ul className="list-none text-gray-600 space-y-1 ml-4">
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
          <Link href="/cgu" className="hover:text-gray-700 hover:underline">
            CGU
          </Link>
        </div>
      </div>
    </div>
  );
}
