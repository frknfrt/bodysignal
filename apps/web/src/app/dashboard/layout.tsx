import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col lg:flex-row bg-[#0a0a0a] min-h-screen">
            <Sidebar />
            {/* Mobilde sidebar header'ı olduğu için pt-20, desktopta ml-64 (sidebar genişliği) */}
            <main className="flex-1 lg:ml-64 p-4 md:p-8 pt-24 lg:pt-8 transition-all">
                {children}
            </main>
        </div>
    );
}