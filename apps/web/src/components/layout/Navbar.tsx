"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
            isScrolled ? "bg-black/90 backdrop-blur-md border-b border-white/10 h-16" : "bg-transparent h-20"
        }`}>
            <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
                <Link href="/" className="font-black text-xl tracking-tighter group italic">
                    BODY<span className="text-green-500">SIGNAL</span>
                </Link>

                {/* Desktop Nav - Mobilde gizle */}
                <nav className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-widest text-gray-400 items-center">
                    <Link href="/" className="hover:text-white transition-colors">Anasayfa</Link>
                    <a href="#nasil-calisir" className="hover:text-white transition-colors">Nasıl Çalışır</a>
                    <Link href="/about" className="hover:text-white transition-colors">Hakkımızda</Link>
                    <Link
                        href="/login"
                        className="text-white hover:text-green-500 transition-colors border-l border-white/10 pl-8 ml-2"
                    >
                        Giriş Yap
                    </Link>
                </nav>

                {/* Mobil Giriş Butonu - Sadece mobilde görünür */}
                <Link href="/login" className="md:hidden text-[10px] font-black uppercase tracking-widest bg-green-500 text-black px-4 py-2 rounded-full">
                    Giriş
                </Link>
            </div>
        </header>
    );
}