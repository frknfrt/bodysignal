"use client";

export default function WhatBodySignalDoes() {
    const ozellikler = [
        "Trendleri derinlemesine analiz eder",
        "Platoları bilimsel olarak tespit eder",
        "Performans değişkenliğini görselleştirir",
        "Sinyalleri objektif veriye dönüştürür"
    ];

    return (
        <div className="p-10 bg-green-500/[0.02] border border-green-500/10 rounded-[2.5rem] hover:bg-green-500/[0.04] transition-colors group">
            <h3 className="text-xl font-black mb-8 uppercase italic flex items-center gap-3">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                BodySignal Ne Yapar?
            </h3>
            <ul className="space-y-4">
                {ozellikler.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-zinc-400 font-medium group-hover:text-zinc-300 transition-colors">
                        <span className="text-green-500 mt-1 text-lg">✓</span>
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}