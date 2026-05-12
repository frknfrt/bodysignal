"use client";

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 font-sans text-white overflow-hidden">
            {/* Arka plan dekoratif parlamalar - Hata durumu olduğu için Volatile turuncusu ve Plateau kırmızısı */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[30%] left-[20%] w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="text-center z-10">
                {/* Büyük 404 Numarası */}
                <h1 className="text-[150px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-gray-700 to-transparent opacity-50">
                    404
                </h1>

                <div className="relative -mt-16">
                    <h2 className="text-3xl font-bold mb-4">Sinyal Kayboldu.</h2>
                    <p className="text-gray-400 max-w-md mx-auto mb-10">
                        Aradığın sayfa düşük frekansta kalmış veya tamamen silinmiş olabilir. Merak etme, ana kuleye geri dönebilirsin.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/"
                            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-all transform active:scale-95 shadow-lg shadow-green-900/20"
                        >
                            Ana Sayfaya Dön
                        </Link>

                        <button
                            onClick={() => window.history.back()}
                            className="px-8 py-3 bg-[#1a1a1a] border border-gray-700 hover:border-gray-500 text-white font-semibold rounded-lg transition-all"
                        >
                            Geri Git
                        </button>
                    </div>
                </div>

                {/* Küçük bir teknik dokunuş */}
                <div className="mt-20 flex justify-center gap-2 opacity-30">
                    <div className="w-1 h-8 bg-red-500 animate-pulse"></div>
                    <div className="w-1 h-12 bg-red-500 animate-pulse delay-75"></div>
                    <div className="w-1 h-6 bg-red-500 animate-pulse delay-150"></div>
                    <div className="w-1 h-10 bg-red-500 animate-pulse delay-100"></div>
                </div>
            </div>
        </div>
    );
}