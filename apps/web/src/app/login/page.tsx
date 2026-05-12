"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function isProfileComplete(user: any): boolean {
    return user?.height != null && user?.age != null;
}

function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
        </svg>
    ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    );
}

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw]     = useState(false);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!res.ok) throw new Error('E-posta veya şifre hatalı');
            const data = await res.json();
            login(data.user, data.token);
            router.push(isProfileComplete(data.user) ? '/dashboard' : '/onboarding');
        } catch (err: any) {
            setError(err.message || 'E-posta veya şifre hatalı');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#060606] flex items-center justify-center px-4 font-sans text-white relative">
            <style dangerouslySetInnerHTML={{ __html: `
                input:-webkit-autofill,
                input:-webkit-autofill:hover,
                input:-webkit-autofill:focus {
                    -webkit-box-shadow: 0 0 0 100px #111 inset !important;
                    -webkit-text-fill-color: white !important;
                    caret-color: white;
                }
            `}} />

            {/* Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-green-500/8 rounded-full blur-[140px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-500/6 rounded-full blur-[120px]" />
            </div>

            {/* Anasayfaya Dön */}
            <Link href="/"
                className="absolute top-8 left-8 flex items-center gap-2 text-zinc-600 hover:text-white transition-all group text-sm font-medium">
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Anasayfaya Dön
            </Link>

            <div className="w-full max-w-md z-10">

                {/* Logo */}
                <div className="text-center mb-10">
                    <Link href="/" className="text-3xl font-black tracking-tighter hover:opacity-80 transition-opacity">
                        BodySignal<span className="text-green-500">.</span>
                    </Link>
                    <p className="text-zinc-500 mt-3 text-sm">Vücut sinyallerini analiz etmek için geri dön.</p>
                </div>

                <div className="bg-[#0f0f0f] border border-white/5 p-8 rounded-3xl shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Hata mesajı */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm font-medium p-4 rounded-2xl flex items-center gap-2">
                                <span className="text-red-500 shrink-0">✕</span>
                                {error}
                            </div>
                        )}

                        {/* E-posta */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">E-posta</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="ornek@mail.com"
                                required
                                className="w-full bg-[#111] border border-zinc-800 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-green-500 transition-all placeholder:text-zinc-700"
                            />
                        </div>

                        {/* Şifre */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Şifre</label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-[#111] border border-zinc-800 rounded-xl px-4 py-3.5 pr-12 text-sm font-medium focus:outline-none focus:border-green-500 transition-all placeholder:text-zinc-700"
                                />
                                <button type="button" onClick={() => setShowPw(s => !s)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors">
                                    <EyeIcon open={showPw} />
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full bg-green-500 hover:bg-green-400 text-black font-black py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-green-900/20 disabled:opacity-50 uppercase tracking-wider text-sm">
                            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-zinc-500 text-sm">
                    Hesabın yok mu?{' '}
                    <Link href="/register" className="text-green-500 hover:text-green-400 font-bold transition-colors">
                        Hemen katıl.
                    </Link>
                </p>
            </div>
        </div>
    );
}