"use client";

import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const data = [
  { gun: "Pzt", skor: 90 },
  { gun: "Sal", skor: 98 },
  { gun: "Çar", skor: 95 },
  { gun: "Per", skor: 102 },
  { gun: "Cum", skor: 110 },
  { gun: "Cmt", skor: 108 },
  { gun: "Paz", skor: 115 },
];

export default function HeroChartPreview() {
  return (
      <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-[#111]/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl border border-white/5 relative overflow-hidden"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">
              GERÇEK ZAMANLI VERİ
            </h4>
            <p className="text-sm font-bold text-white uppercase italic">Güç Skoru Trendi</p>
          </div>
          <div className="flex gap-1.5 text-green-500">
            <span className="text-[10px] font-bold">CANLI</span>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mt-1" />
          </div>
        </div>

        {/* DURUM ETİKETLERİ */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Status label="Plateau Riski" color="red" />
          <Status label="Pozitif Trend" color="green" />
          <Status label="Stabil" color="blue" />
        </div>

        {/* GRAFİK */}
        <div className="w-full h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} opacity={0.3} />
              <XAxis dataKey="gun" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip
                  contentStyle={{ backgroundColor: "#000", border: "1px solid #27272a", borderRadius: "10px", fontSize: "12px" }}
                  itemStyle={{ color: "#22c55e" }}
                  labelStyle={{ color: "#52525b", marginBottom: "4px" }}
              />
              <Line
                  type="monotone"
                  dataKey="skor"
                  stroke="#22c55e"
                  strokeWidth={4}
                  dot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }}
                  activeDot={{ r: 6, stroke: "#000", strokeWidth: 2 }}
                  animationDuration={2000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ALT BİLGİ */}
        <div className="mt-6 pt-5 border-t border-zinc-800/50 flex justify-between items-center">
          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            <span className="text-white border-b border-green-500">1H</span>
            <span>1A</span>
            <span>3A</span>
          </div>

          <div className="flex gap-4">
            <Info label="Zirve" value="140" />
            <Info label="Güncel" value="115" />
          </div>
        </div>
      </motion.div>
  );
}

// Alt Bileşenler (Türkçe)
function Status({ label, color }: { label: string; color: "red" | "green" | "blue" }) {
  const map = {
    red: "bg-red-500/10 text-red-500 border-red-500/20",
    green: "bg-green-500/10 text-green-500 border-green-500/20",
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };
  return (
      <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${map[color]}`}>
      {label}
    </span>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
      <div className="flex flex-col items-end">
        <span className="text-[9px] text-zinc-600 uppercase font-black">{label}</span>
        <span className="text-sm font-black text-white">{value}</span>
      </div>
  );
}