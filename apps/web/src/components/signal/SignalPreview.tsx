"use client";
import { motion } from "framer-motion";
import SignalCard from "./SignalCard";

export default function SignalPreview() {
    return (
        <section className="py-24">
            <div className="mb-12">
                <span className="text-green-500 text-[10px] font-black uppercase tracking-[0.4em]">Sinyal Sözlüğü</span>
                <h3 className="text-3xl md:text-5xl font-black mt-2 uppercase italic tracking-tighter">
                    SİNYAL <span className="text-green-500 not-italic">TİPLERİ.</span>
                </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <SignalCard
                    title="PLATO"
                    description="Gelişimin durduğu, adaptasyonun tamamlandığı sinyal."
                    type="plateau"
                />
                <SignalCard
                    title="STABİL"
                    description="Tutarlı ve kararlı performans çizgisi."
                    type="stable"
                />
                <SignalCard
                    title="POZİTİF"
                    description="Yukarı yönlü ivme ve artan güç kapasitesi."
                    type="positive"
                />
                <SignalCard
                    title="DEĞİŞKEN"
                    description="Yüksek sapma gösteren, düzensiz performans verisi."
                    type="volatile"
                />
            </div>
        </section>
    );
}