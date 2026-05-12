"use client";
import HeroText from "./HeroText";
import HeroChartPreview from "./HeroChartPreview";

export default function HeroSection() {
    return (
        <section className="relative py-12 md:py-24 border-b border-white/5 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-green-500/[0.03] blur-[120px] rounded-full pointer-events-none" />

            {/* container ve px-4 ekleyerek mobilde yanlara yapışmasını önledik */}
            <div className="container mx-auto px-4 md:px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    <HeroText />
                    {/* Grafik mobilde çok yer kaplamasın diye w-full ve max-w ekledik */}
                    <div className="w-full max-w-[500px] mx-auto lg:max-w-none">
                        <HeroChartPreview />
                    </div>
                </div>
            </div>
        </section>
    );
}