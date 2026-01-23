'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const features = [
    {
        title: "Gérez vos chantiers depuis votre poche",
        description: "Plus besoin d'attendre le soir pour faire vos devis. Créez, modifiez et faites signer vos clients directement sur le chantier. Gagnez en réactivité et sécurisez vos affaires immédiatement.",
        image: "/images/landing/worker-on-site.jpg",
        points: [
            "Devis créés en 2 minutes chrono",
            "Signature électronique sur mobile",
            "Accès hors ligne disponible"
        ],
        reverse: false
    },
    {
        title: "Visibilité financière en temps réel",
        description: "Finissez-en avec le pilotage à l'aveugle. Suivez votre chiffre d'affaires, vos encaissements et vos relances depuis un tableau de bord clair et intuitif. Prenez les bonnes décisions pour votre entreprise.",
        image: "/images/landing/dashboard-tablet.png",
        points: [
            "Suivi CA et trésorerie",
            "Alertes impayés automatiques",
            "Statistiques par chantier"
        ],
        reverse: true
    },
    {
        title: "Paiements sécurisés & Traçabilité",
        description: "Sécurisez votre trésorerie avec des liens de paiement instantanés. Vos données et celles de vos clients sont chiffrées de bout en bout. Chaque transaction est tracée et sécurisée.",
        image: "/images/landing/security-schema.png",
        points: [
            "Acomptes par CB instantanés",
            "Chiffrement bancaire (AES-256)",
            "Conformité RGPD totale"
        ],
        reverse: false
    },
    {
        title: "Coordination simplifiée multi-acteurs",
        description: "Travaillez efficacement en équipe. Partagez l'accès aux dossiers, assignez des tâches et gardez tout le monde synchronisé. Idéal pour les petites équipes et la sous-traitance.",
        image: "/images/landing/team-meeting.png",
        points: [
            "Accès multi-utilisateurs",
            "Partage de documents",
            "Historique des actions"
        ],
        reverse: true
    }
];

export function FeatureSection() {
    return (
        <section className="bg-white py-24 sm:py-32 overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                <div className="text-center mb-24">
                    <h2 className="text-base font-semibold text-orange-600 tracking-wide uppercase">Pourquoi ChantiPay ?</h2>
                    <p className="mt-2 text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
                        Tout ce dont vous avez besoin,<br />
                        <span className="relative inline-block">
                            <span className="relative z-10">sans le superflu.</span>
                            <span className="absolute bottom-2 left-0 w-full h-4 bg-orange-100 -z-0 transform -rotate-2"></span>
                        </span>
                    </p>
                </div>

                <div className="space-y-24 sm:space-y-32">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                            className={cn(
                                "flex flex-col gap-12 lg:gap-24 items-center",
                                feature.reverse ? "lg:flex-row-reverse" : "lg:flex-row"
                            )}
                        >
                            {/* Image Side */}
                            <div className="flex-1 w-full relative group">
                                <div className={cn(
                                    "absolute -inset-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition duration-500",
                                    feature.reverse ? "rotate-2" : "-rotate-2"
                                )}></div>
                                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-100 bg-white">
                                    <Image
                                        src={feature.image}
                                        alt={feature.title}
                                        width={800}
                                        height={600}
                                        className="w-full h-auto object-cover transform group-hover:scale-105 transition duration-700"
                                    />
                                </div>
                            </div>

                            {/* Text Side */}
                            <div className="flex-1 w-full space-y-8">
                                <h3 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                                    {feature.title}
                                </h3>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>
                                <ul className="space-y-4">
                                    {feature.points.map((point, idx) => (
                                        <li key={idx} className="flex items-center gap-3">
                                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center">
                                                <Check className="h-4 w-4 text-orange-600" />
                                            </div>
                                            <span className="text-gray-700 font-medium">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
