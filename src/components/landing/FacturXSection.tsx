'use client';

import { FileCode, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export function FacturXSection() {
    return (
        <section className="bg-slate-950 py-24 sm:py-32 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-orange-600/10 rounded-full blur-[100px] opacity-20 pointer-events-none" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-3xl mx-auto text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-900/30 border border-orange-500/30 text-orange-400 text-sm font-medium mb-6"
                    >
                        <AlertTriangle className="h-4 w-4" />
                        Obligatoire dès 2026
                    </motion.div>

                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
                        Passez à la facture électronique <span className="text-orange-500">sans effort</span>
                    </h2>
                    <p className="text-lg text-gray-400">
                        La réforme arrive. ChantiPay génère automatiquement des factures au format Factur-X conformes aux nouvelles normes. Ne changez rien à vos habitudes, on s'occupe de la technique.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition duration-300"
                    >
                        <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6">
                            <FileCode className="h-6 w-6 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-3">Format Hybride PDF+XML</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Vos factures restent lisibles pour vous (PDF) tout en contenant les données structurées pour les machines (XML). Le meilleur des deux mondes.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition duration-300"
                    >
                        <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-6">
                            <ShieldCheck className="h-6 w-6 text-orange-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-3">Conformité Totale</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Respect des normes européennes EN 16931. Nous mettons à jour l'outil automatiquement en fonction des évolutions légales.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition duration-300"
                    >
                        <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-6">
                            <TrendingUp className="h-6 w-6 text-green-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-3">Paiements Accélérés</h3>
                        <p className="text-gray-400 leading-relaxed">
                            Les factures électroniques sont traitées plus vite par les logiciels de vos clients pros et l'administration. Réduisez vos délais de paiement.
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
