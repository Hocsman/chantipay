import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LEGAL_ENTITY } from '@/lib/legal'

export const metadata: Metadata = {
  title: 'Mentions légales - ChantiPay',
  description: 'Mentions légales du site ChantiPay',
}

export default function MentionsLegalesPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Mentions légales</h1>
        <p className="text-muted-foreground mb-8">
          Dernière mise à jour : {LEGAL_ENTITY.lastUpdate.mentions}
        </p>

        <div className="space-y-8">
          {/* Éditeur du site */}
          <section>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              1. Éditeur du site
            </h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                Le site <strong className="text-foreground">{LEGAL_ENTITY.serviceUrl}</strong> est édité par :
              </p>
              <ul className="list-none space-y-1 mt-4">
                <li><strong className="text-foreground">Raison sociale :</strong> {LEGAL_ENTITY.companyName}</li>
                <li><strong className="text-foreground">Forme juridique :</strong> {LEGAL_ENTITY.legalForm}</li>
                <li><strong className="text-foreground">Adresse :</strong> {LEGAL_ENTITY.address}, {LEGAL_ENTITY.postalCode} {LEGAL_ENTITY.city}, {LEGAL_ENTITY.country}</li>
                <li><strong className="text-foreground">Email :</strong> <a href={`mailto:${LEGAL_ENTITY.email}`} className="text-primary hover:underline">{LEGAL_ENTITY.email}</a></li>
                <li><strong className="text-foreground">Téléphone :</strong> {LEGAL_ENTITY.phone}</li>
                <li><strong className="text-foreground">SIRET :</strong> {LEGAL_ENTITY.siret}</li>
                <li><strong className="text-foreground">Directeur de la publication :</strong> {LEGAL_ENTITY.publisherName}</li>
              </ul>
            </div>
          </section>

          {/* Hébergeur */}
          <section>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              2. Hébergeur
            </h2>
            <div className="space-y-2 text-muted-foreground">
              <p>Le site est hébergé par :</p>
              <ul className="list-none space-y-1 mt-4">
                <li><strong className="text-foreground">Nom :</strong> {LEGAL_ENTITY.hostingProvider.name}</li>
                <li><strong className="text-foreground">Adresse :</strong> {LEGAL_ENTITY.hostingProvider.address}, {LEGAL_ENTITY.hostingProvider.city}, {LEGAL_ENTITY.hostingProvider.country}</li>
                <li><strong className="text-foreground">Site web :</strong> <a href={LEGAL_ENTITY.hostingProvider.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{LEGAL_ENTITY.hostingProvider.website}</a></li>
              </ul>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              3. Propriété intellectuelle
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                L&apos;ensemble du contenu de ce site (textes, images, graphismes, logo, icônes, 
                logiciels, etc.) est la propriété exclusive de {LEGAL_ENTITY.companyName} ou de 
                ses partenaires et est protégé par les lois françaises et internationales relatives 
                à la propriété intellectuelle.
              </p>
              <p>
                Toute reproduction, représentation, modification, publication, adaptation de tout ou 
                partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, 
                sauf autorisation écrite préalable de {LEGAL_ENTITY.companyName}.
              </p>
              <p>
                Toute exploitation non autorisée du site ou de son contenu sera considérée comme 
                constitutive d&apos;une contrefaçon et poursuivie conformément aux dispositions des 
                articles L.335-2 et suivants du Code de la Propriété Intellectuelle.
              </p>
            </div>
          </section>

          {/* Responsabilité */}
          <section>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              4. Limitation de responsabilité
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                {LEGAL_ENTITY.companyName} s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour 
                des informations diffusées sur ce site. Toutefois, {LEGAL_ENTITY.companyName} ne peut 
                garantir l&apos;exactitude, la précision ou l&apos;exhaustivité des informations mises à 
                disposition sur ce site.
              </p>
              <p>
                En conséquence, {LEGAL_ENTITY.companyName} décline toute responsabilité :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Pour toute imprécision, inexactitude ou omission portant sur des informations disponibles sur le site</li>
                <li>Pour tous dommages résultant d&apos;une intrusion frauduleuse d&apos;un tiers</li>
                <li>Pour tout dommage causé par l&apos;utilisation du site ou l&apos;impossibilité d&apos;y accéder</li>
              </ul>
            </div>
          </section>

          {/* Liens hypertextes */}
          <section>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              5. Liens hypertextes
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Le site peut contenir des liens hypertextes vers d&apos;autres sites. 
                {LEGAL_ENTITY.companyName} n&apos;exerce aucun contrôle sur ces sites et décline 
                toute responsabilité quant à leur contenu.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">
              6. Contact
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter :
              </p>
              <ul className="list-none space-y-1">
                <li><strong className="text-foreground">Par email :</strong> <a href={`mailto:${LEGAL_ENTITY.email}`} className="text-primary hover:underline">{LEGAL_ENTITY.email}</a></li>
                <li><strong className="text-foreground">Par courrier :</strong> {LEGAL_ENTITY.companyName}, {LEGAL_ENTITY.address}, {LEGAL_ENTITY.postalCode} {LEGAL_ENTITY.city}</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer links */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/cgu" className="hover:text-foreground transition-colors">
              Conditions Générales d&apos;Utilisation
            </Link>
            <Link href="/politique-confidentialite" className="hover:text-foreground transition-colors">
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
