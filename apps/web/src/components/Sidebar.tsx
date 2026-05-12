"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // useRouter eklendi
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
    {
        name: 'Dashboard',
        path: '/dashboard',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    },
    {
        name: 'Sinyal Girişi',
        path: '/dashboard/input',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    },
    {
        name: 'Profil',
        path: '/dashboard/profile',
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
    },
    {
        name: 'Ayarlar',
        path: '/dashboard/settings',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
    },
];

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter(); // Router'ı tanımladık

    const handleLogout = () => {
        // İleride burada oturum temizleme işlemleri yapılacak
        router.push('/'); // Ana sayfaya yönlendir
    };

    return (
        <>
            {/* Mobil Header / Hamburger Butonu */}
            <div className="lg:hidden fixed top-0 left-0 w-full bg-[#0d0d0d] border-b border-gray-800 p-4 z-50 flex justify-between items-center px-6">
                <h2 className="text-lg font-bold text-white tracking-tighter">BodySignal<span className="text-green-500">.</span></h2>
                <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
                    </svg>
                </button>
            </div>

            {/* Sidebar Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-md"
                    />
                )}
            </AnimatePresence>

            {/* Ana Sidebar */}
            <div className={`
                fixed left-0 top-0 h-screen bg-[#0d0d0d] border-r border-gray-800 z-50 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                w-72 lg:translate-x-0 
                ${isOpen ? 'translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.5)]' : '-translate-x-full'}
            `}>
                <div className="p-8 hidden lg:block text-center border-b border-white/5">
                    <h2 className="text-2xl font-bold tracking-tighter text-white uppercase italic">BodySignal<span className="text-green-500 text-3xl not-italic">.</span></h2>
                </div>

                <nav className="flex-1 px-4 mt-24 lg:mt-6 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link key={item.name} href={item.path} onClick={() => setIsOpen(false)}>
                                <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${isActive ? 'bg-green-500/10 text-green-500' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                                    <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-green-500' : 'text-gray-600 group-hover:text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                    </svg>
                                    <span className="font-semibold text-sm tracking-tight">{item.name}</span>

                                    {isActive && (
                                        <motion.div
                                            layoutId="activePill"
                                            className="absolute left-0 w-1 h-6 bg-green-500 rounded-r-full"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-800/50">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-gray-500 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all group"
                    >
                        <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="text-sm font-bold tracking-tight">Çıkış Yap</span>
                    </button>
                </div>
            </div>
        </>
    );
}