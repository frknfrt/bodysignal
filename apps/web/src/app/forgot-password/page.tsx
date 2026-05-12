"use client";

import React from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 font-sans text-white">
            {/* Arka plan dekoratif parlama - Odaklanmayı artırmak için tek merkezli */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[150px]" />
            </div>

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-10">
                    <Link href="/" className="text-3xl font-bold tracking-tighter hover:opacity-80 transition-opacity">
                        BodySignal<span className="text-orange-500">.</span>
                    </Link>
                    <h2 className="text-xl font-semibold mt-6">Şifreni mi unuttun?</h2>
                    <p className="text-gray-400 mt-2 text-sm px-8">
                        Endişelenme, e-posta adresini girerek sana şifre sıfırlama bağlantısı göndermemizi isteyebilirsin.
                    </p>
                </div>

                <div className="bg-[#111111] border border-gray-800/50 p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
                    <form className="space-y-6">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Kayıtlı E-posta</label>
                            <input
                                type="email"
                                placeholder="ad@ornek.com"
                                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-lg transition-all transform active:scale-[0.98] shadow-lg shadow-orange-900/20"
                        >
                            Sıfırlama Bağlantısı Gönder
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <Link href="/login" className="text-sm text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Giriş sayfasına dön
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}