"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { API_URL } from "@/lib/api";

type FormData = {
    height: string;
    currentWeight: string;
    age: string;
    gender: string;
    targetWeight: string;
    goalType: string;
    weeklyWorkoutDays: number;
    experienceLevel: string;
    preferredWorkoutType: string;
};

const GOALS = [
    { id: 'Kas Kazan',        icon: '💪', desc: 'Kas kütlesi artır' },
    { id: 'Yağ Yak',          icon: '🔥', desc: 'Vücut yağını azalt' },
    { id: 'Performans Artır', icon: '⚡', desc: 'Atletik performans' },
    { id: 'Sağlıklı Kal',    icon: '🌿', desc: 'Genel sağlık & enerji' },
];
const EXPERIENCE = ['Yeni Başlayan', 'Orta', 'İleri'];
const WORKOUT_TYPES = [
    { id: 'Güç',     desc: 'Az tekrar, ağır ağırlık' },
    { id: 'Hacim',   desc: 'Çok set, orta ağırlık' },
    { id: 'Karışık', desc: 'Her ikisini dengele' },
];

const STEP_META = [
    { label: 'Fiziksel', sub: 'Vücut ölçülerin' },
    { label: 'Hedefler', sub: 'Ne elde etmek istiyorsun?' },
    { label: 'Deneyim',  sub: 'Antrenman geçmişin' },
];

const slideVariants = {
    enter:  (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

function ChoiceBtn({ label, sub, selected, onClick }: { label: string; sub?: string; selected: boolean; onClick: () => void }) {
    return (
        <button type="button" onClick={onClick}
            className={`w-full text-left px-5 py-4 rounded-2xl border font-bold text-sm transition-all ${
                selected
                    ? 'bg-green-500/15 border-green-500 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.15)]'
                    : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-600'
            }`}>
            <span className="font-black uppercase tracking-wide text-xs block">{label}</span>
            {sub && <span className="text-[10px] text-zinc-600 mt-0.5 block font-medium">{sub}</span>}
        </button>
    );
}

function NumInput({ label, value, onChange, placeholder, min, max }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder?: string; min?: number; max?: number;
}) {
    return (
        <div className="space-y-2">
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</label>
            <input type="number" value={value} onChange={e => onChange(e.target.value)}
                placeholder={placeholder} min={min} max={max}
                className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-xl font-black focus:border-green-500 outline-none transition-all placeholder:text-zinc-700 placeholder:font-normal placeholder:text-sm" />
        </div>
    );
}

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [dir, setDir] = useState(1);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<FormData>({
        height: '', currentWeight: '', age: '', gender: '',
        targetWeight: '', goalType: '', weeklyWorkoutDays: 3,
        experienceLevel: '', preferredWorkoutType: '',
    });

    useEffect(() => {
        if (!localStorage.getItem('token')) router.replace('/login');
    }, []);

    const set = (key: keyof FormData, value: any) => setForm(d => ({ ...d, [key]: value }));

    const stepValid = (): boolean => {
        if (step === 1) return !!(form.height && form.currentWeight && form.age && form.gender);
        if (step === 2) return !!(form.targetWeight && form.goalType);
        if (step === 3) return !!(form.experienceLevel && form.preferredWorkoutType);
        return true;
    };

    const goNext = () => { setDir(1); setStep(s => s + 1); };
    const goBack = () => { setDir(-1); setStep(s => s - 1); };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await fetch('${API_URL}/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    height:               form.height        ? Number(form.height)        : null,
                    currentWeight:        form.currentWeight ? Number(form.currentWeight) : null,
                    age:                  form.age           ? Number(form.age)           : null,
                    gender:               form.gender        || null,
                    targetWeight:         form.targetWeight  ? Number(form.targetWeight)  : null,
                    goalType:             form.goalType      || null,
                    weeklyWorkoutDays:    form.weeklyWorkoutDays,
                    experienceLevel:      form.experienceLevel      || null,
                    preferredWorkoutType: form.preferredWorkoutType  || null,
                }),
            });
            const existing = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({
                ...existing,
                height: Number(form.height),
                age:    Number(form.age),
            }));
            router.push('/dashboard');
        } catch {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#060606] flex flex-col items-center justify-center px-4 py-12 font-sans text-white">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-green-500/6 rounded-full blur-[160px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[130px]" />
            </div>

            <div className="w-full max-w-lg z-10">
                {/* Logo */}
                <div className="text-center mb-10">
                    <Link href="/" className="text-2xl font-black tracking-tighter">
                        BodySignal<span className="text-green-500">.</span>
                    </Link>
                    <p className="text-zinc-600 text-xs mt-2 font-medium">
                        AI koçun seni tanısın — 2 dakika yeter.
                    </p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-0 mb-10">
                    {STEP_META.map((s, i) => {
                        const num = i + 1;
                        const done   = step > num;
                        const active = step === num;
                        return (
                            <div key={num} className="flex items-center">
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 ${
                                        done   ? 'bg-green-500 text-black'   :
                                        active ? 'bg-white text-black ring-4 ring-green-500/30' :
                                                 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                                    }`}>
                                        {done ? '✓' : num}
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-white' : 'text-zinc-700'}`}>
                                        {s.label}
                                    </span>
                                </div>
                                {i < 2 && (
                                    <div className={`w-16 h-px mx-2 mb-4 transition-all duration-500 ${step > num ? 'bg-green-500' : 'bg-zinc-800'}`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Card */}
                <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 shadow-2xl overflow-hidden">
                    <div className="mb-7">
                        <span className="text-green-500 text-[10px] font-black uppercase tracking-[0.4em]">
                            Adım {step} / 3
                        </span>
                        <h2 className="text-2xl font-black mt-1 tracking-tight">
                            {STEP_META[step - 1].label}
                        </h2>
                        <p className="text-zinc-500 text-sm mt-0.5">{STEP_META[step - 1].sub}</p>
                    </div>

                    <AnimatePresence mode="wait" custom={dir}>
                        <motion.div key={step} custom={dir} variants={slideVariants}
                            initial="enter" animate="center" exit="exit"
                            transition={{ duration: 0.25, ease: 'easeInOut' }}>

                            {/* ── STEP 1 ── */}
                            {step === 1 && (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <NumInput label="Boy (cm)" value={form.height}
                                            onChange={v => set('height', v)} placeholder="180" min={100} max={250} />
                                        <NumInput label="Mevcut Kilo (kg)" value={form.currentWeight}
                                            onChange={v => set('currentWeight', v)} placeholder="80" min={30} max={300} />
                                    </div>
                                    <NumInput label="Yaş" value={form.age}
                                        onChange={v => set('age', v)} placeholder="24" min={10} max={100} />
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cinsiyet</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['Erkek', 'Kadın'].map(g => (
                                                <ChoiceBtn key={g} label={g} selected={form.gender === g}
                                                    onClick={() => set('gender', g)} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── STEP 2 ── */}
                            {step === 2 && (
                                <div className="space-y-5">
                                    <NumInput label="Hedef Kilo (kg)" value={form.targetWeight}
                                        onChange={v => set('targetWeight', v)} placeholder="75" min={30} max={300} />
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ana Hedef</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {GOALS.map(g => (
                                                <button key={g.id} type="button"
                                                    onClick={() => set('goalType', g.id)}
                                                    className={`text-left p-4 rounded-2xl border transition-all ${
                                                        form.goalType === g.id
                                                            ? 'bg-green-500/15 border-green-500 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.15)]'
                                                            : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-600'
                                                    }`}>
                                                    <span className="text-xl block mb-1">{g.icon}</span>
                                                    <span className="font-black uppercase text-[10px] tracking-wide block">{g.id}</span>
                                                    <span className="text-[10px] text-zinc-600 mt-0.5 block">{g.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                            Haftalık Antrenman Günü: <span className="text-white">{form.weeklyWorkoutDays}</span>
                                        </label>
                                        <input type="range" min={1} max={7} value={form.weeklyWorkoutDays}
                                            onChange={e => set('weeklyWorkoutDays', Number(e.target.value))}
                                            className="w-full accent-green-500 cursor-pointer" />
                                        <div className="flex justify-between text-[9px] text-zinc-700 font-black uppercase">
                                            <span>1 gün</span><span>4 gün</span><span>7 gün</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── STEP 3 ── */}
                            {step === 3 && (
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Spor Geçmişi</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {EXPERIENCE.map(e => (
                                                <ChoiceBtn key={e} label={e} selected={form.experienceLevel === e}
                                                    onClick={() => set('experienceLevel', e)} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tercih Ettiğin Antrenman</label>
                                        <div className="space-y-2">
                                            {WORKOUT_TYPES.map(w => (
                                                <ChoiceBtn key={w.id} label={w.id} sub={w.desc}
                                                    selected={form.preferredWorkoutType === w.id}
                                                    onClick={() => set('preferredWorkoutType', w.id)} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Buttons */}
                    <div className={`flex gap-3 mt-8 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
                        {step > 1 && (
                            <button type="button" onClick={goBack}
                                className="px-6 py-3 rounded-xl border border-zinc-800 text-zinc-500 font-black uppercase text-xs tracking-widest hover:border-zinc-600 hover:text-white transition-all">
                                ← Geri
                            </button>
                        )}
                        {step < 3 ? (
                            <button type="button" onClick={goNext} disabled={!stepValid()}
                                className="px-8 py-3 bg-green-500 text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-green-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                                İleri →
                            </button>
                        ) : (
                            <button type="button" onClick={handleSubmit}
                                disabled={!stepValid() || saving}
                                className="px-8 py-3 bg-green-500 text-black font-black uppercase text-xs tracking-widest rounded-xl hover:bg-green-400 transition-all disabled:opacity-30 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                {saving ? 'Kaydediliyor...' : 'Tamamla & Başla →'}
                            </button>
                        )}
                    </div>
                </div>

                <p className="text-center text-zinc-700 text-[10px] mt-6 font-medium">
                    Bu bilgiler AI koçunun seni daha iyi analiz etmesi için kullanılır.
                    <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-400 ml-1 underline transition-colors">
                        Şimdi atla
                    </Link>
                </p>
            </div>
        </div>
    );
}