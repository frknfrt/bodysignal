"use client";
import { motion } from "framer-motion";

export default function DesignedForEveryBody() {
    return (
        <section className="py-32 text-center border-t border-white/5">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
            >
                <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-zinc-800 leading-none">
                    Her Vücut İçin <br />
                    <span className="text-white">Aynı Hassasiyet.</span>
                </h2>
                <p className="mt-6 text-zinc-500 font-medium tracking-widest uppercase text-xs">
                    Bodybuilder • Powerlifter • Endurance • Hybrid
                </p>
            </motion.div>
        </section>
    );
}