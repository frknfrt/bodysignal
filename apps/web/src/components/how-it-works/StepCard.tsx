"use client";

import { motion } from "framer-motion";

interface StepCardProps {
    title: string;
    description: string;
    stepNumber: string;
}

export default function StepCard({ title, description, stepNumber }: StepCardProps) {
    return (
        <motion.div
            whileHover={{ y: -5, borderColor: "rgba(34, 197, 94, 0.4)" }}
            className="rounded-3xl bg-white/5 border border-white/5 p-8 text-left transition-all relative group overflow-hidden"
        >
            {/* Arka plan numarası */}
            <span className="absolute -right-4 -top-6 text-9xl font-black text-white/[0.02] italic group-hover:text-green-500/[0.05] transition-colors">
        {stepNumber}
      </span>

            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6">
                <span className="text-green-500 font-bold text-xs">{stepNumber}</span>
            </div>

            <h4 className="text-xl font-bold mb-3 uppercase italic tracking-tight group-hover:text-green-500 transition-colors">
                {title}
            </h4>

            <p className="text-gray-500 text-sm leading-relaxed">
                {description}
            </p>

            {/* Hover anında çıkan alt çizgi */}
            <div className="absolute bottom-0 left-0 h-1 bg-green-500 w-0 group-hover:w-full transition-all duration-500" />
        </motion.div>
    );
}