"use client";

import { motion } from "framer-motion";
import StepCard from "./StepCard";

export default function HowItWorks() {
    const steps = [
        {
            title: "Veri Girişi",
            description: "Günlük performans ve biyometrik sinyallerini saniyeler içinde kaydet.",
            num: "01"
        },
        {
            title: "Sinyal Analizi",
            description: "AI motoru trendleri ve plato risklerini otomatik olarak hesaplasın.",
            num: "02"
        },
        {
            title: "Raporlama",
            description: "Gelişimini objektif verilerle gör ve antrenmanını optimize et.",
            num: "03"
        }
    ];

    return (
        /* id="nasil-calisir" ekledik, böylece Navbar bağlantısı burayı bulabilecek */
        <section id="nasil-calisir" className="py-24 text-center scroll-mt-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-16"
            >
                <span className="text-green-500 text-[10px] font-black uppercase tracking-[0.4em]">Süreç</span>
                <h3 className="text-4xl md:text-5xl font-black mt-2 uppercase italic tracking-tighter">
                    Nasıl <span className="text-green-500 not-italic">Çalışır?</span>
                </h3>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
                {steps.map((step, index) => (
                    <StepCard
                        key={index}
                        stepNumber={step.num}
                        title={step.title}
                        description={step.description}
                    />
                ))}
            </div>
        </section>
    );
}