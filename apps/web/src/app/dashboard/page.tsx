"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ComposedChart, Area, Line, LineChart,
} from 'recharts';
import { API_URL } from "@/lib/api";

// ─── Sabitler ────────────────────────────────────────────────────────────────

const STATUS_THEME = {
    POSITIVE: { color: "#22c55e", text: "text-green-500", dot: "bg-green-500", bg: "bg-green-500/8",  border: "border-green-500/25" },
    STABLE:   { color: "#f59e0b", text: "text-amber-400", dot: "bg-amber-400", bg: "bg-amber-400/8",  border: "border-amber-400/25" },
    PLATEAU:  { color: "#ef4444", text: "text-red-500",   dot: "bg-red-500",   bg: "bg-red-500/8",    border: "border-red-500/25"   },
};

const ACTION_CONFIG = {
    POSITIVE: { label: "HAZIR",   icon: "↑", sub: "Kasların ve sinir sisteminle tam uyum içindesin. Bugün antrenmanı zorlaştır." },
    STABLE:   { label: "DİKKAT", icon: "→", sub: "Tempo iyi ama yükseltmek için daha fazla dinlenme gerekiyor. Mevcut programını koru." },
    PLATEAU:  { label: "DİNLEN",  icon: "↓", sub: "Vücudun toparlanmaya ihtiyaç duyuyor. Bugün aktif dinlenme veya deload yap." },
};

const PERIODS = [
    { label: "7 Gün",  days: 7  },
    { label: "30 Gün", days: 30 },
    { label: "90 Gün", days: 90 },
];

const TABLE_PAGE_SIZE = 5;

// ─── Yardımcı fonksiyonlar ───────────────────────────────────────────────────

function getStatus(score: number) {
    if (score >= 70) return "POSITIVE";
    if (score < 40)  return "PLATEAU";
    return "STABLE";
}

function buildChartData(history: any[], days: number) {
    const cutoff = Date.now() - days * 86_400_000;
    return [...history]
        .filter(h => h.createdAt && new Date(h.createdAt).getTime() >= cutoff)
        .reverse()
        .map(h => ({
            day: new Date(h.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
            strength: h.maxWeight ?? 0,
            volume: h.totalVolume != null ? Math.round(h.totalVolume) : 0,
            score: h.recoveryScore ?? 0,
        }));
}

function downloadCSV(history: any[]) {
    if (!history.length) return;
    const rows = history.map(item => {
        const score = item.recoveryScore ?? 0;
        const durum = getStatus(score);
        const tarih = item.createdAt
            ? new Date(item.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '-';
        return [`"${tarih}"`, score, durum, `"${(item.analysisText ?? '').replace(/"/g, '""')}"`].join(',');
    });
    const csv = ['Tarih,Skor,Durum,Analiz', ...rows].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bodysignal-rapor-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─── Ana sayfa ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const { user } = useAuth();
    const [isLoading, setIsLoading]         = useState(true);
    const [status, setStatus]               = useState("STABLE");
    const [latestScore, setLatestScore]     = useState(0);
    const [aiAnalysis, setAiAnalysis]       = useState("");
    const [signalHistory, setSignalHistory] = useState<any[]>([]);
    const [dismissed, setDismissed]         = useState<Set<string>>(new Set());
    const [period, setPeriod]               = useState(7);
    const [showAll, setShowAll]             = useState(false);
    const [plateau, setPlateau]             = useState<any>(null);
    const [plateauDismissed, setPlateauDismissed] = useState(false);
    const historyRef = useRef<HTMLDivElement>(null);

    const dismiss = (id: string) => setDismissed(prev => new Set(prev).add(id));

    useEffect(() => {
        const token = localStorage.getItem("token");
        const headers = { ...(token && { Authorization: `Bearer ${token}` }) };
        Promise.all([
            fetch(`${API_URL}/api/analysis/latest`,        { headers }),
            fetch(`${API_URL}/api/analysis/history`,       { headers }),
            fetch(`${API_URL}/api/analysis/plateau-status`, { headers }),
        ]).then(async ([latestRes, histRes, plateauRes]) => {
            if (latestRes.ok) {
                const d = await latestRes.json();
                const score: number = d.recoveryScore ?? 0;
                setLatestScore(score);
                setAiAnalysis(d.analysisText || "");
                setStatus(getStatus(score));
            }
            if (histRes.ok) setSignalHistory(await histRes.json());
            if (plateauRes?.ok) {
                const p = await plateauRes.json();
                if (p.plateauType && p.plateauType !== 'NONE') setPlateau(p);
            }
        }).catch(e => console.error("Backend bağlantı hatası:", e))
          .finally(() => setTimeout(() => setIsLoading(false), 800));
    }, []);

    const theme      = STATUS_THEME[status as keyof typeof STATUS_THEME] ?? STATUS_THEME.STABLE;
    const action     = ACTION_CONFIG[status as keyof typeof ACTION_CONFIG] ?? ACTION_CONFIG.STABLE;
    const chartData  = useMemo(() => buildChartData(signalHistory, period), [signalHistory, period]);
    const tableRows  = showAll ? signalHistory : signalHistory.slice(0, TABLE_PAGE_SIZE);

    // Özet metrikler
    const scores     = signalHistory.map(h => h.recoveryScore ?? 0);
    const avgScore   = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : 0;
    const bestScore  = scores.length ? Math.max(...scores) : 0;
    const streak     = useMemo(() => {
        if (!signalHistory.length) return 0;
        const sorted = [...signalHistory].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        let s = 0;
        const toDay = (iso: string) => new Date(iso).toLocaleDateString('tr-TR');
        let expected = toDay(sorted[0].createdAt);
        for (const item of sorted) {
            if (toDay(item.createdAt) === expected) {
                s++;
                const d = new Date(item.createdAt);
                d.setDate(d.getDate() - 1);
                expected = d.toLocaleDateString('tr-TR');
            } else break;
        }
        return s;
    }, [signalHistory]);

    const signalStrength = signalHistory.length
        ? Math.min(Math.round((streak / 7) * 100), 100)
        : 0;

    if (isLoading) return (
        <div className="min-h-screen bg-[#060606] flex items-center justify-center">
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-white font-black italic tracking-tighter text-2xl">
                SİNYAL ALINIYOR...
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#060606] text-white p-4 md:p-8 font-sans selection:bg-zinc-800">

            {/* ── HEADER ── */}
            <header className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${theme.dot}`} />
                    <span className="text-zinc-500 text-[11px] font-black uppercase tracking-widest">
                        HOŞ GELDİN, {user?.fullName}
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                        className="bg-zinc-900 border border-zinc-700 text-white px-5 py-2.5 rounded-xl font-black uppercase italic text-xs tracking-tighter hover:border-zinc-500 transition-colors">
                        Geçmişi Gör ↓
                    </button>
                    <button onClick={() => downloadCSV(signalHistory)}
                        className="bg-zinc-900 border border-zinc-700 text-white px-5 py-2.5 rounded-xl font-black uppercase italic text-xs tracking-tighter hover:border-zinc-500 transition-colors">
                        Rapor İndir ↓
                    </button>
                    <Link href="/dashboard/input">
                        <button className="bg-white text-black px-6 py-2.5 rounded-xl font-black uppercase italic text-xs tracking-tighter shadow-xl hover:bg-zinc-100 transition-colors">
                            Yeni Sinyal +
                        </button>
                    </Link>
                </div>
            </header>

            <main className="max-w-5xl mx-auto space-y-5">

                {/* 1. KATMAN — NE YAPMALIYIM? */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className={`${theme.bg} ${theme.border} border-2 rounded-[2rem] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6`}>
                    <div>
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-3">BUGÜN NE YAPMALIYIM?</p>
                        <div className="flex items-center gap-3 mb-3">
                            <span className={`text-5xl font-black ${theme.text}`}>{action.icon}</span>
                            <h1 className={`text-5xl font-black italic uppercase tracking-tighter ${theme.text}`}>{action.label}</h1>
                        </div>
                        <p className="text-zinc-300 text-sm font-medium leading-relaxed max-w-md">{action.sub}</p>
                        {aiAnalysis && (
                            <p className="text-zinc-500 text-xs font-medium leading-relaxed mt-3 max-w-md italic">"{aiAnalysis}"</p>
                        )}
                    </div>
                    <div className={`shrink-0 text-center px-8 py-6 rounded-2xl bg-black/30 border ${theme.border}`}>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Toparlanma Skoru</p>
                        <p className={`text-5xl font-black italic ${theme.text}`}>{latestScore}</p>
                        <p className="text-[9px] text-zinc-600 font-black mt-1">/ 100 puan</p>
                    </div>
                </motion.div>

                {/* PLATEAU ALERT */}
                <PlateauAlert plateau={plateau} dismissed={plateauDismissed} onDismiss={() => setPlateauDismissed(true)} />

                {/* 2. KATMAN — UYARILAR */}
                <AlertPanel latestScore={latestScore} status={status}
                    lastSignalDate={signalHistory[0]?.createdAt ?? null}
                    dismissed={dismissed} onDismiss={dismiss} />

                {/* 3. KATMAN — NEDEN? (Metrikler) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Ortalama Skor"
                        value={`${avgScore}`} unit="puan"
                        color="text-blue-400"
                        desc={avgScore >= 70 ? "Genel toparlanman çok iyi." : avgScore >= 40 ? "Toparlanman ortalama seyrediyor." : "Genel toparlanman düşük, dinlenmeye öncelik ver."}
                    />
                    <MetricCard
                        title="En Yüksek Skor"
                        value={`${bestScore}`} unit="puan"
                        color="text-green-400"
                        desc={bestScore >= 80 ? "Zirvene yakın olduğunda neler yaptığına bak." : "Zirveni geçmek için uyku ve dinlenmeye odaklan."}
                    />
                    <MetricCard
                        title="Sinyal Gücü"
                        value={`%${signalStrength}`} unit=""
                        color={signalStrength >= 70 ? "text-green-400" : signalStrength >= 40 ? "text-amber-400" : "text-red-400"}
                        desc={signalStrength >= 70 ? "Veri girişin çok tutarlı, AI analizi güvenilir." : signalStrength >= 40 ? "Daha düzenli veri girersen tahminler iyileşir." : "Veri eksik, AI analizi için her gün kayıt yap."}
                    />
                    <MetricCard
                        title="Streak"
                        value={`${streak}`} unit="gün"
                        color={streak >= 7 ? "text-yellow-400" : streak >= 3 ? "text-amber-400" : "text-zinc-400"}
                        desc={streak >= 7 ? "Harika! 7+ gün kesintisiz takip." : streak >= 3 ? "İyi gidiyorsun, devam et." : "Günlük takip alışkanlığı kazan."}
                    />
                </div>

                {/* Sağ kartlar (Plato, Recovery, Sinyal) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard
                        title="Plato Riski"
                        value={status === "PLATEAU" ? "%88" : "%12"} unit=""
                        color={status === "PLATEAU" ? "text-red-500" : "text-green-500"}
                        desc={status === "PLATEAU" ? "Gelişim durdu. Deload veya program değişikliği gerekli." : "Düşük risk. Antrenman programın etkili çalışıyor."}
                        info="RPE yüksekliği ve skor düşüşü birleştirilerek hesaplanır. %70 üzeri tehlikeli."
                    />
                    <MetricCard
                        title="Toparlanma Durumu"
                        value={status === "PLATEAU" ? "KRİTİK" : status === "STABLE" ? "ORTA" : "OPTİMAL"} unit=""
                        color={theme.text}
                        desc={status === "POSITIVE" ? "Uyku ve RPE dengeli, kasların dinlenmiş." : status === "STABLE" ? "Toparlanman yeterli ama optimize edilebilir." : "Uyku veya RPE değerlerin kritik seviyede."}
                        info="Uyku süresi + ortalama RPE birleşimi. 7+ saat uyku ve RPE<8 idealdir."
                    />
                    <MetricCard
                        title="Veri Kalitesi"
                        value={signalHistory.length >= 10 ? "YÜKSEK" : signalHistory.length >= 5 ? "ORTA" : "DÜŞÜK"} unit=""
                        color={signalHistory.length >= 10 ? "text-green-500" : signalHistory.length >= 5 ? "text-amber-400" : "text-red-500"}
                        desc={`${signalHistory.length} kayıt mevcut. ${signalHistory.length >= 10 ? "AI analizi güvenilir sonuç üretiyor." : "Daha fazla kayıt analizin doğruluğunu artırır."}`}
                        info="Toplam kayıt sayısına göre hesaplanır. 10+ kayıt = Yüksek güvenilirlik."
                    />
                </div>

                {/* 4. KATMAN — GRAFİK */}
                <div className="bg-[#0f0f0f] border border-white/5 rounded-[2.5rem] p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-1">Performans Trendi</p>
                            <h3 className="text-xl font-black italic uppercase tracking-tighter">
                                Kuvvet <span className={theme.text}>Gelişimi</span>
                            </h3>
                        </div>
                        <div className="flex gap-1 bg-black/50 p-1 rounded-xl border border-white/5">
                            {PERIODS.map(p => (
                                <button key={p.days} onClick={() => setPeriod(p.days)}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${period === p.days ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {chartData.length < 2 ? (
                        <div className="h-[200px] flex items-center justify-center text-zinc-600 font-black text-[10px] uppercase tracking-widest">
                            Bu dönemde yeterli veri yok
                        </div>
                    ) : (
                        <div className="h-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData} margin={{ top: 5, right: 48, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor={theme.color} stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor={theme.color} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
                                    <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 9, fontWeight: 700 }} axisLine={{ stroke: '#27272a' }} tickLine={false} />
                                    <YAxis yAxisId="l" orientation="left"  domain={['auto','auto']} tick={{ fill: '#71717a', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}kg`} width={44} />
                                    <YAxis yAxisId="r" orientation="right" domain={['auto','auto']} tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : `${v}`} width={38} />
                                    <Tooltip content={<ChartTooltip themeColor={theme.color} />} />
                                    <Area  yAxisId="l" type="monotone" dataKey="strength" stroke={theme.color} strokeWidth={2.5} fill="url(#areaGrad)" dot={false} activeDot={{ r: 5, fill: theme.color, stroke: '#000', strokeWidth: 2 }} />
                                    <Line  yAxisId="r" type="monotone" dataKey="volume"   stroke="#8b5cf6"    strokeWidth={2}   dot={false} activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#000', strokeWidth: 2 }} strokeDasharray="4 3" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    <div className="flex gap-4 mt-4 justify-end">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.color }} />
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Kuvvet (kg)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-violet-500" />
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Hacim</span>
                        </div>
                    </div>
                </div>

                {/* 5. KATMAN — GEÇMİŞ TABLO */}
                <div ref={historyRef} className="bg-[#0f0f0f] border border-white/5 rounded-[2.5rem] overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-lg font-black italic uppercase tracking-tighter">Sinyal Geçmişi</h3>
                        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{signalHistory.length} kayıt</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-[9px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/[0.04]">
                                <tr>
                                    <th className="px-6 py-3">Tarih</th>
                                    <th className="px-6 py-3">Skor</th>
                                    <th className="px-6 py-3">Trend</th>
                                    <th className="px-6 py-3">Durum</th>
                                    <th className="px-6 py-3 text-right">Detay</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {signalHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-zinc-600 font-black text-[10px] uppercase tracking-widest">
                                            Henüz sinyal kaydı yok
                                        </td>
                                    </tr>
                                ) : tableRows.map((item, idx) => {
                                    const itemScore  = item.recoveryScore ?? 0;
                                    const itemStatus = getStatus(itemScore);
                                    const itemTheme  = STATUS_THEME[itemStatus as keyof typeof STATUS_THEME];
                                    const itemDate   = item.createdAt
                                        ? new Date(item.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        : "-";
                                    const prevScore  = signalHistory[idx + 1]?.recoveryScore;
                                    const trendPct   = prevScore != null && prevScore !== 0
                                        ? ((itemScore - prevScore) / prevScore) * 100
                                        : null;
                                    return (
                                        <tr key={item.id} className="hover:bg-white/[0.02] transition-all">
                                            <td className="px-6 py-4 text-sm font-bold text-zinc-300">{itemDate}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-black italic text-xl ${itemTheme.text}`}>{itemScore}</span>
                                                    <Sparkline scores={signalHistory.slice(idx, idx + 5).map(h => h.recoveryScore ?? 0).reverse()} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {trendPct == null || Math.abs(trendPct) < 0.1 ? (
                                                    <span className="text-zinc-600 text-sm">—</span>
                                                ) : trendPct > 0 ? (
                                                    <span className="text-green-500 font-black text-[11px]">↑ %{Math.abs(trendPct).toFixed(1)}</span>
                                                ) : (
                                                    <span className="text-red-500 font-black text-[11px]">↓ %{Math.abs(trendPct).toFixed(1)}</span>
                                                )}
                                            </td>
                                            <td className={`px-6 py-4 font-black text-[10px] uppercase tracking-widest ${itemTheme.text}`}>
                                                {itemStatus === "POSITIVE" ? "HAZIR" : itemStatus === "STABLE" ? "DİKKAT" : "DİNLEN"}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/dashboard/analysis/${item.dailyRecordId}`}>
                                                    <button className="text-[10px] font-black uppercase tracking-widest bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 hover:border-zinc-600 transition-all">
                                                        Gör →
                                                    </button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {signalHistory.length > TABLE_PAGE_SIZE && (
                        <div className="p-4 border-t border-white/[0.04] text-center">
                            <button onClick={() => setShowAll(o => !o)}
                                className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                                {showAll ? `↑ Daha Az Göster` : `Tümünü Gör (${signalHistory.length - TABLE_PAGE_SIZE} daha) ↓`}
                            </button>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}

// ─── Alt bileşenler ──────────────────────────────────────────────────────────

const PLATEAU_THEME: Record<string, { bg: string; border: string; icon: string; iconColor: string; badge: string; badgeBg: string; label: string }> = {
    LOW:    { bg: 'bg-yellow-500/8',  border: 'border-yellow-500/30', icon: '◎', iconColor: 'text-yellow-400', badge: 'text-yellow-400', badgeBg: 'bg-yellow-500/10', label: 'Düşük Risk' },
    MEDIUM: { bg: 'bg-orange-500/8',  border: 'border-orange-500/30', icon: '⚠', iconColor: 'text-orange-400', badge: 'text-orange-400', badgeBg: 'bg-orange-500/10', label: 'Orta Risk'  },
    HIGH:   { bg: 'bg-red-500/8',     border: 'border-red-500/30',    icon: '◈', iconColor: 'text-red-400',    badge: 'text-red-400',    badgeBg: 'bg-red-500/10',    label: 'Yüksek Risk' },
};

const PLATEAU_TYPE_LABEL: Record<string, string> = {
    PERFORMANCE: 'Performans Plateausu',
    RECOVERY:    'Toparlanma Plateausu',
    MOTIVATION:  'Motivasyon Plateausu',
};

const PLATEAU_SEVERITY_MSG: Record<string, string> = {
    LOW:    'Plateau riski başlıyor, dikkat et.',
    MEDIUM: '2 haftadır plateau belirtisi var.',
    HIGH:   'Kesin plateau — değişim şart.',
};

function PlateauAlert({ plateau, dismissed, onDismiss }: { plateau: any; dismissed: boolean; onDismiss: () => void }) {
    if (!plateau || dismissed) return null;
    const sev   = plateau.severity as string;
    const theme = PLATEAU_THEME[sev] ?? PLATEAU_THEME.LOW;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className={`${theme.bg} ${theme.border} border rounded-2xl px-5 py-4`}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                        <span className={`text-lg mt-0.5 ${theme.iconColor}`}>{theme.icon}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400">
                                    PLATO TESPİT EDİLDİ
                                </p>
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badge}`}>
                                    {PLATEAU_TYPE_LABEL[plateau.plateauType] ?? plateau.plateauType}
                                </span>
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badge}`}>
                                    {theme.label}
                                </span>
                            </div>
                            <p className="text-sm font-semibold text-white mb-1">
                                {PLATEAU_SEVERITY_MSG[sev]}
                            </p>
                            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                                {plateau.reason}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onDismiss}
                        className="text-zinc-600 hover:text-white transition-colors font-black shrink-0 mt-0.5"
                    >
                        ✕
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function MetricCard({ title, value, unit, color, desc, info }: any) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative bg-[#0f0f0f] border border-white/5 rounded-2xl p-5 hover:border-zinc-700 transition-all">
            <div className="flex justify-between items-start mb-2">
                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{title}</p>
                {info && (
                    <button onClick={() => setOpen(o => !o)}
                        className={`text-[9px] font-black transition-colors ${open ? 'text-white' : 'text-zinc-700 hover:text-zinc-400'}`}>
                        {open ? '✕' : 'ℹ'}
                    </button>
                )}
            </div>
            <div className="flex items-end gap-1 mb-2">
                <span className={`text-2xl font-black italic tracking-tighter ${color}`}>{value}</span>
                {unit && <span className="text-[9px] text-zinc-600 font-black mb-0.5">{unit}</span>}
            </div>
            <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">{desc}</p>
            <AnimatePresence>
                {open && info && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="absolute z-20 left-0 right-0 top-full mt-2 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-2xl">
                        <p className="text-[11px] font-medium text-zinc-300 leading-relaxed">{info}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function AlertPanel({ latestScore, status, lastSignalDate, dismissed, onDismiss }: any) {
    const alerts: any[] = [];
    if (latestScore > 0 && latestScore < 40 && !dismissed.has("low-score"))
        alerts.push({ id: "low-score", color: "bg-red-500/8", border: "border-red-500/30", icon: "⚠",
            title: "DÜŞÜK TOPARLANMA SKORU",
            body: `Skorun ${latestScore} puan ile kritik eşiğin altında. Bugün aktif dinlenme yap ve 8 saat uyumayı hedefle.` });
    if (status === "PLATEAU" && !dismissed.has("plateau"))
        alerts.push({ id: "plateau", color: "bg-orange-500/8", border: "border-orange-500/30", icon: "◈",
            title: "PLATO TESPİT EDİLDİ",
            body: "Gelişimin yavaşladı. Deload haftası uygula veya egzersiz programını değiştir." });
    if (lastSignalDate && !dismissed.has("inactive")) {
        const days = Math.floor((Date.now() - new Date(lastSignalDate).getTime()) / 86_400_000);
        if (days >= 3)
            alerts.push({ id: "inactive", color: "bg-amber-400/8", border: "border-amber-400/30", icon: "◎",
                title: `${days} GÜNDÜR SİNYAL YOK`,
                body: "Düzenli kayıt AI analizinin doğruluğunu artırır. Bugün antrenman olmasa da biyometrik verini gir." });
    }
    if (!alerts.length) return null;
    return (
        <div className="space-y-2">
            <AnimatePresence>
                {alerts.map(a => (
                    <motion.div key={a.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                        className={`${a.color} ${a.border} border rounded-2xl px-5 py-4 flex items-start justify-between gap-4`}>
                        <div className="flex items-start gap-3">
                            <span className="text-base mt-0.5 opacity-70">{a.icon}</span>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-1">{a.title}</p>
                                <p className="text-sm font-medium text-zinc-300 leading-relaxed">{a.body}</p>
                            </div>
                        </div>
                        <button onClick={() => onDismiss(a.id)} className="text-zinc-600 hover:text-white transition-colors font-black shrink-0">✕</button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

function Sparkline({ scores }: { scores: number[] }) {
    if (scores.length < 2) return null;
    return (
        <LineChart width={70} height={26} data={scores.map(v => ({ v }))} style={{ background: 'transparent' }}>
            <Line type="monotone" dataKey="v" stroke="#22c55e" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
    );
}

function ChartTooltip({ active, payload, label, themeColor }: any) {
    if (!active || !payload?.length) return null;
    const strength = payload.find((p: any) => p.dataKey === 'strength');
    const volume   = payload.find((p: any) => p.dataKey === 'volume');
    return (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-2xl min-w-[150px] space-y-2">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">{label}</p>
            {strength && <div className="flex justify-between gap-4">
                <span className="text-[9px] font-black text-zinc-500">Kuvvet</span>
                <span className="font-black italic" style={{ color: themeColor }}>{strength.value} kg</span>
            </div>}
            {volume && <div className="flex justify-between gap-4">
                <span className="text-[9px] font-black text-zinc-500">Hacim</span>
                <span className="font-black italic text-violet-400">{volume.value}</span>
            </div>}
        </div>
    );
}
