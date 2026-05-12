"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Container from "@/components/ui/Container";

export default function HakkimizdaPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <Navbar />

            <main className="py-24">
                <Container>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto"
                    >
                        {/* Başlık Bölümü */}
                        <div className="text-center mb-16">
                            <span className="text-green-500 text-[10px] font-black uppercase tracking-[0.4em]">Vizyonumuz</span>
                            <h1 className="text-5xl md:text-7xl font-black mt-4 uppercase italic tracking-tighter">
                                BİZ <span className="text-green-500 not-italic">KİMİZ?</span>
                            </h1>
                        </div>

                        {/* İçerik Kartları */}
                        <div className="space-y-12 text-zinc-400 leading-relaxed text-lg">
                            <section className="bg-white/5 p-8 md:p-12 rounded-[2.5rem] border border-white/5">
                                <h2 className="text-2xl font-bold text-white mb-6 uppercase italic tracking-tight">Felsefemiz</h2>
                                <p>
                                    BodySignal, karmaşık fitness dünyasında bir **navigasyon** görevi görmek için tasarlandı.
                                    Günümüzde sporcular binlerce farklı program, takviye ve koçluk sistemi arasında boğuluyor.
                                    Biz ise tek bir şeye odaklanıyoruz: **Vücudunun gönderdiği gerçek veriler.**
                                </p>
                            </section>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="p-8 border border-zinc-800 rounded-[2rem]">
                                    <h3 className="text-xl font-bold text-white mb-4 uppercase italic">Veri Odaklılık</h3>
                                    <p className="text-sm">
                                        Hislerle değil, matematiksel trendlerle hareket ediyoruz. Sinyallerini analiz ederek gelişimini bilimsel bir temele oturtuyoruz.
                                    </p>
                                </div>
                                <div className="p-8 border border-zinc-800 rounded-[2rem]">
                                    <h3 className="text-xl font-bold text-white mb-4 uppercase italic">Sade ve Net</h3>
                                    <p className="text-sm">
                                        Reklam yok, satış odaklı darlama yok. Sadece senin performansın ve gelişimini gösteren şeffaf bir arayüz var.
                                    </p>
                                </div>
                            </div>

                            <section className="text-center py-10">
                                <h2 className="text-2xl font-bold text-white mb-6 uppercase italic">Geleceğin Performans Analizi</h2>
                                <p>
                                    BodySignal ekibi olarak, her sporcunun kendi vücudunun dilini konuşabilmesi gerektiğine inanıyoruz.
                                    Sinyallerini dinle, gelişimini yönet.
                                </p>
                            </section>
                        </div>
                    </motion.div>
                </Container>
            </main>

            <Footer />
        </div>
    );
}