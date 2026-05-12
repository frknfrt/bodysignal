"use client";
import MiniLineChart from "./MiniLineChart";

type SignalType = "plateau" | "stable" | "positive" | "volatile";

const styles: Record<SignalType, { bg: string; text: string; hex: string }> = {
    plateau: { bg: "bg-red-500/5", text: "text-red-500", hex: "#ef4444" },
    stable: { bg: "bg-blue-500/5", text: "text-blue-500", hex: "#3b82f6" },
    positive: { bg: "bg-green-500/5", text: "text-green-500", hex: "#22c55e" },
    volatile: { bg: "bg-orange-500/5", text: "text-orange-500", hex: "#f97316" },
};

// Gerçekçi grafik verileri
const signalData = {
    plateau: [{ value: 50 }, { value: 52 }, { value: 51 }, { value: 51 }, { value: 52 }, { value: 51 }],
    stable: [{ value: 40 }, { value: 45 }, { value: 42 }, { value: 48 }, { value: 45 }, { value: 50 }],
    positive: [{ value: 10 }, { value: 25 }, { value: 35 }, { value: 55 }, { value: 80 }, { value: 100 }],
    volatile: [{ value: 20 }, { value: 90 }, { value: 10 }, { value: 100 }, { value: 30 }, { value: 80 }],
};

export default function SignalCard({
                                       title,
                                       description,
                                       type,
                                   }: {
    title: string;
    description: string;
    type: SignalType;
}) {
    const currentStyle = styles[type];
    const currentData = signalData[type]; // Tipe göre datayı seçiyoruz

    return (
        <div className={`group rounded-[2rem] p-6 border border-white/5 transition-all duration-500 hover:border-white/10 ${currentStyle.bg}`}>
            <div className="flex justify-between items-start mb-4">
                <h4 className={`font-black italic uppercase tracking-tighter text-lg ${currentStyle.text}`}>
                    {title}
                </h4>
                <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: currentStyle.hex }}
                />
            </div>

            <p className="text-xs font-medium text-zinc-500 leading-relaxed min-h-[32px]">
                {description}
            </p>

            {/* Tipe özel data ve renk ile grafik */}
            <MiniLineChart data={currentData} color={currentStyle.hex} />
        </div>
    );
}