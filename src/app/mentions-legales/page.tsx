"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LEGAL_ENTITY } from "@/lib/legal";

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-orange-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none"></div>

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
              Mentions légales
            </h1>
            <p className="text-sm text-gray-500">
              Dernière mise à jour : {LEGAL_ENTITY.lastUpdate.mentions}
            </p>
          </div>

          {/* Éditeur du site */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 text-sm font-bold">1</span>
              Éditeur du site
            </h2>
            <div className="pl-11 space-y-2 text-gray-400 leading-relaxed">
              <p>
                Le site <strong className="text-white">{LEGAL_ENTITY.serviceUrl}</strong> est édité par :
              </p>
              <ul className="list-none space-y-2 mt-4 bg-white/5 rounded-lg p-6 border border-white/5">
                <li><strong className="text-white w-48 inline-block">Raison sociale :</strong> {LEGAL_ENTITY.companyName}</li>
                <li><strong className="text-white w-48 inline-block">Forme juridique :</strong> {LEGAL_ENTITY.legalForm}</li>
                <li><strong className="text-white w-48 inline-block">Adresse :</strong> {LEGAL_ENTITY.address}, {LEGAL_ENTITY.postalCode} {LEGAL_ENTITY.city}, {LEGAL_ENTITY.country}</li>
                <li><strong className="text-white w-48 inline-block">Email :</strong> <a href={`mailto:${LEGAL_ENTITY.email}`} className="text-orange-400 hover:underline">{LEGAL_ENTITY.email}</a></li>
                <li><strong className="text-white w-48 inline-block">SIRET :</strong> {LEGAL_ENTITY.siret}</li>
                <li><strong className="text-white w-48 inline-block">Directeur publication :</strong> {LEGAL_ENTITY.publisherName}</li>
              </ul>
            </div>
          </section>

          {/* Hébergeur */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 text-sm font-bold">2</span>
              Hébergeur
            </h2>
            <div className="pl-11 space-y-2 text-gray-400 leading-relaxed">
              <p>Le site est hébergé par :</p>
              <ul className="list-none space-y-2 mt-4 bg-white/5 rounded-lg p-6 border border-white/5">
                <li><strong className="text-white w-24 inline-block">Nom :</strong> {LEGAL_ENTITY.hostingProvider.name}</li>
                <li><strong className="text-white w-24 inline-block">Adresse :</strong> {LEGAL_ENTITY.hostingProvider.address}, {LEGAL_ENTITY.hostingProvider.city}, {LEGAL_ENTITY.hostingProvider.country}</li>
                <li><strong className="text-white w-24 inline-block">Site web :</strong> <a href={LEGAL_ENTITY.hostingProvider.website} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">{LEGAL_ENTITY.hostingProvider.website}</a></li>
              </ul>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 text-sm font-bold">3</span>
              Propriété intellectuelle
            </h2>
            <div className="pl-11 space-y-4 text-gray-400 leading-relaxed text-justify">
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
            </div>
          </section>

          {/* Responsabilité */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 text-sm font-bold">4</span>
              Limitation de responsabilité
            </h2>
            <div className="pl-11 space-y-4 text-gray-400 leading-relaxed text-justify">
              <p>
                {LEGAL_ENTITY.companyName} s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour
                des informations diffusées sur ce site. Toutefois, {LEGAL_ENTITY.companyName} ne peut
                garantir l&apos;exactitude, la précision ou l&apos;exhaustivité des informations mises à
                disposition sur ce site.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 text-sm font-bold">5</span>
              Contact
            </h2>
            <div className="pl-11 space-y-4 text-gray-400 leading-relaxed">
              <p>
                Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter :
              </p>
              <div className="flex gap-4 mt-4">
                <a href={`mailto:${LEGAL_ENTITY.email}`} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-white">
                  Par email
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Footer navigation */}
        <div className="mt-12 text-center text-sm text-gray-600 space-x-6">
          <Link href="/mentions-legales" className="text-orange-500 hover:text-orange-400 hover:underline">
            Mentions légales
          </Link>
          <Link href="/cgu" className="hover:text-gray-400 hover:underline">
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
