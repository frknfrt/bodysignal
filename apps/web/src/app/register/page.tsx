"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from "@/lib/api";

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

function calcStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
    if (!pw) return { level: 0, label: '', color: '' };
    const long      = pw.length >= 8;
    const veryLong  = pw.length >= 12;
    const hasUpper  = /[A-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpec   = /[^A-Za-z0-9]/.test(pw);
    if (!long)                                          return { level: 1, label: 'Zayıf',  color: '#ef4444' };
    if (long && (hasNumber || hasUpper) && !hasSpec)    return { level: 2, label: 'Orta',   color: '#f59e0b' };
    if ((veryLong || hasSpec) && hasNumber && hasUpper) return { level: 3, label: 'Güçlü',  color: '#22c55e' };
    return { level: 2, label: 'Orta', color: '#f59e0b' };
}

export default function RegisterPage() {
    const router = useRouter();
    const { login } = useAuth();

    const [fullName, setFullName]   = useState('');
    const [email, setEmail]         = useState('');
    const [password, setPassword]   = useState('');
    const [confirm, setConfirm]     = useState('');
    const [showPw, setShowPw]       = useState(false);
    const [showCf, setShowCf]       = useState(false);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState('');
    const [success, setSuccess]     = useState(false);

    const strength = calcStrength(password);
    const mismatch = confirm.length > 0 && password !== confirm;
    const matched  = confirm.length > 0 && password === confirm;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirm) { setError('Şifreler eşleşmiyor'); return; }
        if (password.length < 6)  { setError('Şifre en az 6 karakter olmalı'); return; }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, password }),
            });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || 'Kayıt başarısız');
            }
            // Auto-login ve onboarding'e yönlendir
            const loginRes = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (loginRes.ok) {
                const loginData = await loginRes.json();
                login(loginData.user, loginData.token);
                router.push('/onboarding');
            } else {
                setSuccess(true);
                setTimeout(() => router.push('/login'), 1500);
            }
        } catch (err: any) {
            setError(err.message || 'Kayıt başarısız');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#060606] flex items-center justify-center px-4 py-12 font-sans text-white relative">
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
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/6 rounded-full blur-[140px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-green-500/8 rounded-full blur-[120px]" />
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
                    <p className="text-zinc-500 mt-3 text-sm">Vücudunun dilini çözmek için ilk adımı at.</p>
                </div>

                <div className="bg-[#0f0f0f] border border-white/5 p-8 rounded-3xl shadow-2xl">
                    <form className="space-y-5" onSubmit={handleSubmit}>

                        {/* Hata */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-sm font-medium p-4 rounded-2xl flex items-center gap-2">
                                <span className="text-red-500 shrink-0">✕</span>
                                {error}
                            </div>
                        )}

                        {/* Başarı */}
                        {success && (
                            <div className="bg-green-500/10 border border-green-500/25 text-green-400 text-sm font-medium p-4 rounded-2xl flex items-center gap-2">
                                <span className="shrink-0">✓</span>
                                Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...
                            </div>
                        )}

                        {/* Ad Soyad */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Ad Soyad</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                placeholder="Can Yılmaz"
                                required
                                className="w-full bg-[#111] border border-zinc-800 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:border-green-500 transition-all placeholder:text-zinc-700"
                            />
                        </div>

                        {/* E-posta */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">E-posta</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="can@ornek.com"
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
                                    placeholder="Minimum 6 karakter"
                                    required
                                    className="w-full bg-[#111] border border-zinc-800 rounded-xl px-4 py-3.5 pr-12 text-sm font-medium focus:outline-none focus:border-green-500 transition-all placeholder:text-zinc-700"
                                />
                                <button type="button" onClick={() => setShowPw(s => !s)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors">
                                    <EyeIcon open={showPw} />
                                </button>
                            </div>

                            {/* Şifre gücü göstergesi */}
                            {password && (
                                <div className="mt-2 space-y-1.5">
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                                                style={{ backgroundColor: strength.level >= i ? strength.color : '#27272a' }} />
                                        ))}
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest ml-0.5"
                                        style={{ color: strength.color }}>
                                        {strength.label}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Şifre Tekrar */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Şifre Tekrar</label>
                            <div className="relative">
                                <input
                                    type={showCf ? 'text' : 'password'}
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className={`w-full bg-[#111] border rounded-xl px-4 py-3.5 pr-12 text-sm font-medium focus:outline-none transition-all placeholder:text-zinc-700 ${
                                        mismatch ? 'border-red-500/50 focus:border-red-500' :
                                        matched  ? 'border-green-500/50 focus:border-green-500' :
                                                   'border-zinc-800 focus:border-green-500'
                                    }`}
                                />
                                <button type="button" onClick={() => setShowCf(s => !s)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors">
                                    <EyeIcon open={showCf} />
                                </button>
                            </div>
                            {mismatch && <p className="text-red-500 text-[10px] font-black uppercase ml-0.5">Şifreler eşleşmiyor</p>}
                            {matched  && <p className="text-green-500 text-[10px] font-black uppercase ml-0.5">✓ Şifreler eşleşiyor</p>}
                        </div>

                        <button type="submit" disabled={loading || success}
                            className="w-full bg-white text-black hover:bg-zinc-100 font-black py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg disabled:opacity-50 uppercase tracking-wider text-sm">
                            {loading ? 'Hesap Oluşturuluyor...' : 'Hesap Oluştur'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-zinc-500 text-sm">
                        Zaten üye misin?{' '}
                        <Link href="/login" className="text-green-500 hover:text-green-400 font-bold transition-colors">
                            Giriş yap.
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}