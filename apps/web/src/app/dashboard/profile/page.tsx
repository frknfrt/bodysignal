"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from "@/lib/api";

export default function ProfilePage() {
    const { user } = useAuth();
    const [isEditing, setIsEditing]       = useState(false);
    const [photoUrl, setPhotoUrl]         = useState<string | null>(null);
    const [history, setHistory]           = useState<any[]>([]);
    const [profile, setProfile]           = useState({
        age: '', height: '', targetWeight: '', currentWeight: '', activityLevel: 'Haftada 3-4 Gün',
        gender: '', goalType: '', weeklyWorkoutDays: '', experienceLevel: '', preferredWorkoutType: '',
    });
    const [saveOk, setSaveOk]             = useState(false);
    const [showPwChange, setShowPwChange] = useState(false);
    const [pwForm, setPwForm]             = useState({ current: '', next: '', confirm: '' });
    const [pwError, setPwError]           = useState('');
    const [pwSuccess, setPwSuccess]       = useState(false);
    const [pwLoading, setPwLoading]       = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Notification prefs
    const [notifEmail,   setNotifEmail]   = useState(true);
    const [notifWeekly,  setNotifWeekly]  = useState(false);
    const [notifPlateau, setNotifPlateau] = useState(true);

    useEffect(() => {
        const photo = localStorage.getItem('profilePhoto');
        if (photo) setPhotoUrl(photo);

        try {
            const prefs = JSON.parse(localStorage.getItem('notifPrefs') || '{}');
            if (prefs.email   != null) setNotifEmail(prefs.email);
            if (prefs.weekly  != null) setNotifWeekly(prefs.weekly);
            if (prefs.plateau != null) setNotifPlateau(prefs.plateau);
        } catch {}
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;
        Promise.all([
            fetch(`${API_URL}/api/analysis/history`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/api/user/profile`,     { headers: { Authorization: `Bearer ${token}` } }),
        ]).then(async ([histRes, profRes]) => {
            if (histRes.ok) setHistory(await histRes.json());
            if (profRes.ok) {
                const p = await profRes.json();
                setProfile({
                    age:                  p.age                  != null ? String(p.age)                  : '',
                    height:               p.height               != null ? String(p.height)               : '',
                    targetWeight:         p.targetWeight         != null ? String(p.targetWeight)         : '',
                    currentWeight:        p.currentWeight        != null ? String(p.currentWeight)        : '',
                    activityLevel:        p.activityLevel        ?? 'Haftada 3-4 Gün',
                    gender:               p.gender               ?? '',
                    goalType:             p.goalType             ?? '',
                    weeklyWorkoutDays:    p.weeklyWorkoutDays    != null ? String(p.weeklyWorkoutDays)    : '',
                    experienceLevel:      p.experienceLevel      ?? '',
                    preferredWorkoutType: p.preferredWorkoutType ?? '',
                });
            }
        }).catch(() => {});
    }, []);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const url = reader.result as string;
            setPhotoUrl(url);
            localStorage.setItem('profilePhoto', url);
        };
        reader.readAsDataURL(file);
    };

    const savePref = (key: string, value: boolean) => {
        const current = JSON.parse(localStorage.getItem('notifPrefs') || '{}');
        localStorage.setItem('notifPrefs', JSON.stringify({ ...current, [key]: value }));
    };

    const handleSaveProfile = async () => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`${API_URL}/api/user/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    age:                  profile.age               ? Number(profile.age)               : null,
                    height:               profile.height            ? Number(profile.height)            : null,
                    targetWeight:         profile.targetWeight      ? Number(profile.targetWeight)      : null,
                    currentWeight:        profile.currentWeight     ? Number(profile.currentWeight)     : null,
                    activityLevel:        profile.activityLevel     || null,
                    gender:               profile.gender            || null,
                    goalType:             profile.goalType          || null,
                    weeklyWorkoutDays:    profile.weeklyWorkoutDays ? Number(profile.weeklyWorkoutDays) : null,
                    experienceLevel:      profile.experienceLevel   || null,
                    preferredWorkoutType: profile.preferredWorkoutType || null,
                }),
            });
            setSaveOk(true);
            setTimeout(() => setSaveOk(false), 2500);
        } catch {}
        setIsEditing(false);
    };

    const handlePasswordChange = async () => {
        setPwError('');
        if (!pwForm.current) { setPwError('Mevcut şifreyi gir'); return; }
        if (pwForm.next !== pwForm.confirm) { setPwError('Yeni şifreler eşleşmiyor'); return; }
        if (pwForm.next.length < 6) { setPwError('Yeni şifre en az 6 karakter olmalı'); return; }
        const token = localStorage.getItem('token');
        setPwLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/user/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
            });
            if (!res.ok) { setPwError(await res.text() || 'Şifre değiştirilemedi'); return; }
            setPwSuccess(true);
            setTimeout(() => {
                setShowPwChange(false);
                setPwSuccess(false);
                setPwForm({ current: '', next: '', confirm: '' });
            }, 2000);
        } catch { setPwError('Bağlantı hatası'); }
        finally { setPwLoading(false); }
    };

    // Computed stats
    const totalSignals = history.length;
    const avgScore = history.length
        ? Math.round(history.reduce((s, h) => s + (h.recoveryScore ?? 0), 0) / history.length)
        : 0;
    const systemDays = (() => {
        if (history.length === 0) return 0;
        const oldest = [...history].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
        return Math.floor((Date.now() - new Date(oldest.createdAt).getTime()) / 86_400_000) + 1;
    })();

    const initial = user?.fullName?.charAt(0)?.toUpperCase() ?? '?';
    const scoreColor = avgScore >= 70 ? 'text-green-500' : avgScore >= 40 ? 'text-amber-400' : avgScore > 0 ? 'text-red-500' : 'text-zinc-400';

    return (
        <div className="min-h-screen bg-[#060606] text-white p-6 md:p-12 font-sans selection:bg-green-500/30">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4 border-b border-white/5 pb-10">
                    <div>
                        <span className="text-green-500 text-[10px] font-black uppercase tracking-[0.5em] mb-2 block">Biyometrik Kimlik</span>
                        <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
                            PROFİL <span className="text-white not-italic font-black">AYARLARI</span>
                        </h1>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => { setShowPwChange(v => !v); setPwError(''); setPwSuccess(false); }}
                            className={`px-6 py-3 rounded-2xl font-black uppercase italic text-xs tracking-widest transition-all ${showPwChange ? 'bg-zinc-800 text-white border border-zinc-600' : 'bg-[#111] border border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
                            ŞİFRE DEĞİŞTİR
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                            className={`px-8 py-3 rounded-2xl font-black uppercase italic text-xs tracking-widest transition-all ${isEditing ? 'bg-green-500 text-black shadow-[0_0_30px_#22c55e]' : 'bg-[#111] border border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
                            {isEditing ? 'DEĞİŞİKLİKLERİ KAYDET' : saveOk ? '✓ KAYDEDİLDİ' : 'PROFİLİ DÜZENLE'}
                        </motion.button>
                    </div>
                </div>

                {/* ŞİFRE DEĞİŞTİR PANELİ */}
                <AnimatePresence>
                    {showPwChange && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6">
                            <div className="bg-[#0f0f0f] border border-zinc-800 rounded-[2rem] p-8">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-6 italic">Şifre Değiştir</p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {[
                                        { label: 'Mevcut Şifre', key: 'current' },
                                        { label: 'Yeni Şifre',   key: 'next' },
                                        { label: 'Tekrar',       key: 'confirm' },
                                    ].map(f => (
                                        <div key={f.key} className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">{f.label}</label>
                                            <input type="password"
                                                value={pwForm[f.key as keyof typeof pwForm]}
                                                onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                                                onKeyDown={e => e.key === 'Enter' && handlePasswordChange()}
                                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold focus:border-green-500 outline-none transition-all" />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-4 mt-5">
                                    <button onClick={handlePasswordChange} disabled={pwLoading}
                                        className="px-8 py-2.5 bg-white text-black font-black uppercase italic text-xs rounded-xl hover:bg-zinc-100 transition-all disabled:opacity-50">
                                        {pwLoading ? '...' : 'ONAYLA →'}
                                    </button>
                                    {pwError   && <p className="text-red-500 text-[10px] font-black uppercase">{pwError}</p>}
                                    {pwSuccess  && <p className="text-green-500 text-[10px] font-black uppercase">✓ Şifre güncellendi</p>}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* SOL PANEL — Sinyal Kartı */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#0f0f0f] border-2 border-zinc-900 rounded-[3rem] p-10 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/20 to-transparent" />

                            {/* AVATAR + UPLOAD */}
                            <div className="relative w-32 h-32 mx-auto mb-6">
                                <div className="w-32 h-32 bg-zinc-900 border-4 border-zinc-800 rounded-full flex items-center justify-center text-5xl font-black italic text-green-500 overflow-hidden">
                                    {photoUrl
                                        ? <img src={photoUrl} alt="Profil" className="w-full h-full object-cover" />
                                        : <span>{initial}</span>}
                                </div>
                                <button onClick={() => fileInputRef.current?.click()}
                                    title="Fotoğraf yükle"
                                    className="absolute bottom-0 right-0 w-9 h-9 bg-green-500 rounded-full flex items-center justify-center text-black hover:bg-green-400 transition-colors shadow-lg">
                                    <CameraIcon />
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                            </div>

                            <h2 className="text-3xl font-black italic uppercase tracking-tighter">{user?.fullName ?? 'Kullanıcı'}</h2>
                            <p className="text-green-900 font-black text-[10px] uppercase tracking-[0.3em] mt-2 italic bg-green-500/5 py-1 px-4 rounded-full inline-block border border-green-500/10">Sinyal Aktif</p>
                            {user?.email && (
                                <p className="text-zinc-600 text-[9px] font-black uppercase tracking-widest mt-3">{user.email}</p>
                            )}

                            {/* 3 STAT */}
                            <div className="mt-10 pt-10 border-t border-white/5 grid grid-cols-3 gap-2">
                                <div className="text-center">
                                    <p className="text-[8px] text-zinc-600 uppercase font-black tracking-[0.15em] mb-1.5 leading-tight">Toplam<br/>Sinyal</p>
                                    <p className="font-black text-xl italic text-white leading-none">{totalSignals || '—'}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[8px] text-zinc-600 uppercase font-black tracking-[0.15em] mb-1.5 leading-tight flex items-center justify-center gap-0.5">
                                        Sistem<br/>Günü
                                        <Tooltip text="Sistemi kullandığın gün sayısı">
                                            <span className="text-zinc-700 cursor-default text-[10px] ml-0.5">ⓘ</span>
                                        </Tooltip>
                                    </p>
                                    <p className="font-black text-xl italic text-white leading-none">{systemDays || '—'}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[8px] text-zinc-600 uppercase font-black tracking-[0.15em] mb-1.5 leading-tight">Ort.<br/>Skor</p>
                                    <p className={`font-black text-xl italic leading-none ${scoreColor}`}>{avgScore || '—'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SAĞ PANEL */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-[#0f0f0f] border border-white/5 rounded-[3rem] p-8 md:p-12">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-10 italic">Biyometrik Parametreler</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                {([
                                    { label: 'Boy (cm)',          key: 'height',        placeholder: '180' },
                                    { label: 'Mevcut Kilo (kg)',  key: 'currentWeight', placeholder: '80'  },
                                    { label: 'Hedef Kilo (kg)',   key: 'targetWeight',  placeholder: '75'  },
                                    { label: 'Yaş',              key: 'age',           placeholder: '24'  },
                                ] as const).map(f => (
                                    <div key={f.key} className="space-y-3">
                                        <label className="block text-[10px] font-black text-zinc-500 tracking-widest uppercase ml-1 italic">{f.label}</label>
                                        <input type="number" disabled={!isEditing} placeholder={f.placeholder}
                                            value={profile[f.key]}
                                            onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                                            className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 focus:border-green-500 outline-none transition-all text-xl font-black italic disabled:opacity-30" />
                                    </div>
                                ))}

                                {/* Cinsiyet */}
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-zinc-500 tracking-widest uppercase ml-1 italic">Cinsiyet</label>
                                    <div className="flex gap-3">
                                        {['Erkek', 'Kadın'].map(g => (
                                            <button key={g} type="button" disabled={!isEditing}
                                                onClick={() => setProfile(p => ({ ...p, gender: g }))}
                                                className={`flex-1 py-3 rounded-2xl font-black uppercase text-xs tracking-widest border transition-all disabled:opacity-30 ${
                                                    profile.gender === g
                                                        ? 'bg-green-500/15 border-green-500 text-green-400'
                                                        : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-600'
                                                }`}>{g}</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Haftalık antrenman günü */}
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-zinc-500 tracking-widest uppercase ml-1 italic">
                                        Haftalık Antrenman{profile.weeklyWorkoutDays ? ` — ${profile.weeklyWorkoutDays} gün` : ''}
                                    </label>
                                    <input type="number" disabled={!isEditing} placeholder="3" min={1} max={7}
                                        value={profile.weeklyWorkoutDays}
                                        onChange={e => setProfile(p => ({ ...p, weeklyWorkoutDays: e.target.value }))}
                                        className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 focus:border-green-500 outline-none transition-all text-xl font-black italic disabled:opacity-30" />
                                </div>
                            </div>

                            {/* Hedefler & Deneyim */}
                            <div className="mt-8 pt-8 border-t border-white/5">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-6 italic">Hedefler & Deneyim</p>
                                <div className="space-y-5">
                                    {/* Ana Hedef */}
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-zinc-500 tracking-widest uppercase ml-1 italic">Ana Hedef</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['Kas Kazan', 'Yağ Yak', 'Performans Artır', 'Sağlıklı Kal'].map(g => (
                                                <button key={g} type="button" disabled={!isEditing}
                                                    onClick={() => setProfile(p => ({ ...p, goalType: g }))}
                                                    className={`py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest border transition-all disabled:opacity-30 ${
                                                        profile.goalType === g
                                                            ? 'bg-green-500/15 border-green-500 text-green-400'
                                                            : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-600'
                                                    }`}>{g}</button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Spor Geçmişi */}
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-zinc-500 tracking-widest uppercase ml-1 italic">Spor Geçmişi</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['Yeni Başlayan', 'Orta', 'İleri'].map(e => (
                                                <button key={e} type="button" disabled={!isEditing}
                                                    onClick={() => setProfile(p => ({ ...p, experienceLevel: e }))}
                                                    className={`py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest border transition-all disabled:opacity-30 ${
                                                        profile.experienceLevel === e
                                                            ? 'bg-green-500/15 border-green-500 text-green-400'
                                                            : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-600'
                                                    }`}>{e}</button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Antrenman Tipi */}
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-zinc-500 tracking-widest uppercase ml-1 italic">Tercih Ettiğin Antrenman</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['Güç', 'Hacim', 'Karışık'].map(t => (
                                                <button key={t} type="button" disabled={!isEditing}
                                                    onClick={() => setProfile(p => ({ ...p, preferredWorkoutType: t }))}
                                                    className={`py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest border transition-all disabled:opacity-30 ${
                                                        profile.preferredWorkoutType === t
                                                            ? 'bg-green-500/15 border-green-500 text-green-400'
                                                            : 'bg-black border-zinc-800 text-zinc-500 hover:border-zinc-600'
                                                    }`}>{t}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SİSTEM TERCİHLERİ */}
                            <div className="mt-10 pt-10 border-t border-white/5">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-6 italic">Sistem Tercihleri</p>
                                <div className="space-y-3">
                                    {([
                                        {
                                            key: 'email',
                                            label: 'E-posta Bildirimleri',
                                            sub: 'Haftalık analiz raporları',
                                            value: notifEmail,
                                            set: (v: boolean) => { setNotifEmail(v); savePref('email', v); },
                                        },
                                        {
                                            key: 'weekly',
                                            label: 'Haftalık Rapor Bildirimi',
                                            sub: 'Her pazartesi ilerleme özeti',
                                            value: notifWeekly,
                                            set: (v: boolean) => { setNotifWeekly(v); savePref('weekly', v); },
                                        },
                                        {
                                            key: 'plateau',
                                            label: 'Plateau Uyarısı',
                                            sub: 'Gelişim durduğunda dashboard\'da uyarı al',
                                            value: notifPlateau,
                                            set: (v: boolean) => { setNotifPlateau(v); savePref('plateau', v); },
                                        },
                                    ] as const).map(pref => (
                                        <div key={pref.key} className="flex items-center justify-between p-5 bg-black rounded-[1.5rem] border border-zinc-900 hover:border-zinc-800 transition-colors">
                                            <div>
                                                <p className="text-sm font-black uppercase italic tracking-tighter">{pref.label}</p>
                                                <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">{pref.sub}</p>
                                            </div>
                                            <Toggle checked={pref.value} onChange={pref.set} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
    const [visible, setVisible] = useState(false);
    return (
        <span className="relative inline-flex items-center"
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}>
            {children}
            <AnimatePresence>
                {visible && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-xl text-[10px] font-medium text-zinc-300 whitespace-nowrap z-50 pointer-events-none shadow-xl">
                        {text}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-700" />
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button type="button" onClick={() => onChange(!checked)}
            className={`shrink-0 w-12 h-6 rounded-full relative transition-colors duration-200 ${checked ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)]' : 'bg-zinc-800'}`}>
            <motion.div
                animate={{ x: checked ? 26 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
            />
        </button>
    );
}

function CameraIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    );
}
