'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function HeroSection() {
    return (
        <section className="relative overflow-hidden bg-black text-white pt-20 pb-32 lg:pt-32 lg:pb-48">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-orange-600/10 rounded-full blur-[120px] opacity-30 translate-x-1/3 -translate-y-1/4" />
            <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[100px] opacity-20 -translate-x-1/3 translate-y-1/4" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">

                <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">

                    {/* Left Column: Text Content */}
                    <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-orange-400 backdrop-blur-md"
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                            Prêt pour la facture électronique
                        </motion.div>

                        {/* Title */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="mb-6 text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl"
                        >
                            Un <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">outil</span> nouvelle génération.
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="mb-10 max-w-2xl text-lg text-gray-400 sm:text-xl font-light leading-relaxed"
                        >
                            Créer vos devis et factures conformes en quelques secondes. Paiements encaissés instantanément.
                            <span className="block mt-2 text-white font-medium">La solution tout-en-un pour les pros qui veulent avancer.</span>
                        </motion.p>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex flex-col gap-4 w-full sm:w-auto sm:flex-row"
                        >
                            <Link href="/register" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold bg-orange-600 hover:bg-orange-500 text-white border-0 shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] transition-all duration-300">
                                    Commencer gratuitement
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="/demo" className="w-full sm:w-auto">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg bg-transparent text-white border-white/20 hover:bg-white/10 hover:text-white backdrop-blur-sm transition-all duration-300">
                                    Voir la démo
                                </Button>
                            </Link>
                        </motion.div>

                        {/* Trust badges */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="mt-8 flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-gray-400"
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-orange-500" />
                                <span>7 jours d'essai gratuit</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-orange-500" />
                                <span>Annulation à tout moment</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Devices Image */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="relative hidden lg:block"
                    >
                        <div className="relative z-10 transform hover:scale-[1.02] transition-transform duration-500">
                            {/* Glow effect behind devices */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-orange-500/20 rounded-full blur-[60px] -z-10"></div>

                            <Image
                                src="/images/hero-devices-v3.png"
                                alt="Applications ChantiPay sur smartphone et laptop"
                                width={800}
                                height={600}
                                className="w-full h-auto object-contain drop-shadow-2xl mx-auto"
                                priority
                            />
                        </div>
                    </motion.div>

                </div>

                {/* Bottom Image: Dashboard (Restored) */}
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="mx-auto max-w-6xl relative z-20 hidden md:block"
                >
                    <div className="relative rounded-xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm shadow-2xl group">
                        <div className="overflow-hidden rounded-lg bg-black border border-white/5">
                            <Image
                                src="/images/landing/dashboard-hero.png"
                                alt="Interface Dashboard ChantiPay"
                                width={1400}
                                height={900}
                                className="w-full h-auto transform group-hover:scale-[1.01] transition duration-700"
                                priority
                            />
                        </div>
                        {/* Glow effect under the image */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur-lg opacity-20 -z-10 transition duration-700 group-hover:opacity-40"></div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
