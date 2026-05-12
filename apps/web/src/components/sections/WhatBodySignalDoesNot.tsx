"use client";

export default function WhatBodySignalDoesNot() {
    const olmayanlar = [
        "Hazır antrenman programı vermez",
        "Beslenme veya supplement tavsiye etmez",
        "Kişisel antrenörlük yapmaz",
        "Seni reklamlarla veya satışla darlamaz"
    ];

    return (
        <div className="p-10 bg-red-500/[0.02] border border-red-500/10 rounded-[2.5rem] hover:bg-red-500/[0.04] transition-colors group">
            <h3 className="text-xl font-black mb-8 uppercase italic flex items-center gap-3 text-zinc-300">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                BodySignal Ne Yapmaz?
            </h3>
            <ul className="space-y-4">
                {olmayanlar.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-zinc-500 font-medium group-hover:text-zinc-400 transition-colors">
                        <span className="text-red-500/50 mt-1 text-lg">✕</span>
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}