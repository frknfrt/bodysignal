"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from "@/lib/api";

// ─── Password strength ────────────────────────────────────────────────────────

function calcStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
    if (!pw) return { level: 0, label: '', color: '' };
    const long      = pw.length >= 8;
    const veryLong  = pw.length >= 12;
    const hasUpper  = /[A-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpec   = /[^A-Za-z0-9]/.test(pw);
    if (!long)                                              return { level: 1, label: 'Zayıf',  color: '#ef4444' };
    if (long && (hasNumber || hasUpper) && !hasSpec)        return { level: 2, label: 'Orta',   color: '#f59e0b' };
    if ((veryLong || hasSpec) && hasNumber && hasUpper)     return { level: 3, label: 'Güçlü',  color: '#22c55e' };
    return { level: 2, label: 'Orta', color: '#f59e0b' };
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
    ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
    );
}

function PwField({ label, value, onChange, placeholder = '••••••••' }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
    const [show, setShow] = useState(false);
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-600 tracking-widest uppercase italic ml-1">{label}</label>
            <div className="relative">
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-black border border-zinc-900 rounded-2xl px-5 py-4 pr-12 focus:border-red-500 outline-none transition-all text-lg font-bold"
                />
                <button type="button" onClick={() => setShow(s => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors">
                    <EyeIcon open={show} />
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
    const { logout } = useAuth();

    // Password form
    const [pw, setPw]           = useState({ current: '', next: '', confirm: '' });
    const [pwError, setPwError] = useState('');
    const [pwOk, setPwOk]       = useState(false);
    const [pwLoading, setPwLoading] = useState(false);

    // Delete account modal
    const [showDelete, setShowDelete]   = useState(false);
    const [deleteInput, setDeleteInput] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Export loading
    const [exportLoading, setExportLoading] = useState<'json' | 'csv' | null>(null);

    const strength = calcStrength(pw.next);

    const handlePasswordChange = async () => {
        setPwError(''); setPwOk(false);
        if (!pw.current)                  { setPwError('Mevcut şifreyi gir'); return; }
        if (pw.next.length < 6)           { setPwError('Yeni şifre en az 6 karakter olmalı'); return; }
        if (pw.next !== pw.confirm)       { setPwError('Yeni şifreler eşleşmiyor'); return; }
        const token = localStorage.getItem('token');
        setPwLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/user/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
            });
            if (!res.ok) { setPwError(await res.text() || 'Şifre değiştirilemedi'); return; }
            setPwOk(true);
            setPw({ current: '', next: '', confirm: '' });
            setTimeout(() => setPwOk(false), 3000);
        } catch { setPwError('Bağlantı hatası'); }
        finally { setPwLoading(false); }
    };

    const fetchHistory = useCallback(async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/analysis/history`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Veri alınamadı');
        return res.json() as Promise<any[]>;
    }, []);

    const handleExportJSON = async () => {
        setExportLoading('json');
        try {
            const data = await fetchHistory();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `bodysignal-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch { alert('Dışa aktarım başarısız'); }
        finally { setExportLoading(null); }
    };

    const handleExportCSV = async () => {
        setExportLoading('csv');
        try {
            const data = await fetchHistory();
            const headers = 'Tarih,Toparlanma Skoru,Uyku (saat),Ort. RPE,Egzersiz Sayısı,Toplam Hacim (kg),Maks. Ağırlık (kg)';
            const rows = data.map(h => {
                const date = h.createdAt ? new Date(h.createdAt).toLocaleString('tr-TR') : '';
                return [
                    `"${date}"`,
                    h.recoveryScore ?? '',
                    h.sleepHours   ?? '',
                    h.avgRpe       ?? '',
                    h.exerciseCount ?? '',
                    h.totalVolume  != null ? Math.round(h.totalVolume) : '',
                    h.maxWeight    ?? '',
                ].join(',');
            });
            const csv  = [headers, ...rows].join('\n');
            const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `bodysignal-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch { alert('Dışa aktarım başarısız'); }
        finally { setExportLoading(null); }
    };

    const handleDeleteAccount = async () => {
        if (deleteInput !== 'HESABI SİL') { setDeleteError('"HESABI SİL" yazmanız gerekiyor'); return; }
        const token = localStorage.getItem('token');
        setDeleteLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/user/account`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) { setDeleteError(await res.text() || 'Silme başarısız'); setDeleteLoading(false); return; }
            localStorage.clear();
            logout();
        } catch { setDeleteError('Bağlantı hatası'); setDeleteLoading(false); }
    };

    return (
        <div className="min-h-screen bg-[#060606] text-white p-6 md:p-12 font-sans selection:bg-red-500/30">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">

                <header className="mb-12 border-b border-white/5 pb-10">
                    <span className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.5em] mb-2 block italic">Sistem Yapılandırması</span>
                    <h1 className="text-5xl font-black italic uppercase tracking-tighter">AYARLAR</h1>
                </header>

                {/* ── GÜVENLİK PROTOKOLÜ ── */}
                <section className="bg-[#0f0f0f] border border-white/5 rounded-[3rem] p-10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500 mb-10 italic flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        Güvenlik Protokolü
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
                        <PwField label="Mevcut Şifre"    value={pw.current}  onChange={v => setPw(p => ({ ...p, current: v }))} />
                        <PwField label="Yeni Şifre"      value={pw.next}     onChange={v => setPw(p => ({ ...p, next: v }))} />
                        <PwField label="Yeni Şifre Tekrar" value={pw.confirm} onChange={v => setPw(p => ({ ...p, confirm: v }))} />
                    </div>

                    {/* Şifre gücü göstergesi */}
                    <AnimatePresence>
                        {pw.next && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden mt-5 max-w-3xl">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1 flex-1">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                                                style={{ backgroundColor: strength.level >= i ? strength.color : '#27272a' }} />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest shrink-0"
                                        style={{ color: strength.color }}>
                                        {strength.label}
                                    </span>
                                </div>
                                {pw.confirm && pw.next !== pw.confirm && (
                                    <p className="text-red-500 text-[10px] font-black uppercase mt-2">Şifreler eşleşmiyor</p>
                                )}
                                {pw.confirm && pw.next === pw.confirm && (
                                    <p className="text-green-500 text-[10px] font-black uppercase mt-2">✓ Şifreler eşleşiyor</p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center gap-4 mt-8">
                        <button onClick={handlePasswordChange} disabled={pwLoading}
                            className="bg-white text-black px-10 py-4 rounded-2xl text-[11px] font-black uppercase italic tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-50">
                            {pwLoading ? '...' : 'Şifreyi Güncelle'}
                        </button>
                        {pwError && <p className="text-red-500 text-[11px] font-black uppercase">{pwError}</p>}
                        {pwOk    && <p className="text-green-500 text-[11px] font-black uppercase">✓ Şifre güncellendi</p>}
                    </div>
                </section>

                {/* ── VERİ TERMİNALİ ── */}
                <section className="bg-[#0f0f0f] border border-white/5 rounded-[3rem] p-10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 mb-10 italic">Veri Terminali</h3>

                    <div className="space-y-4">
                        {/* JSON dışa aktarım */}
                        <div className="flex items-center justify-between p-6 bg-black rounded-[2.5rem] border border-zinc-900 hover:border-zinc-700 transition-all">
                            <div>
                                <p className="text-sm font-black uppercase italic tracking-tighter">Veri Dışa Aktarımı</p>
                                <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1 italic tracking-widest">Tüm Sinyal Geçmişi (JSON)</p>
                            </div>
                            <button onClick={handleExportJSON} disabled={exportLoading === 'json'}
                                className="text-green-500 text-[10px] font-black uppercase tracking-widest bg-green-500/5 px-6 py-3 rounded-xl border border-green-500/10 hover:bg-green-500 hover:text-black transition-all disabled:opacity-50">
                                {exportLoading === 'json' ? '...' : 'JSON İndir'}
                            </button>
                        </div>

                        {/* CSV dışa aktarım */}
                        <div className="flex items-center justify-between p-6 bg-black rounded-[2.5rem] border border-zinc-900 hover:border-zinc-700 transition-all">
                            <div>
                                <p className="text-sm font-black uppercase italic tracking-tighter">Veri Dışa Aktarımı</p>
                                <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1 italic tracking-widest">Tüm Sinyal Geçmişi (CSV)</p>
                            </div>
                            <button onClick={handleExportCSV} disabled={exportLoading === 'csv'}
                                className="text-green-500 text-[10px] font-black uppercase tracking-widest bg-green-500/5 px-6 py-3 rounded-xl border border-green-500/10 hover:bg-green-500 hover:text-black transition-all disabled:opacity-50">
                                {exportLoading === 'csv' ? '...' : 'CSV İndir'}
                            </button>
                        </div>

                        {/* Hesabı kapat */}
                        <div className="flex items-center justify-between p-6 bg-red-500/5 rounded-[2.5rem] border border-red-500/10">
                            <div>
                                <p className="text-sm font-black uppercase italic tracking-tighter text-red-500">Sistemden Ayrıl</p>
                                <p className="text-[10px] text-red-900/50 font-bold uppercase mt-1 italic">Tüm veriler kalıcı olarak silinir</p>
                            </div>
                            <button onClick={() => { setShowDelete(true); setDeleteInput(''); setDeleteError(''); }}
                                className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-500/10 px-6 py-3 rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                                Hesabı Kapat
                            </button>
                        </div>
                    </div>
                </section>

            </motion.div>

            {/* ── HESAP SİLME MODALI ── */}
            <AnimatePresence>
                {showDelete && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                        onClick={e => { if (e.target === e.currentTarget) setShowDelete(false); }}>
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[#0f0f0f] border border-red-500/20 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl">

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500">Tehlikeli İşlem</p>
                            </div>

                            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2">Hesabı Sil</h2>
                            <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-8">
                                Bu işlem geri alınamaz. Tüm sinyal geçmişin, analizlerin ve biyometrik verilerin kalıcı olarak silinecek.
                            </p>

                            <div className="space-y-3 mb-6">
                                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1 block">
                                    Onaylamak için <span className="text-red-400">HESABI SİL</span> yazın
                                </label>
                                <input
                                    value={deleteInput}
                                    onChange={e => { setDeleteInput(e.target.value); setDeleteError(''); }}
                                    placeholder="HESABI SİL"
                                    className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-sm font-black uppercase focus:border-red-500 outline-none transition-all placeholder:text-zinc-800"
                                />
                                {deleteError && (
                                    <p className="text-red-500 text-[10px] font-black uppercase ml-1">{deleteError}</p>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setShowDelete(false)}
                                    className="flex-1 py-3 rounded-2xl font-black uppercase italic text-xs tracking-widest bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all">
                                    İptal
                                </button>
                                <button onClick={handleDeleteAccount} disabled={deleteLoading || deleteInput !== 'HESABI SİL'}
                                    className="flex-1 py-3 rounded-2xl font-black uppercase italic text-xs tracking-widest bg-red-600 text-white hover:bg-red-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                                    {deleteLoading ? '...' : 'Kalıcı Olarak Sil'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
