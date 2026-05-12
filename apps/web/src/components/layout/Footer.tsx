"use client";

export default function Footer() {
    return (
        <footer className="py-20 border-t border-white/5 bg-[#0a0a0a]">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                {/* Sol Kısım */}
                <div className="flex flex-col items-center md:items-start gap-2">
          <span className="text-lg font-black uppercase italic tracking-tighter">
            BodySignal<span className="text-green-500">.</span>
          </span>
                    <p className="text-zinc-600 text-xs font-medium">
                        Performansını bilimle, sinyallerle yönet.
                    </p>
                </div>

                {/* Orta Kısım - Linkler */}
                <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <a href="#" className="hover:text-zinc-300 transition-colors">Gizlilik</a>
                    <a href="#" className="hover:text-zinc-300 transition-colors">Şartlar</a>
                    <a href="#" className="hover:text-zinc-300 transition-colors">İletişim</a>
                </div>

                {/* Sağ Kısım - Copyright */}
                <div className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">
                    © 2026 BodySignal Engine — Tüm Hakları Saklıdır.
                </div>
            </div>
        </footer>
    );
}