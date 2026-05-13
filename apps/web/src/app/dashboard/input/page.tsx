"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EXERCISE_DATABASE } from "@/constants/exercises"
import { API_URL } from "@/lib/api";

const RPE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function SignalInputPage() {
    const [step, setStep] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [isShaking, setIsShaking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [workoutRows, setWorkoutRows] = useState([
        { id: Date.now(), exercise: "", load: "", reps: "", sets: "", rpe: "7" }
    ]);

    const [biometricData, setBiometricData] = useState({
        sleepTime: "",
        wakeTime: "",
        weight: "",
    });

    const sleepDuration = useMemo(() => {
        if (!biometricData.sleepTime || !biometricData.wakeTime) return null;
        const [sh, sm] = biometricData.sleepTime.split(':').map(Number);
        const [wh, wm] = biometricData.wakeTime.split(':').map(Number);
        let mins = (wh * 60 + wm) - (sh * 60 + sm);
        if (mins < 0) mins += 24 * 60;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}s ${m}dk` : `${h} saat`;
    }, [biometricData.sleepTime, biometricData.wakeTime]);

    const shakeTrigger = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    };

    const updateRow = (id: number, field: string, value: string) => {
        setWorkoutRows(workoutRows.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const validateStep1 = () => {
        const hasEmptyField = workoutRows.some(row => !row.exercise || !row.load || !row.reps);
        if (hasEmptyField) {
            setError("TÜM HAREKETLERİN VERİLERİNİ EKSİKSİZ GİR!");
            shakeTrigger();
            return;
        }
        setError(null);
        setStep(2);
    };

   const handleFinalSubmit = async (e: React.FormEvent) => {
       e.preventDefault();

       if (!biometricData.sleepTime || !biometricData.wakeTime || !biometricData.weight) {
           setError("BİYOMETRİK VERİLER EKSİK!");
           shakeTrigger();
           return;
       }

       setError(null);
       setIsProcessing(true);

       const payload = {
           recordDate: new Date().toISOString().split("T")[0],
           sleepTime: biometricData.sleepTime,
           wakeUpTime: biometricData.wakeTime,
           morningWeight: Number(biometricData.weight),
           workout: {
               exercises: workoutRows.map(row => ({
                   name: row.exercise,
                   weight: Number(row.load),
                   sets: Number(row.sets),
                   repCount: Number(row.reps),
                   lastSetRpe: Number(row.rpe)
               }))
           }
       };

       try {
           const tokenStr = localStorage.getItem("token");
           const token = tokenStr ? tokenStr : null;

           const res = await fetch("${API_URL}/api/daily-records", {
               method: "POST",
               headers: {
                   "Content-Type": "application/json",
                   ...(token && { Authorization: `Bearer ${token}` })
               },
               body: JSON.stringify(payload)
           });

           if (!res.ok) {
               const errorText = await res.text();
               throw new Error(errorText || "Kayıt başarısız");
           }

           setTimeout(() => {
               window.location.href = "/dashboard";
           }, 2500);

       } catch (err) {
           console.error(err);
           setError("SİNYAL İLETİLEMEDİ: SUNUCU BAĞLANTISINI KONTROL ET!");
           shakeTrigger();
           setIsProcessing(false);
       }
   };


    return (
        <div className="min-h-screen bg-[#060606] text-white p-4 md:p-12 overflow-x-hidden relative">
            <style dangerouslySetInnerHTML={{ __html: `
                input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
                input[type=time]::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
            `}} />

            {/* --- ANALİZ OVERLAY ANİMASYONU --- */}
            <AnimatePresence>
                {isProcessing && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-[#060606] flex flex-col items-center justify-center p-6 text-center overflow-hidden"
                    >
                        <motion.div
                            initial={{ top: "-10%" }} animate={{ top: "110%" }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-[2px] bg-green-500 shadow-[0_0_20px_#22c55e] z-10"
                        />
                        <div className="relative space-y-8">
                            <div className="relative flex justify-center items-center">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                            className="w-40 h-40 border-t-2 border-b-2 border-green-500/20 rounded-full"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-green-500 text-5xl font-black italic animate-pulse">!</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">SİNYAL <span className="text-green-500">İŞLENİYOR</span></h2>
                                <p className="text-zinc-600 font-black uppercase text-[10px] tracking-[0.6em] animate-pulse italic">Biyometrik Veriler Analiz Ediliyor...</p>
                            </div>
                            <div className="w-64 mx-auto h-1 bg-zinc-900 rounded-full overflow-hidden mt-4">
                                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2.3 }}
                                            className="h-full bg-green-500 shadow-[0_0_15px_#22c55e]"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : { opacity: 1 }} className="max-w-5xl mx-auto">
                <header className="mb-10 text-center flex flex-col items-center">
                    <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-green-500 leading-[0.8]">
                        {step === 1 ? 'ANTRENMAN' : 'TOPARLANMA'} <br />
                        <span className="text-white not-italic text-4xl md:text-5xl font-black">SİNYALİ</span>
                    </h1>
                    <div className="h-10 mt-6">
                        <AnimatePresence>{error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="bg-red-600 text-white font-black text-[9px] uppercase tracking-widest py-2.5 px-6 rounded-full border border-red-500 shadow-[0_0_25px_rgba(220,38,38,0.5)] italic"
                            > {error} </motion.div>
                        )}</AnimatePresence>
                    </div>
                </header>

                <form onSubmit={handleFinalSubmit} className="bg-[#0f0f0f] border border-zinc-800/50 p-6 md:p-10 rounded-[2.5rem] shadow-3xl relative">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                         <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                            {workoutRows.map((row) => (
                                    <div key={row.id} className="grid grid-cols-12 gap-3 bg-black/40 p-4 rounded-[2rem] border border-zinc-900 items-end relative group">

                                        {/* EGZERSİZ - md:col-span-4 */}
                                        <div className="col-span-12 md:col-span-4 flex flex-col justify-end">
                                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest italic mb-2 ml-1 block leading-none">
                                                Egzersiz
                                            </label>
                                            <input
                                                list="exercise-list"
                                                placeholder="HAREKET ARA..."
                                                value={row.exercise}
                                                onChange={(e) => updateRow(row.id, 'exercise', e.target.value.toUpperCase())}
                                                className="w-full bg-[#111] border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold focus:border-green-500 outline-none transition-all uppercase h-[46px]"
                                            />
                                            <datalist id="exercise-list">{EXERCISE_DATABASE.map(ex => <option key={ex} value={ex} />)}</datalist>
                                        </div>

                                        {/* KG - md:col-span-1 */}
                                        <div className="col-span-4 md:col-span-1 flex flex-col justify-end">
                                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest italic mb-2 block text-center leading-none">
                                                KG
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={row.load}
                                                onChange={(e) => updateRow(row.id, 'load', e.target.value)}
                                                className="w-full bg-[#111] border border-zinc-800 rounded-xl py-3 text-center text-sm font-black focus:border-green-500 outline-none h-[46px]"
                                            />
                                            <p className="text-[8px] text-zinc-700 mt-1.5 text-center leading-tight">Kullandığın ağırlık</p>
                                        </div>

                                        {/* REP - md:col-span-1 */}
                                        <div className="col-span-4 md:col-span-1 flex flex-col justify-end">
                                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest italic mb-2 block text-center leading-none">
                                                REP
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={row.reps}
                                                onChange={(e) => updateRow(row.id, 'reps', e.target.value)}
                                                className="w-full bg-[#111] border border-zinc-800 rounded-xl py-3 text-center text-sm font-black focus:border-green-500 outline-none h-[46px]"
                                            />
                                            <p className="text-[8px] text-zinc-700 mt-1.5 text-center leading-tight">Tekrar sayısı</p>
                                        </div>

                                        {/* SET - md:col-span-1 */}
                                        <div className="col-span-4 md:col-span-1 flex flex-col justify-end">
                                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest italic mb-2 block text-center leading-none">
                                                SET
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={row.sets}
                                                onChange={(e) => updateRow(row.id, 'sets', e.target.value)}
                                                className="w-full bg-[#111] border border-zinc-800 rounded-xl py-3 text-center text-sm font-black focus:border-green-500 outline-none h-[46px]"
                                            />
                                            <p className="text-[8px] text-zinc-700 mt-1.5 text-center leading-tight">Set sayısı</p>
                                        </div>

                                        {/* ZORLUK (RPE) - md:col-span-5 */}
                                        <div className="col-span-12 md:col-span-5 flex flex-col justify-end">
                                            <div className="flex justify-between px-1 mb-2 leading-none">
                                                <span className="text-[9px] font-black text-zinc-600 uppercase italic">ZORLUK</span>
                                                <span className="text-[9px] font-black text-green-500 italic">@{row.rpe}</span>
                                            </div>
                                            <div className="flex gap-0.5 bg-black p-1 rounded-xl border border-zinc-900 h-[46px] items-center">
                                                {RPE_VALUES.map((val) => (
                                                    <button
                                                        key={val}
                                                        type="button"
                                                        onClick={() => updateRow(row.id, 'rpe', val.toString())}
                                                        className={`flex-1 h-full rounded-lg text-[9px] font-black transition-all ${row.rpe === val.toString() ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'text-zinc-700 hover:text-zinc-400'}`}
                                                    >
                                                        {val}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-[8px] text-zinc-700 mt-1.5 px-1 leading-tight">Antrenman hissiyatın (1 kolay, 10 çok zor)</p>
                                        </div>

                                        {/* SİLME BUTONU */}
                                        <button type="button" onClick={() => workoutRows.length > 1 && setWorkoutRows(workoutRows.filter(r => r.id !== row.id))} className="absolute -right-2 -top-2 w-6 h-6 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 z-10">✕</button>
                                    </div>
                                ))}

                             <button type="button" onClick={() => setWorkoutRows([...workoutRows, { id: Date.now(), exercise: "", load: "", reps: "", sets: "", rpe: "7" }])} className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 hover:text-green-500 transition-all">+ YENİ EGZERSİZ EKLE</button>

                             <motion.button type="button" whileHover={{ scale: 1.01 }} onClick={validateStep1} className="w-full bg-white text-black font-black uppercase italic py-6 rounded-[2rem] text-2xl tracking-tighter">BİYOMETRİK ANALİZE GEÇ →</motion.button>
                         </motion.div>
                        ) : (
                            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">

                                {/* SAAT + HESAPLANAN UYKU — 3 kolon */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-black text-zinc-600 uppercase italic ml-1 tracking-widest block">Yatış Saati</span>
                                        <div className="bg-black border border-zinc-800 rounded-2xl px-4 py-3.5 focus-within:border-green-500 transition-all">
                                            <input
                                                type="time"
                                                value={biometricData.sleepTime}
                                                onChange={(e) => setBiometricData({...biometricData, sleepTime: e.target.value})}
                                                className="w-full bg-transparent text-2xl font-black italic outline-none text-white tracking-tighter"
                                            />
                                        </div>
                                        <p className="text-[8px] text-zinc-700 ml-1">Uyumaya gittiğin saat</p>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-black text-zinc-600 uppercase italic ml-1 tracking-widest block">Uyanış Saati</span>
                                        <div className="bg-black border border-zinc-800 rounded-2xl px-4 py-3.5 focus-within:border-green-500 transition-all">
                                            <input
                                                type="time"
                                                value={biometricData.wakeTime}
                                                onChange={(e) => setBiometricData({...biometricData, wakeTime: e.target.value})}
                                                className="w-full bg-transparent text-2xl font-black italic outline-none text-white tracking-tighter"
                                            />
                                        </div>
                                        <p className="text-[8px] text-zinc-700 ml-1">Uyandığın saat</p>
                                    </div>
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-black text-zinc-600 uppercase italic ml-1 tracking-widest block">Uyku Süresi</span>
                                        <div className={`rounded-2xl px-4 py-3.5 h-[58px] flex items-center justify-center border transition-all ${sleepDuration ? 'bg-green-500/8 border-green-500/30' : 'bg-black border-zinc-800'}`}>
                                            {sleepDuration
                                                ? <span className="text-2xl font-black italic text-green-500 tracking-tighter">{sleepDuration}</span>
                                                : <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Otomatik</span>
                                            }
                                        </div>
                                        <p className="text-[8px] text-zinc-700 ml-1">Yatış → uyanıştan hesaplanır</p>
                                    </div>
                                </div>

                                {/* SABAH TARTISI — kompakt */}
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-zinc-600 tracking-[0.4em] uppercase italic ml-1 block">SABAH TARTISI</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={biometricData.weight}
                                            onChange={(e) => setBiometricData({...biometricData, weight: e.target.value})}
                                            placeholder="0.0"
                                            className="flex-1 bg-black border border-zinc-800 rounded-2xl py-4 px-6 text-center text-3xl font-black italic text-green-500 focus:border-green-500 outline-none transition-all placeholder:text-zinc-800"
                                        />
                                        <span className="text-zinc-600 font-black text-lg shrink-0">KG</span>
                                    </div>
                                    <p className="text-[8px] text-zinc-700 ml-1">Sabah aç karnına, tuvalettin ardından</p>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <motion.button type="submit" whileHover={{ scale: 1.01 }} className="w-full bg-green-500 text-black font-black uppercase italic py-8 rounded-[2.5rem] text-3xl shadow-[0_20px_50px_rgba(34,197,94,0.2)]">SİNYALİ ANALİZ ET</motion.button>
                                    <button type="button" onClick={() => setStep(1)} className="w-full text-zinc-700 text-[9px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors italic">← ANTRENMANA DÖN</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </motion.div>
        </div>
    );
}