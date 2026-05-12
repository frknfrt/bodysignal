"use client";

import { useRouter } from 'next/navigation'; // Yönlendirme için gerekli
import React from 'react';

export default function LoginPage() {
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Burada normalde API kontrolü yapılır (e-posta/şifre doğru mu diye)
        // Şimdilik direkt dashboard'a yönlendiriyoruz:
        router.push('/dashboard');
    };

    return (
        // ... mevcut kodların
        <form onSubmit={handleLogin} className="space-y-6">
            {/* Inputlar... */}
            <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-500 ..."
            >
                Giriş Yap
            </button>
        </form>
        // ...
    );
}