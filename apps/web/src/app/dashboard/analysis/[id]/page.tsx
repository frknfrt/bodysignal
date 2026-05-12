"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
    POSITIVE: {
        hex: "#22c55e", text: "text-green-500", bg: "bg-green-500/8", border: "border-green-500/25", dot: "bg-green-500",
        action: "YÜKLEME YAP", actionSub: "Kasların güçlü, sinir sisteminle uyumlu — bugün antrenmanı zorlaştır.", actionIcon: "↑",
    },
    STABLE: {
        hex: "#f59e0b", text: "text-amber-400", bg: "bg-amber-400/8", border: "border-amber-400/25", dot: "bg-amber-400",
        action: "DEVAM ET", actionSub: "Tempo iyi. Mevcut programını sürdür, büyük değişiklik yapma.", actionIcon: "→",
    },
    PLATEAU: {
        hex: "#ef4444", text: "text-red-500", bg: "bg-red-500/8", border: "border-red-500/25", dot: "bg-red-500",
        action: "DİNLEN", actionSub: "Vücudun toparlanmaya ihtiyaç duyuyor. Bugün aktif dinlenme veya deload yap.", actionIcon: "↓",
    },
};

const METRIC_INFO: Record<string, { label: string; explain: (v: any) => string; unit: string; good: number; bad: number; invert?: boolean }> = {
    recoveryScore: {
        label: "Toparlanma Skoru", unit: "puan", good: 70, bad: 40,
        explain: v => v >= 70 ? "Harika! Kasların ve sinir sisteminle uyum içinde. Güçlü bir antrenman günü."
                    : v >= 40 ? "Ortalama bir toparlanma. Antrenmana devam edebilirsin ama kendin zorlama."
                              : "Düşük toparlanma. Vücudun dinlenmeye ihtiyaç duyuyor.",
    },
    sleepHours: {
        label: "Uyku Süresi", unit: "saat", good: 7, bad: 5,
        explain: v => v >= 7 ? "Yeterli uyku aldın. Kas onarımı ve hormon dengesi optimal."
                    : v >= 5 ? "Uyku biraz az. Performansta hafif düşüş beklenebilir."
                              : "Ciddi uyku eksikliği. Kortizol yüksek, kuvvet düşük olabilir.",
    },
    avgRpe: {
        label: "Antrenman Yoğunluğu", unit: "/ 10 RPE", good: 7, bad: 9, invert: true,
        explain: v => v <= 7 ? "Sinir sisteminiz dinç. Bugün daha fazlasını kaldırabilirsin."
                    : v <= 9 ? "Yüksek yoğunluk. Toparlanmana dikkat et."
                              : "Maksimum efor. Sinir sistemi yorgun — bugün kesinlikle dinlen.",
    },
};

// Structured analysis card config
const AI_CARDS = [
    {
        key: 'generalComment',
        label: 'Genel Durum',
        icon: '◈',
        iconColor: 'text-blue-400',
        borderColor: 'border-blue-400/20',
        bgColor: 'bg-blue-400/5',
    },
    {
        key: 'strengthPoint',
        label: 'Güçlü Yön',
        icon: '↑',
        iconColor: 'text-green-500',
        borderColor: 'border-green-500/20',
        bgColor: 'bg-green-500/5',
    },
    {
        key: 'improvementPoint',
        label: 'Gelişim Alanı',
        icon: '◎',
        iconColor: 'text-amber-400',
        borderColor: 'border-amber-400/20',
        bgColor: 'bg-amber-400/5',
    },
    {
        key: 'tomorrowSuggestion',
        label: 'Yarın İçin Öneri',
        icon: '→',
        iconColor: 'text-violet-400',
        borderColor: 'border-violet-400/20',
        bgColor: 'bg-violet-400/5',
    },
] as const;

function getStatus(score: number) {
    if (score >= 70) return "POSITIVE";
    if (score < 40)  return "PLATEAU";
    return "STABLE";
}

function scoreColor(value: number, good: number, bad: number, invert = false) {
    const isGood = invert ? value <= good : value >= good;
    const isBad  = invert ? value >= bad  : value <= bad;
    if (isGood) return { text: "text-green-500", hex: "#22c55e" };
    if (isBad)  return { text: "text-red-500",   hex: "#ef4444" };
    return { text: "text-amber-400", hex: "#f59e0b" };
}

function MetricCard({ metricKey, value, prev }: { metricKey: string; value: any; prev?: any }) {
    const [open, setOpen] = useState(false);
    const info = METRIC_INFO[metricKey];
    if (!info || value == null) return null;
    const num = Number(value);
    const { text, hex } = scoreColor(num, info.good, info.bad, info.invert);
    const diff = prev != null ? num - Number(prev) : null;
    const diffImproved = info.invert ? (diff ?? 0) < 0 : (diff ?? 0) > 0;
    return (
        <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-5 relative">
            <div className="flex justify-between items-start mb-3">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{info.label}</p>
                <button onClick={() => setOpen(o => !o)}
                    className="text-[9px] font-black text-zinc-700 hover:text-zinc-400 transition-colors uppercase tracking-widest">
                    {open ? "Kapat" : "Bu ne demek?"}
                </button>
            </div>
            <div className="flex items-end gap-1.5 mb-1">
                <span className={`text-4xl font-black italic tracking-tighter ${text}`}>{num % 1 === 0 ? num : num.toFixed(1)}</span>
                <span className="text-[10px] text-zinc-600 font-black mb-1.5">{info.unit}</span>
            </div>
            {diff != null && Math.abs(diff) > 0.05 && (
                <p className={`text-[10px] font-black ${diffImproved ? 'text-green-500' : 'text-red-500'}`}>
                    {diffImproved ? '↑' : '↓'} {Math.abs(diff).toFixed(1)} önceki analize göre
                </p>
            )}
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="mt-3 pt-3 border-t border-white/5">
                            <div className="flex gap-2">
                                <span style={{ color: hex }} className="text-lg shrink-0">●</span>
                                <p className="text-[11px] text-zinc-300 font-medium leading-relaxed">{info.explain(num)}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function AnalysisDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [data, setData]       = useState<any>(null);
    const [prev, setPrev]       = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const headers = { ...(token && { Authorization: `Bearer ${token}` }) };
        Promise.all([
            fetch(`http://localhost:8080/api/analysis/${id}`, { headers }),
            fetch(`http://localhost:8080/api/analysis/history`, { headers }),
        ]).then(async ([detailRes, histRes]) => {
            if (detailRes.ok) {
                const d = await detailRes.json();
                setData(d);
                if (histRes.ok) {
                    const hist: any[] = await histRes.json();
                    const idx = hist.findIndex(h => String(h.dailyRecordId) === String(id));
                    if (idx !== -1 && hist[idx + 1]) setPrev(hist[idx + 1]);
                }
            }
        }).finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-[#060606] flex items-center justify-center">
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-white font-black italic tracking-tighter text-2xl">
                ANALİZ YÜKLENİYOR...
            </motion.div>
        </div>
    );

    if (!data) return (
        <div className="min-h-screen bg-[#060606] flex items-center justify-center text-center">
            <div>
                <p className="text-zinc-500 font-black uppercase tracking-widest text-sm mb-4">Analiz bulunamadı</p>
                <Link href="/dashboard" className="text-white underline text-sm">Dashboard'a dön</Link>
            </div>
        </div>
    );

    const score  = data.recoveryScore ?? 0;
    const status = getStatus(score);
    const theme  = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];

    const createdAt = data.createdAt
        ? new Date(data.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : null;

    // Determine if this record has structured AI output
    const hasStructured = !!(data.generalComment || data.strengthPoint || data.improvementPoint || data.tomorrowSuggestion);

    const detailMetrics = [
        { label: "Egzersiz Sayısı", value: data.exerciseCount, unit: "hareket" },
        { label: "Toplam Hacim",    value: data.totalVolume != null ? Math.round(data.totalVolume).toLocaleString('tr-TR') : null, unit: "kg" },
        { label: "Maks. Ağırlık",  value: data.maxWeight,    unit: "kg" },
    ];

    return (
        <div className="min-h-screen bg-[#060606] text-white p-6 md:p-12 font-sans">
            <main className="max-w-3xl mx-auto space-y-6">

                {/* HEADER */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                        {createdAt && <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{createdAt}</span>}
                    </div>
                    <Link href="/dashboard"
                        className="text-[10px] font-black uppercase tracking-widest border border-zinc-800 px-5 py-3 rounded-xl hover:bg-white hover:text-black transition-all italic">
                        ← GERİ
                    </Link>
                </div>

                {/* ANA AKSİYON KARTI */}
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
                    className={`${theme.bg} ${theme.border} border-2 rounded-[2.5rem] p-8 md:p-10`}>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-4">BUGÜN NE YAPMALIYIM?</p>
                    <div className="flex items-center gap-4 mb-4">
                        <span className={`text-5xl font-black ${theme.text}`}>{theme.actionIcon}</span>
                        <h1 className={`text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none ${theme.text}`}>
                            {theme.action}
                        </h1>
                    </div>
                    <p className="text-zinc-300 text-sm font-medium leading-relaxed max-w-lg">{theme.actionSub}</p>
                </motion.div>

                {/* AI ANALİZ — YAPILANDIRILMIŞ veya FALLBACK */}
                {hasStructured ? (
                    <div className="space-y-3">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest ml-1">Koç Yorumu</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {AI_CARDS.map(card => {
                                const text: string = data[card.key] ?? '';
                                if (!text) return null;
                                return (
                                    <motion.div key={card.key}
                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        className={`${card.bgColor} ${card.borderColor} border rounded-2xl p-5`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={`text-base ${card.iconColor} font-black`}>{card.icon}</span>
                                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{card.label}</p>
                                        </div>
                                        <p className="text-sm text-zinc-200 font-medium leading-relaxed">{text}</p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ) : data.analysisText ? (
                    // Eski kayıtlar için fallback: tek kart
                    <div className="bg-[#0f0f0f] border border-white/5 rounded-[2rem] p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${theme.dot}`} />
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Koç Yorumu</p>
                        </div>
                        <p className="text-zinc-300 text-sm font-medium leading-relaxed">{data.analysisText}</p>
                    </div>
                ) : null}

                {/* 3 ANA METRİK */}
                <div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-3 ml-1">Ana Metrikler</p>
                    <div className="grid grid-cols-1 gap-3">
                        <MetricCard metricKey="recoveryScore" value={score}           prev={prev?.recoveryScore} />
                        <MetricCard metricKey="sleepHours"    value={data.sleepHours} prev={prev?.sleepHours} />
                        <MetricCard metricKey="avgRpe"        value={data.avgRpe}     prev={prev?.avgRpe} />
                    </div>
                </div>

                {/* DETAYLAR */}
                <div>
                    <button onClick={() => setShowDetails(o => !o)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-[#0f0f0f] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:border-zinc-700 transition-all">
                        <span>Detayları {showDetails ? 'Gizle' : 'Gör'}</span>
                        <span>{showDetails ? '↑' : '↓'}</span>
                    </button>
                    <AnimatePresence>
                        {showDetails && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className="grid grid-cols-3 gap-3 mt-3">
                                    {detailMetrics.map(m => m.value != null && (
                                        <div key={m.label} className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-4">
                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">{m.label}</p>
                                            <div className="flex items-end gap-1">
                                                <span className="text-2xl font-black italic text-white">{m.value}</span>
                                                <span className="text-[9px] text-zinc-600 mb-0.5">{m.unit}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ÖNCEKİ ANALİZLE KARŞILAŞTIRMA */}
                {prev && (
                    <div className="bg-[#0f0f0f] border border-white/5 rounded-[2rem] p-6">
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-5">Önceki Analize Göre</p>
                        <div className="space-y-3">
                            {[
                                { label: "Toparlanma", cur: score,           prv: prev.recoveryScore, unit: "puan" },
                                { label: "Uyku",       cur: data.sleepHours, prv: prev.sleepHours,    unit: "saat" },
                                { label: "RPE",        cur: data.avgRpe,     prv: prev.avgRpe,        unit: "",    invert: true },
                            ].map(row => {
                                const diff = row.cur != null && row.prv != null ? Number(row.cur) - Number(row.prv) : null;
                                const improved = row.invert ? (diff ?? 0) < 0 : (diff ?? 0) > 0;
                                const pct = diff != null && row.prv ? (diff / Number(row.prv)) * 100 : null;
                                return (
                                    <div key={row.label} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                                        <span className="text-[11px] font-black text-zinc-500 uppercase italic">{row.label}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-zinc-600">{row.prv != null ? Number(row.prv).toFixed(1) : '—'} {row.unit}</span>
                                            <span className="text-zinc-700">→</span>
                                            <span className="font-black text-white">{row.cur != null ? Number(row.cur).toFixed(1) : '—'} {row.unit}</span>
                                            {pct != null && Math.abs(pct) > 0.5 && (
                                                <span className={`text-[10px] font-black ${improved ? 'text-green-500' : 'text-red-500'}`}>
                                                    {improved ? '↑' : '↓'} %{Math.abs(pct).toFixed(0)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
